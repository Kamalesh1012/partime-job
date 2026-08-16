"""
Admin routes - Admin management and verification endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
import httpx

router = APIRouter()


# ==================== Request/Response Models ====================

class VerifyEmployerRequest(BaseModel):
    is_verified: bool = True


async def get_db():
    """Database dependency"""
    from supabase import create_client
    
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_KEY
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    
    return create_client(supabase_url, supabase_key)


# ==================== Endpoints ====================

@router.get("/employers", response_model=dict)
async def get_unverified_employers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get list of unverified employers (admin only)
    """
    try:
        response = db.table("employer_profiles")\
            .select("*")\
            .eq("is_verified", False)\
            .range(skip, skip + limit)\
            .execute()
        
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


@router.post("/employers/{employer_id}/verify", response_model=dict)
async def verify_employer(
    employer_id: str,
    request: VerifyEmployerRequest,
    db = Depends(get_db)
):
    """
    Verify or unverify an employer (admin only)
    """
    try:
        response = db.table("employer_profiles")\
            .update({"is_verified": request.is_verified})\
            .eq("id", employer_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Employer verification status updated successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/reports", response_model=dict)
@router.get("/jobs/reported", response_model=dict)
async def get_reported_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get reported jobs for moderation (admin only)
    """
    try:
        response = db.table("reports")\
            .select("*, jobs(*)")\
            .range(skip, skip + limit - 1)\
            .execute()
        
        return {
            "status": "success",
            "data": response.data or [],
            "total": len(response.data or [])
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/reports/{job_id}", response_model=dict)
async def report_job(
    job_id: str,
    reason: str = Query(...),
    student_id: Optional[str] = Query(None),
    db = Depends(get_db)
):
    """
    Report a fake or inappropriate job posting
    """
    try:
        res = db.table("reports").insert({
            "job_id": job_id,
            "reason": reason,
            "student_id": student_id,
            "report_type": "fake_job"
        }).execute()
        return {
            "status": "success",
            "message": "Job report submitted successfully",
            "data": res.data[0] if res.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/jobs/{job_id}", response_model=dict)
async def delete_job_admin(
    job_id: str,
    reason: Optional[str] = Query(None),
    db = Depends(get_db)
):
    """
    Admin removal of a job posting
    """
    try:
        db.table("jobs").update({"is_active": False}).eq("id", job_id).execute()
        return {
            "status": "success",
            "message": f"Job deactivated. Reason: {reason or 'Admin moderation'}"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/jobs/{job_id}/moderate", response_model=dict)
async def moderate_job(
    job_id: str,
    action: str = Query("remove", pattern="^(remove|restore)$"),
    db = Depends(get_db)
):
    """
    Take moderation action on a job (admin only)
    """
    try:
        is_active = action != "remove"
        response = db.table("jobs")\
            .update({"is_active": is_active})\
            .eq("id", job_id)\
            .execute()
        
        return {
            "status": "success",
            "message": f"Job {action}d successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/analytics", response_model=dict)
@router.get("/statistics", response_model=dict)
async def get_admin_statistics(db = Depends(get_db)):
    """
    Get platform statistics for admin dashboard
    """
    try:
        users = db.table("users").select("count", count="exact").execute()
        students = db.table("student_profiles").select("count", count="exact").execute()
        employers = db.table("employer_profiles").select("count", count="exact").execute()
        jobs = db.table("jobs").select("count", count="exact").execute()
        applications = db.table("applications").select("count", count="exact").execute()
        
        return {
            "status": "success",
            "data": {
                "total_users": users.count or 0,
                "total_students": students.count or 0,
                "total_employers": employers.count or 0,
                "total_jobs": jobs.count or 0,
                "total_applications": applications.count or 0
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
