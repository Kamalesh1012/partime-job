"""
User Profiles routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models import (
    StudentProfileCreate, StudentProfileUpdate,
    EmployerProfileCreate, EmployerProfileUpdate
)
from config import get_db

router = APIRouter()

# ==================== Student Profile Routes ====================

@router.get("/student/{user_id}", response_model=dict)
async def get_student_profile(user_id: str, db = Depends(get_db)):
    """
    Get student profile
    """
    try:
        response = db.table("student_profiles")\
            .select("*")\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
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

@router.put("/student/{user_id}", response_model=dict)
async def update_student_profile(
    user_id: str,
    profile_data: StudentProfileUpdate,
    db = Depends(get_db)
):
    """
    Update student profile
    """
    try:
        update_data = profile_data.dict(exclude_unset=True)
        
        response = db.table("student_profiles")\
            .update(update_data)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== Employer Profile Routes ====================

@router.get("/employer/{user_id}", response_model=dict)
async def get_employer_profile(user_id: str, db = Depends(get_db)):
    """
    Get employer profile
    """
    try:
        response = db.table("employer_profiles")\
            .select("*")\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employer profile not found"
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

@router.put("/employer/{user_id}", response_model=dict)
async def update_employer_profile(
    user_id: str,
    profile_data: EmployerProfileUpdate,
    db = Depends(get_db)
):
    """
    Update employer profile
    """
    try:
        update_data = profile_data.dict(exclude_unset=True)
        
        response = db.table("employer_profiles")\
            .update(update_data)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employer profile not found"
            )
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/employer/{user_id}/stats", response_model=dict)
async def get_employer_stats(user_id: str, db = Depends(get_db)):
    """
    Get employer statistics
    """
    try:
        # Get employer's jobs
        jobs = db.table("jobs")\
            .select("id, applications_count")\
            .eq("employer_id", user_id)\
            .execute()
        
        total_jobs = len(jobs.data) if jobs.data else 0
        total_applications = sum(job["applications_count"] for job in (jobs.data or []))
        
        # Get active jobs
        active_jobs = db.table("jobs")\
            .select("id")\
            .eq("employer_id", user_id)\
            .eq("is_active", True)\
            .execute()
        
        active_count = len(active_jobs.data) if active_jobs.data else 0
        
        return {
            "status": "success",
            "data": {
                "total_jobs": total_jobs,
                "active_jobs": active_count,
                "total_applications": total_applications
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== Saved Jobs ====================

@router.post("/saved-jobs/{job_id}", response_model=dict)
async def save_job(job_id: str, student_id: str, db = Depends(get_db)):
    """
    Save a job
    """
    try:
        # Check if already saved
        existing = db.table("saved_jobs")\
            .select("*")\
            .eq("student_id", student_id)\
            .eq("job_id", job_id)\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job already saved"
            )
        
        response = db.table("saved_jobs").insert({
            "student_id": student_id,
            "job_id": job_id
        }).execute()
        
        return {
            "status": "success",
            "message": "Job saved successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/saved-jobs/{job_id}", response_model=dict)
async def unsave_job(job_id: str, student_id: str, db = Depends(get_db)):
    """
    Unsave a job
    """
    try:
        db.table("saved_jobs")\
            .delete()\
            .eq("student_id", student_id)\
            .eq("job_id", job_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Job unsaved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/saved-jobs/{student_id}", response_model=dict)
async def get_saved_jobs(student_id: str, db = Depends(get_db)):
    """
    Get all saved jobs by a student
    """
    try:
        response = db.table("saved_jobs")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("saved_at", desc=True)\
            .execute()
        
        return {
            "status": "success",
            "data": response.data,
            "total": len(response.data) if response.data else 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
