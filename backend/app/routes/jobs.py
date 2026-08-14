from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    description: str
    location: Optional[str]
    category: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]

@router.get('/', response_model=List[dict])
async def list_jobs(q: Optional[str] = None, location: Optional[str] = None):
    # Placeholder: return sample jobs
    sample = [
        {"id":"1","title":"Cafe Staff - OMR","location":"OMR","category":"Cafe Staff","salary_min":15000},
        {"id":"2","title":"Data Entry - Velachery","location":"Velachery","category":"Data Entry","salary_min":12000}
    ]
    return sample

@router.post('/', status_code=201)
async def create_job(payload: JobCreate):
    # Store job in Supabase in real implementation
    return {"message":"Job created (placeholder)", "job": payload}
