"""
Admin routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from config import get_db

router = APIRouter()

@router.get("/employers", response_model=dict)
async def get_unverified_employers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get unverified employers (admin only)
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
async def verify_employer(employer_id: str, db = Depends(get_db)):
    """
    Verify an employer (admin only)
    """
    try:
        response = db.table("employer_profiles")\
            .update({"is_verified": True})\
            .eq("id", employer_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Employer verified successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/jobs/{job_id}", response_model=dict)
async def remove_fake_job(job_id: str, reason: str = Query(...), db = Depends(get_db)):
    """
    Remove a fake or inappropriate job (admin only)
    """
    try:
        db.table("jobs").delete().eq("id", job_id).execute()
        
        # Log the removal
        db.table("reports").insert({
            "report_type": "job_removed",
            "job_id": job_id,
            "reason": reason,
            "admin_action": "removed"
        }).execute()
        
        return {
            "status": "success",
            "message": "Job removed successfully",
            "reason": reason
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/reports", response_model=dict)
async def get_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get scam reports (admin only)
    """
    try:
        response = db.table("reports")\
            .select("*")\
            .order("created_at", desc=True)\
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

@router.post("/reports/{job_id}", response_model=dict)
async def report_job(
    job_id: str,
    reason: str = Query(...),
    student_id: str = Query(...),
    db = Depends(get_db)
):
    """
    Report a suspicious/scam job
    """
    try:
        response = db.table("reports").insert({
            "job_id": job_id,
            "student_id": student_id,
            "reason": reason,
            "report_type": "scam_report"
        }).execute()
        
        return {
            "status": "success",
            "message": "Report submitted successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/analytics", response_model=dict)
async def get_analytics(db = Depends(get_db)):
    """
    Get platform analytics (admin only)
    """
    try:
        # Get user stats
        users = db.table("users").select("id").execute()
        total_users = len(users.data) if users.data else 0
        
        students = db.table("users").select("id").eq("user_type", "student").execute()
        total_students = len(students.data) if students.data else 0
        
        employers = db.table("users").select("id").eq("user_type", "employer").execute()
        total_employers = len(employers.data) if employers.data else 0
        
        # Get job stats
        jobs = db.table("jobs").select("id").execute()
        total_jobs = len(jobs.data) if jobs.data else 0
        
        active_jobs = db.table("jobs").select("id").eq("is_active", True).execute()
        total_active = len(active_jobs.data) if active_jobs.data else 0
        
        # Get application stats
        applications = db.table("applications").select("id").execute()
        total_applications = len(applications.data) if applications.data else 0
        
        return {
            "status": "success",
            "data": {
                "users": {
                    "total": total_users,
                    "students": total_students,
                    "employers": total_employers
                },
                "jobs": {
                    "total": total_jobs,
                    "active": total_active
                },
                "applications": {
                    "total": total_applications
                }
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
