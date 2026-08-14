"""
Job Applications routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from models import ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationStatus
from config import get_db
from typing import List

router = APIRouter()

@router.post("/", response_model=dict)
async def create_application(
    app_data: ApplicationCreate,
    student_id: str,
    db = Depends(get_db)
):
    """
    Apply for a job
    """
    try:
        # Check if already applied
        existing = db.table("applications")\
            .select("*")\
            .eq("student_id", student_id)\
            .eq("job_id", app_data.job_id)\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already applied to this job"
            )
        
        # Create application
        response = db.table("applications").insert({
            "student_id": student_id,
            "job_id": app_data.job_id,
            "status": ApplicationStatus.PENDING.value,
            "cover_letter": app_data.cover_letter
        }).execute()
        
        # Increment job applications count
        job = db.table("jobs").select("applications_count").eq("id", app_data.job_id).single().execute()
        if job.data:
            count = job.data.get("applications_count", 0) + 1
            db.table("jobs").update({"applications_count": count}).eq("id", app_data.job_id).execute()
        
        return {
            "status": "success",
            "message": "Application submitted successfully",
            "data": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/student/{student_id}", response_model=dict)
async def get_student_applications(
    student_id: str,
    status_filter: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get all applications by a student
    """
    try:
        query = db.table("applications").select("*").eq("student_id", student_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.order("applied_at", desc=True).range(skip, skip + limit).execute()
        
        return {
            "status": "success",
            "data": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/job/{job_id}", response_model=dict)
async def get_job_applications(
    job_id: str,
    status_filter: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get all applications for a job (employer only)
    """
    try:
        query = db.table("applications").select("*").eq("job_id", job_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.order("applied_at", desc=True).range(skip, skip + limit).execute()
        
        return {
            "status": "success",
            "data": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{application_id}", response_model=dict)
async def get_application(application_id: str, db = Depends(get_db)):
    """
    Get application details
    """
    try:
        response = db.table("applications")\
            .select("*")\
            .eq("id", application_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        return {
            "status": "success",
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{application_id}", response_model=dict)
async def update_application(
    application_id: str,
    update_data: ApplicationUpdate,
    employer_id: str,
    db = Depends(get_db)
):
    """
    Update application status (employer only)
    """
    try:
        # Get application and verify job ownership
        app = db.table("applications")\
            .select("*")\
            .eq("id", application_id)\
            .single()\
            .execute()
        
        if not app.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        job = db.table("jobs")\
            .select("*")\
            .eq("id", app.data["job_id"])\
            .single()\
            .execute()
        
        if not job.data or job.data["employer_id"] != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this application"
            )
        
        response = db.table("applications")\
            .update({"status": update_data.status.value})\
            .eq("id", application_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Application updated successfully",
            "data": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{application_id}", response_model=dict)
async def withdraw_application(application_id: str, student_id: str, db = Depends(get_db)):
    """
    Withdraw an application
    """
    try:
        # Verify ownership
        app = db.table("applications")\
            .select("*")\
            .eq("id", application_id)\
            .single()\
            .execute()
        
        if not app.data or app.data["student_id"] != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to withdraw this application"
            )
        
        db.table("applications").delete().eq("id", application_id).execute()
        
        # Decrement job applications count
        job_id = app.data["job_id"]
        job = db.table("jobs").select("applications_count").eq("id", job_id).single().execute()
        if job.data:
            count = max(0, job.data.get("applications_count", 1) - 1)
            db.table("jobs").update({"applications_count": count}).eq("id", job_id).execute()
        
        return {
            "status": "success",
            "message": "Application withdrawn successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
