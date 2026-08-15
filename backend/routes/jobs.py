"""
Jobs routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.models import JobCreate, JobUpdate, JobResponse, JobSearchFilter
from backend.config import get_db
from typing import List

router = APIRouter()

@router.get("/", response_model=dict)
async def get_jobs(
    category: str = Query(None),
    location: str = Query(None),
    job_type: str = Query(None),
    salary_min: float = Query(None),
    salary_max: float = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get all jobs with optional filters
    """
    try:
        query = db.table("jobs").select("*").eq("is_active", True)
        
        if category:
            query = query.eq("category", category)
        if location:
            query = query.eq("location", location)
        if job_type:
            query = query.eq("job_type", job_type)
        if salary_min:
            query = query.gte("salary_min", salary_min)
        if salary_max:
            query = query.lte("salary_max", salary_max)
        
        response = query.range(skip, skip + limit).execute()
        
        return {
            "status": "success",
            "data": response.data,
            "total": len(response.data),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/trending", response_model=dict)
async def get_trending_jobs(
    limit: int = Query(10, ge=1, le=50),
    db = Depends(get_db)
):
    """
    Get trending/popular jobs
    """
    try:
        response = db.table("jobs")\
            .select("*")\
            .eq("is_active", True)\
            .order("applications_count", desc=True)\
            .limit(limit)\
            .execute()
        
        return {
            "status": "success",
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/search", response_model=dict)
async def search_jobs(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Search jobs by keyword
    """
    try:
        response = db.table("jobs")\
            .select("*")\
            .eq("is_active", True)\
            .or_(f"title.ilike.%{q}%,description.ilike.%{q}%")\
            .range(skip, skip + limit)\
            .execute()
        
        return {
            "status": "success",
            "data": response.data,
            "query": q
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{job_id}", response_model=dict)
async def get_job(job_id: str, db = Depends(get_db)):
    """
    Get job details
    """
    try:
        response = db.table("jobs")\
            .select("*")\
            .eq("id", job_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
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

@router.post("/", response_model=dict)
async def create_job(job_data: JobCreate, employer_id: str, db = Depends(get_db)):
    """
    Create a new job posting (employer only)
    """
    try:
        response = db.table("jobs").insert({
            "employer_id": employer_id,
            "title": job_data.title,
            "description": job_data.description,
            "category": job_data.category.value,
            "job_type": job_data.job_type.value,
            "location": job_data.location.value,
            "salary_min": job_data.salary_min,
            "salary_max": job_data.salary_max,
            "salary_currency": job_data.salary_currency,
            "experience_required": job_data.experience_required,
            "skills_required": job_data.skills_required,
            "application_deadline": job_data.application_deadline,
            "is_active": job_data.is_active,
            "applications_count": 0
        }).execute()
        
        return {
            "status": "success",
            "message": "Job posted successfully",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{job_id}", response_model=dict)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    employer_id: str,
    db = Depends(get_db)
):
    """
    Update job posting (employer only)
    """
    try:
        # Verify ownership
        job = db.table("jobs")\
            .select("*")\
            .eq("id", job_id)\
            .single()\
            .execute()
        
        if not job.data or job.data["employer_id"] != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this job"
            )
        
        update_data = job_data.dict(exclude_unset=True)
        # Convert enums to strings
        if "category" in update_data and update_data["category"]:
            update_data["category"] = update_data["category"].value
        if "job_type" in update_data and update_data["job_type"]:
            update_data["job_type"] = update_data["job_type"].value
        if "location" in update_data and update_data["location"]:
            update_data["location"] = update_data["location"].value
        
        response = db.table("jobs")\
            .update(update_data)\
            .eq("id", job_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Job updated successfully",
            "data": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{job_id}", response_model=dict)
async def delete_job(job_id: str, employer_id: str, db = Depends(get_db)):
    """
    Delete job posting (employer only)
    """
    try:
        # Verify ownership
        job = db.table("jobs")\
            .select("*")\
            .eq("id", job_id)\
            .single()\
            .execute()
        
        if not job.data or job.data["employer_id"] != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this job"
            )
        
        db.table("jobs").delete().eq("id", job_id).execute()
        
        return {
            "status": "success",
            "message": "Job deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
