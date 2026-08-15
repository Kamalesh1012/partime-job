from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from backend.app.core.config import settings
import httpx
from datetime import datetime

router = APIRouter()

class StudentProfile(BaseModel):
    user_id: str
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    photo_url: Optional[str]
    skills: Optional[list] = None
    availability: Optional[str] = None
    education: Optional[str] = None
    college: Optional[str] = None
    preferred_categories: Optional[list] = None
    preferred_locations: Optional[list] = None
    available_days: Optional[str] = None
    available_hours: Optional[str] = None
    expected_salary: Optional[float] = None
    previous_experience: Optional[str] = None


@router.get('/student/{user_id}')
async def get_student_profile(user_id: str):
    # Fetch student profile from Supabase
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers, params={"select":"*","user_id":"eq."+user_id})
    if resp.status_code not in (200,206):
        raise HTTPException(status_code=404, detail="Profile not found")
    items = resp.json()
    if not items:
        raise HTTPException(status_code=404, detail="Profile not found")
    return items[0]

@router.put('/student/{user_id}')
async def update_student_profile(user_id: str, profile: StudentProfile):
    # Update student profile via Supabase REST
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json", "Prefer": "return=representation"}
    payload = profile.dict(exclude_unset=True)
    payload['user_id'] = user_id
    async with httpx.AsyncClient() as client:
        # upsert by user_id
        resp = await client.post(rest_url, headers=headers, json=payload)
    if resp.status_code not in (200,201):
        raise HTTPException(status_code=500, detail="Failed to update profile")
    created = resp.json()
    return created[0] if isinstance(created, list) else created


@router.post('/student/{user_id}/aadhaar')
async def upload_aadhaar(user_id: str, file: UploadFile = File(...)):
    # Validate file type and size
    allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type")

    contents = await file.read()
    max_size = 5 * 1024 * 1024  # 5 MB
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File too large")

    # Upload to private Supabase storage bucket using service role key
    bucket = 'aadhaar-docs'
    filename = f"{user_id}/{int(datetime.utcnow().timestamp())}_{file.filename}"
    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{filename}"
    service_key = settings.SUPABASE_KEY
    headers = {"Authorization": f"Bearer {service_key}", "apikey": service_key, "Content-Type": file.content_type}

    async with httpx.AsyncClient() as client:
        resp = await client.post(upload_url, content=contents, headers=headers)
    if resp.status_code not in (200,201,204):
        raise HTTPException(status_code=500, detail="Failed to upload Aadhaar document")

    # Update student_profiles with aadhaar_verification_status = 'pending' and store path (but do NOT return path)
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    headers2 = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json", "Prefer": "return=representation"}
    payload = {"aadhaar_verification_status":"pending", "aadhaar_doc_path": filename, "user_id": user_id}
    async with httpx.AsyncClient() as client:
        up = await client.post(rest_url, headers=headers2, json=payload)
    if up.status_code not in (200,201):
        raise HTTPException(status_code=500, detail="Failed to mark Aadhaar pending")

    return {"message":"Aadhaar uploaded and pending verification"}
