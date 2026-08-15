from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from backend.app.core.config import settings
import httpx
from datetime import datetime

router = APIRouter()

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: str = None

@router.post('/')
async def apply(application: ApplicationCreate, request: Request):
    # student identity is taken from Authorization header (JWT) or X-Student-ID header
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
        # fallback to header
        student_id = request.headers.get('X-Student-ID')
    if not student_id:
        raise HTTPException(status_code=401, detail='Student not authenticated')

    # Create application in Supabase
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/applications"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json", "Prefer": "return=representation"}
    payload = {"student_id": student_id, "job_id": application.job_id, "cover_letter": application.cover_letter}
    async with httpx.AsyncClient() as client:
        resp = await client.post(rest_url, headers=headers, json=payload)
    if resp.status_code not in (200,201):
        raise HTTPException(status_code=500, detail='Failed to create application')
    created = resp.json()
    app_row = created[0] if isinstance(created, list) else created

    # Increment applications_count on job (best-effort)
    job_url = f"{settings.SUPABASE_URL}/rest/v1/jobs"
    async with httpx.AsyncClient() as client:
        # Increment via patch
        await client.patch(job_url, headers=headers, params={"id":"eq."+application.job_id}, json={"applications_count":"applications_count+1"})

    # Fetch student profile to include in employer view (don't include aadhaar_doc_path)
    profile_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    user_url = f"{settings.SUPABASE_URL}/rest/v1/users"
    async with httpx.AsyncClient() as client:
        p = await client.get(profile_url, headers=headers, params={"select":"*","user_id":"eq."+student_id})
        u = await client.get(user_url, headers=headers, params={"select":"*","id":"eq."+student_id})
    student_profile = p.json()[0] if p.status_code in (200,206) and p.json() else {}
    user_row = u.json()[0] if u.status_code in (200,206) and u.json() else {}
    # remove sensitive fields
    student_profile.pop('aadhaar_doc_path', None)

    return {"application": app_row, "applicant": {
        "name": user_row.get('full_name') if user_row else None,
        "photo_url": student_profile.get('photo_url') if student_profile else None,
        "education": student_profile.get('education') if student_profile else None,
        "skills": student_profile.get('skills') if student_profile else None,
        "location": student_profile.get('location') if student_profile else None,
        "availability": student_profile.get('availability') if student_profile else None,
        "previous_experience": student_profile.get('previous_experience') if student_profile else None,
        "aadhaar_verification_status": student_profile.get('aadhaar_verification_status') if student_profile else None,
        "applied_at": app_row.get('applied_at')
    }}

@router.get('/{application_id}')
async def get_application(application_id: str):
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/applications"
    service_key = settings.SUPABASE_KEY
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers, params={"select":"*","id":"eq."+application_id})
    if resp.status_code not in (200,206):
        raise HTTPException(status_code=404, detail="Application not found")
    items = resp.json()
    if not items:
        raise HTTPException(status_code=404, detail="Application not found")
    app_row = items[0]
    # attach applicant brief
    profile_url = f"{settings.SUPABASE_URL}/rest/v1/student_profiles"
    async with httpx.AsyncClient() as client:
        p = await client.get(profile_url, headers=headers, params={"select":"*","user_id":"eq."+app_row.get('student_id')})
    student_profile = p.json()[0] if p.status_code in (200,206) and p.json() else {}
    student_profile.pop('aadhaar_doc_path', None)
    return {"application": app_row, "applicant": student_profile}
