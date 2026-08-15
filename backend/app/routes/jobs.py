"""
Jobs routes - Full implementation for creating, reading, updating, and deleting jobs
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings
import httpx

router = APIRouter()


# ==================== Request/Response Models ====================

class JobCreate(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    category: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = "INR"
    experience_required: Optional[str] = None
    skills_required: Optional[List[str]] = None
    application_deadline: Optional[str] = None
    is_active: bool = True


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    experience_required: Optional[str] = None
    skills_required: Optional[List[str]] = None
    application_deadline: Optional[str] = None
    is_active: Optional[bool] = None


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

@router.get("/", response_model=dict)
async def list_jobs(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    salary_min: Optional[float] = Query(None),
    salary_max: Optional[float] = Query(None),
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
    Get trending/popular jobs ordered by application count
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
    Search jobs by keyword in title and description
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
async def get_job_details(job_id: str, db = Depends(get_db)):
    """
    Get details for a specific job
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/", status_code=201, response_model=dict)
async def create_job(
    job_data: JobCreate,
    employer_id: str = Query(...),
    db = Depends(get_db)
):
    """
    Create a new job posting (employer only)
    """
    try:
        response = db.table("jobs").insert({
            "employer_id": employer_id,
            "title": job_data.title,
            "description": job_data.description,
            "category": job_data.category,
            "job_type": job_data.category,  # Using category as job_type if not separated
            "location": job_data.location,
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
    employer_id: str = Query(...),
    db = Depends(get_db)
):
    """
    Update a job posting (employer only)
    """
    try:
        # Verify ownership
        job = db.table("jobs")\
            .select("*")\
            .eq("id", job_id)\
            .single()\
            .execute()
        
        if not job.data or job.data.get("employer_id") != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this job"
            )
        
        update_data = {k: v for k, v in job_data.dict().items() if v is not None}
        
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
async def delete_job(
    job_id: str,
    employer_id: str = Query(...),
    db = Depends(get_db)
):
    """
    Delete a job posting (employer only)
    """
    try:
        # Verify ownership
        job = db.table("jobs")\
            .select("*")\
            .eq("id", job_id)\
            .single()\
            .execute()
        
        if not job.data or job.data.get("employer_id") != employer_id:
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
