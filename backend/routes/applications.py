"""
Job Applications routes - Full implementation for student and employer application workflows
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings
import httpx
from datetime import datetime

router = APIRouter()


class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str


async def get_db():
    from supabase import create_client
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_KEY
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    return create_client(supabase_url, supabase_key)


@router.post("", status_code=201, response_model=dict)
@router.post("/", status_code=201, response_model=dict)
async def create_application(
    application: ApplicationCreate,
    request: Request,
    x_student_id: Optional[str] = Header(None, alias="X-Student-ID"),
    db = Depends(get_db)
):
    """
    Apply for a job
    """
    try:
        # Determine student_id from token or header
        auth = request.headers.get('Authorization')
        student_id = None
        if auth and auth.startswith('Bearer '):
            token = auth.split()[1]
            from jose import jwt
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                student_id = payload.get('sub')
            except Exception:
                student_id = None
        if not student_id:
            student_id = x_student_id

        if not student_id:
            raise HTTPException(status_code=401, detail="Student not authenticated")

        # Resolve student_profiles.id if student_id is user_id
        profile_res = db.table("student_profiles").select("id").eq("user_id", student_id).execute()
        student_profile_id = profile_res.data[0]["id"] if profile_res.data else student_id

        # Check existing application
        existing = db.table("applications")\
            .select("id")\
            .eq("student_id", student_profile_id)\
            .eq("job_id", application.job_id)\
            .execute()

        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied for this job"
            )

        # Create application
        insert_res = db.table("applications").insert({
            "student_id": student_profile_id,
            "job_id": application.job_id,
            "status": "pending",
            "cover_letter": application.cover_letter
        }).execute()

        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to submit application")

        app_data = insert_res.data[0]

        # Increment applications_count on job atomically/safely
        job_res = db.table("jobs").select("applications_count").eq("id", application.job_id).execute()
        if job_res.data:
            current_count = job_res.data[0].get("applications_count") or 0
            db.table("jobs").update({"applications_count": current_count + 1}).eq("id", application.job_id).execute()

        return {
            "status": "success",
            "message": "Application submitted successfully",
            "data": app_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/student/{student_id}", response_model=dict)
async def get_student_applications(
    student_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get all applications submitted by a student
    """
    try:
        # Check if student_id is user_id
        profile_res = db.table("student_profiles").select("id").eq("user_id", student_id).execute()
        target_id = profile_res.data[0]["id"] if profile_res.data else student_id

        query = db.table("applications").select("*, jobs(*)").eq("student_id", target_id)
        if status_filter:
            query = query.eq("status", status_filter)

        res = query.order("applied_at", desc=True).range(skip, skip + limit - 1).execute()
        return {
            "status": "success",
            "data": res.data or [],
            "total": len(res.data or [])
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/job/{job_id}", response_model=dict)
async def get_job_applications(
    job_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get all applicants for a specific job (employer view)
    """
    try:
        query = db.table("applications").select("*, student_profiles(*, users(*))").eq("job_id", job_id)
        if status_filter:
            query = query.eq("status", status_filter)

        res = query.order("applied_at", desc=True).range(skip, skip + limit - 1).execute()
        return {
            "status": "success",
            "data": res.data or [],
            "total": len(res.data or [])
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{application_id}", response_model=dict)
async def get_application(application_id: str, db = Depends(get_db)):
    """
    Get a single application details
    """
    try:
        res = db.table("applications").select("*, jobs(*), student_profiles(*)").eq("id", application_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Application not found")
        return {
            "status": "success",
            "data": res.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{application_id}", response_model=dict)
async def update_application_status(
    application_id: str,
    status_data: ApplicationStatusUpdate,
    x_employer_id: Optional[str] = Header(None, alias="X-Employer-ID"),
    db = Depends(get_db)
):
    """
    Update application status (shortlisted, rejected, hired)
    """
    try:
        res = db.table("applications").update({"status": status_data.status}).eq("id", application_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Application not found")
        return {
            "status": "success",
            "message": f"Application status updated to {status_data.status}",
            "data": res.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{application_id}", response_model=dict)
async def withdraw_application(
    application_id: str,
    x_student_id: Optional[str] = Header(None, alias="X-Student-ID"),
    db = Depends(get_db)
):
    """
    Withdraw an application
    """
    try:
        res = db.table("applications").delete().eq("id", application_id).execute()
        return {
            "status": "success",
            "message": "Application withdrawn successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
