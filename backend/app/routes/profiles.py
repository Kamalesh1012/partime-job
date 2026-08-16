from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
import httpx
from datetime import datetime

router = APIRouter()

class StudentProfile(BaseModel):
    user_id: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
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

class EmployerProfile(BaseModel):
    user_id: Optional[str] = None
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None


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
    # Update student profile via Supabase REST - use PATCH if exists, POST if new
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    service_key = settings.SUPABASE_KEY
    base_headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    payload = profile.dict(exclude_unset=True)
    payload.pop('user_id', None)  # Don't include in update payload

    async with httpx.AsyncClient() as client:
        # Check if profile exists
        check = await client.get(rest_url, headers=base_headers, params={"select": "id", "user_id": "eq." + user_id})
        exists = check.status_code == 200 and len(check.json()) > 0

        if exists:
            # PATCH existing profile
            patch_headers = {**base_headers, "Prefer": "return=representation"}
            resp = await client.patch(rest_url, headers=patch_headers, params={"user_id": "eq." + user_id}, json=payload)
        else:
            # POST new profile
            post_headers = {**base_headers, "Prefer": "return=representation"}
            payload['user_id'] = user_id
            resp = await client.post(rest_url, headers=post_headers, json=payload)

    if resp.status_code not in (200, 201):
        import sys
        print('SUPABASE PROFILE ERROR (student):', resp.status_code, resp.text, file=sys.stderr, flush=True)
        raise HTTPException(status_code=resp.status_code, detail=f"Supabase error: {resp.text}")
    result = resp.json()
    if isinstance(result, list) and len(result) > 0:
        return result[0]
    elif isinstance(result, list) and len(result) == 0:
        return {"message": "Profile updated (no data returned)"}
    return result

@router.get('/employer/{user_id}')
async def get_employer_profile(user_id: str):
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/employer_profiles"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers, params={"select": "*", "user_id": "eq." + user_id})
    if resp.status_code not in (200, 206):
        raise HTTPException(status_code=404, detail="Profile not found")
    items = resp.json()
    if not items:
        raise HTTPException(status_code=404, detail="Profile not found")
    return items[0]

@router.put('/employer/{user_id}')
async def update_employer_profile(user_id: str, profile: EmployerProfile):
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/employer_profiles"
    service_key = settings.SUPABASE_KEY
    base_headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    payload = profile.dict(exclude_unset=True)
    payload.pop('user_id', None)

    async with httpx.AsyncClient() as client:
        # Check if profile exists
        check = await client.get(rest_url, headers=base_headers, params={"select": "id", "user_id": "eq." + user_id})
        exists = check.status_code == 200 and len(check.json()) > 0

        if exists:
            patch_headers = {**base_headers, "Prefer": "return=representation"}
            resp = await client.patch(rest_url, headers=patch_headers, params={"user_id": "eq." + user_id}, json=payload)
        else:
            post_headers = {**base_headers, "Prefer": "return=representation"}
            payload['user_id'] = user_id
            if not payload.get('company_name'):
                payload['company_name'] = 'My Company'
            resp = await client.post(rest_url, headers=post_headers, json=payload)

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=f"Supabase error: {resp.text}")
    result = resp.json()
    if isinstance(result, list) and len(result) > 0:
        return result[0]
    elif isinstance(result, list) and len(result) == 0:
        return {"message": "Profile updated"}
    return result

@router.get('/employer/{user_id}/stats')
async def get_employer_stats(user_id: str):
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/employer_profiles"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers, params={"select":"id","user_id":"eq."+user_id})
    if resp.status_code not in (200,206) or not resp.json():
        raise HTTPException(status_code=404, detail="Profile not found")
    employer_id = resp.json()[0]['id']

    # Get active jobs count
    jobs_url = f"{settings.SUPABASE_URL}/rest/v1/jobs"
    async with httpx.AsyncClient() as client:
        jobs_resp = await client.get(jobs_url, headers=headers, params={"employer_id": "eq."+employer_id, "select": "id", "count": "exact"})
    
    # Return placeholder stats
    return {
        "active_jobs": 0,
        "total_applicants": 0,
        "interviews_scheduled": 0
    }


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
    payload = {"aadhaar_verification_status": "pending", "aadhaar_doc_path": filename}
    async with httpx.AsyncClient() as client:
        up = await client.patch(rest_url, headers=headers2, params={"user_id": "eq." + user_id}, json=payload)
    if up.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to mark Aadhaar pending")

    return {"message":"Aadhaar uploaded and pending verification"}


@router.post('/saved-jobs/{job_id}')
async def save_job(job_id: str, request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    student_id = (data.get("student_id") if isinstance(data, dict) else None) or request.headers.get("X-Student-ID")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")

    rest_url = f"{settings.SUPABASE_URL}/rest/v1/saved_jobs"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json", "Prefer": "return=representation"}
    
    # Resolve student profile id
    prof_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    async with httpx.AsyncClient() as client:
        p_res = await client.get(prof_url, headers=headers, params={"select": "id", "user_id": "eq." + student_id})
        target_student_id = p_res.json()[0]["id"] if p_res.status_code == 200 and p_res.json() else student_id
        resp = await client.post(rest_url, headers=headers, json={"student_id": target_student_id, "job_id": job_id})

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail="Job already saved or could not be saved")
    return {"status": "success", "message": "Job saved successfully"}


@router.delete('/saved-jobs/{job_id}')
async def unsave_job(job_id: str, request: Request):
    student_id = request.headers.get("X-Student-ID")
    if not student_id:
        raise HTTPException(status_code=400, detail="X-Student-ID header required")

    rest_url = f"{settings.SUPABASE_URL}/rest/v1/saved_jobs"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    
    prof_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    async with httpx.AsyncClient() as client:
        p_res = await client.get(prof_url, headers=headers, params={"select": "id", "user_id": "eq." + student_id})
        target_student_id = p_res.json()[0]["id"] if p_res.status_code == 200 and p_res.json() else student_id
        resp = await client.delete(rest_url, headers=headers, params={"student_id": "eq." + target_student_id, "job_id": "eq." + job_id})

    return {"status": "success", "message": "Job removed from saved list"}


@router.get('/saved-jobs/{student_id}')
async def get_saved_jobs(student_id: str):
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/saved_jobs"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    
    prof_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    async with httpx.AsyncClient() as client:
        p_res = await client.get(prof_url, headers=headers, params={"select": "id", "user_id": "eq." + student_id})
        target_student_id = p_res.json()[0]["id"] if p_res.status_code == 200 and p_res.json() else student_id
        resp = await client.get(rest_url, headers=headers, params={"select": "*, jobs(*)", "student_id": "eq." + target_student_id})

    return {"status": "success", "data": resp.json() if resp.status_code == 200 else []}

