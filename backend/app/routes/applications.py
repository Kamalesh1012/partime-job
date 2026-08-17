"""
SEWAA India - Job Applications Management API
Handles Worker application submission, duplicate prevention, Employer review, Shortlisting, Acceptance, and Notifications
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import httpx

from app.core.config import settings

router = APIRouter()

# In-memory resilient applications store
_LOCAL_APPLICATIONS = [
    {
        "id": "app-demo-01",
        "job_id": "job-chn-omr-02",
        "student_id": "demo-worker",
        "worker_id": "demo-worker",
        "status": "shortlisted",
        "cover_letter": "I have 2 years of retail and billing experience at Spencer's Daily.",
        "applied_at": "2026-08-16T10:00:00",
        "updated_at": "2026-08-16T14:30:00",
        "applicant_name": "Arun Kumar",
        "applicant_phone": "+91 98401 23456",
        "job_title": "Supermarket Cashier & Billing Assistant",
        "company_name": "Nilgiris Supermarket",
        "salary_display": "₹600 - ₹800 /day",
        "location_display": "Perungudi, Chennai",
    },
    {
        "id": "app-demo-02",
        "job_id": "job-chn-shol-01",
        "student_id": "demo-worker",
        "worker_id": "demo-worker",
        "status": "accepted",
        "cover_letter": "Available immediately for evening deliveries on two-wheeler.",
        "applied_at": "2026-08-15T09:00:00",
        "updated_at": "2026-08-15T12:00:00",
        "applicant_name": "Arun Kumar",
        "applicant_phone": "+91 98401 23456",
        "job_title": "E-Commerce Delivery Associate (Evening)",
        "company_name": "QuickCart Logistics",
        "salary_display": "₹750 - ₹1,200 /day",
        "location_display": "Sholinganallur, Chennai",
    }
]


class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None
    worker_id: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # pending, applied, shortlisted, accepted, rejected, hired


# ==================== Endpoints ====================

@router.post("", status_code=201)
@router.post("/", status_code=201)
async def create_application(
    application: ApplicationCreate,
    request: Request,
    x_student_id: Optional[str] = Header(None, alias="X-Student-ID"),
    x_worker_id: Optional[str] = Header(None, alias="X-Worker-ID"),
):
    """Submit a job application as a Worker"""
    # Extract worker_id from JWT or headers
    worker_id = application.worker_id or x_worker_id or x_student_id
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split()[1]
        from jose import jwt
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            worker_id = payload.get("sub") or worker_id
        except Exception:
            pass

    if not worker_id:
        worker_id = "demo-worker"

    # Check for duplicate application
    for existing in _LOCAL_APPLICATIONS:
        if existing.get("job_id") == application.job_id and existing.get("worker_id") == worker_id:
            raise HTTPException(
                status_code=400,
                detail="You have already applied for this job."
            )

    # Fetch job info from JOBS_STORE in jobs.py
    from app.routes.jobs import JOBS_STORE
    job_match = next((j for j in JOBS_STORE if j.get("id") == application.job_id), None)

    job_title = job_match.get("title", "Part-Time Job") if job_match else "Part-Time Job"
    company_name = job_match.get("employer_name", "SEWAA Verified Employer") if job_match else "SEWAA Employer"
    salary_display = f"₹{job_match.get('salary_min', 600)} - ₹{job_match.get('salary_max', 1000)} /{job_match.get('payment_frequency', 'day')}" if job_match else "₹750 /day"
    location_display = f"{job_match.get('area_name') or job_match.get('city_name') or 'Chennai'}, {job_match.get('district_name') or 'Tamil Nadu'}" if job_match else "Chennai"

    # Increment job application count
    if job_match:
        job_match["applications_count"] = job_match.get("applications_count", 0) + 1

    app_id = f"APP-{int(datetime.utcnow().timestamp())}"
    new_app = {
        "id": app_id,
        "job_id": application.job_id,
        "student_id": worker_id,
        "worker_id": worker_id,
        "status": "applied",
        "cover_letter": application.cover_letter or "I am interested in this role and available for the required shifts.",
        "applied_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "applicant_name": "Verified Seeker",
        "applicant_phone": "+91 98401 XXXXX",
        "job_title": job_title,
        "company_name": company_name,
        "salary_display": salary_display,
        "location_display": location_display,
    }

    _LOCAL_APPLICATIONS.insert(0, new_app)

    # Add notification for the user
    from app.routes.notifications import create_in_memory_notification
    create_in_memory_notification(
        user_id=worker_id,
        notif_type="job_applied",
        title="Application Submitted! 📋",
        message=f"You successfully applied for '{job_title}' at {company_name}.",
        related_job_id=application.job_id
    )

    return {
        "status": "success",
        "message": "Application submitted successfully! Track updates in the Activity tab.",
        "data": new_app
    }


@router.get("/student/{student_id}")
@router.get("/worker/{student_id}")
async def get_worker_applications(
    student_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all applications submitted by a Worker"""
    user_apps = [
        app for app in _LOCAL_APPLICATIONS
        if app.get("student_id") == student_id or app.get("worker_id") == student_id or student_id in ("demo-worker", "guest")
    ]

    if status_filter:
        user_apps = [a for a in user_apps if a.get("status") == status_filter]

    paginated = user_apps[skip:skip + limit]
    return {
        "status": "success",
        "count": len(user_apps),
        "data": paginated
    }


@router.get("/job/{job_id}")
async def get_job_applicants(
    job_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all applicants for a specific Job posting (Employer View)"""
    job_apps = [app for app in _LOCAL_APPLICATIONS if app.get("job_id") == job_id]

    if status_filter:
        job_apps = [a for a in job_apps if a.get("status") == status_filter]

    # If no applicants yet, provide an initial candidate for demo review
    if not job_apps:
        demo_candidate = {
            "id": f"app-cand-{job_id[-4:]}",
            "job_id": job_id,
            "student_id": "cand-01",
            "worker_id": "cand-01",
            "status": "applied",
            "cover_letter": "Enthusiastic candidate with 1+ year experience in field logistics and store work.",
            "applied_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "applicant_name": "Suresh Raina (Verified Worker)",
            "applicant_phone": "+91 98840 11223",
            "student_profile": {
                "full_name": "Suresh Raina",
                "phone": "+91 98840 11223",
                "location": "Chennai, Tamil Nadu",
                "experience": "1.5 Years",
                "rating": 4.9
            }
        }
        job_apps = [demo_candidate]

    return {
        "status": "success",
        "count": len(job_apps),
        "data": job_apps
    }


@router.get("/{application_id}")
async def get_application_details(application_id: str):
    """Fetch single application details"""
    app_match = next((a for a in _LOCAL_APPLICATIONS if a.get("id") == application_id), None)
    if not app_match:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "status": "success",
        "data": app_match
    }


@router.put("/{application_id}")
async def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    x_employer_id: Optional[str] = Header(None, alias="X-Employer-ID"),
):
    """
    Update candidate status as Employer:
    shortlisted, accepted, rejected, hired
    """
    valid_statuses = ["applied", "pending", "shortlisted", "accepted", "rejected", "hired"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    app_match = next((a for a in _LOCAL_APPLICATIONS if a.get("id") == application_id), None)
    if app_match:
        app_match["status"] = payload.status
        app_match["updated_at"] = datetime.utcnow().isoformat()

        # Emit notification to worker
        worker_id = app_match.get("worker_id") or app_match.get("student_id")
        if worker_id:
            from app.routes.notifications import create_in_memory_notification
            status_emojis = {"shortlisted": "⭐", "accepted": "🎉", "hired": "✅", "rejected": "ℹ️"}
            create_in_memory_notification(
                user_id=worker_id,
                notif_type=f"app_{payload.status}",
                title=f"Application {payload.status.capitalize()} {status_emojis.get(payload.status, '📌')}",
                message=f"Your application for '{app_match.get('job_title')}' has been updated to {payload.status.upper()}.",
                related_job_id=app_match.get("job_id"),
                related_application_id=application_id
            )

        return {
            "status": "success",
            "message": f"Candidate status updated to {payload.status}",
            "data": app_match
        }

    # If ID was dynamic from candidate modal
    dummy_app = {
        "id": application_id,
        "status": payload.status,
        "updated_at": datetime.utcnow().isoformat()
    }
    _LOCAL_APPLICATIONS.append(dummy_app)
    return {
        "status": "success",
        "message": f"Candidate status updated to {payload.status}",
        "data": dummy_app
    }


@router.delete("/{application_id}")
async def withdraw_application(
    application_id: str,
    x_student_id: Optional[str] = Header(None, alias="X-Student-ID"),
):
    """Withdraw an application"""
    global _LOCAL_APPLICATIONS
    _LOCAL_APPLICATIONS = [a for a in _LOCAL_APPLICATIONS if a.get("id") != application_id]
    return {
        "status": "success",
        "message": "Application withdrawn successfully"
    }
