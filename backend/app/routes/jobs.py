"""
WorkMate India - Pan-India Part-Time & Local Jobs API
Provides multi-filter job discovery across all Indian states and cities
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from app.core.config import settings
import httpx

router = APIRouter()

# Curated seed jobs across major Indian cities for immediate rich discovery
PAN_INDIA_SEED_JOBS = [
    {
        "id": "job-del-01",
        "title": "Evening E-commerce Delivery Partner",
        "description": "Deliver online grocery and package orders in South Delhi. Flexible evening shift from 5 PM to 10 PM. Daily payout + fuel allowance provided.",
        "category": "Delivery",
        "job_type": "Daily wage",
        "shift": "Evening (5 PM - 10 PM)",
        "state": "Delhi",
        "district": "South Delhi",
        "city": "New Delhi",
        "area": "Saket & Hauz Khas",
        "location": "Saket, New Delhi",
        "salary_min": 750.0,
        "salary_max": 1200.0,
        "salary_currency": "INR",
        "payment_frequency": "Daily",
        "skills_required": ["2-Wheeler Driving", "Smartphone Navigation"],
        "openings": 8,
        "is_urgent": True,
        "is_weekend": False,
        "is_active": True,
        "applications_count": 14,
        "created_at": "2026-08-16T08:00:00Z"
    },
    {
        "id": "job-blr-01",
        "title": "Weekend Retail Store Assistant",
        "description": "Assist customers, organize apparel inventory, and manage cashier billing on Saturday & Sunday at Forum Mall Whitefield.",
        "category": "Store Assistant",
        "job_type": "Weekend",
        "shift": "Afternoon (1 PM - 9 PM)",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "city": "Bengaluru",
        "area": "Whitefield",
        "location": "Whitefield, Bengaluru",
        "salary_min": 1000.0,
        "salary_max": 1400.0,
        "salary_currency": "INR",
        "payment_frequency": "Per Weekend",
        "skills_required": ["Customer Service", "Basic English/Kannada", "Billing"],
        "openings": 4,
        "is_urgent": False,
        "is_weekend": True,
        "is_active": True,
        "applications_count": 22,
        "created_at": "2026-08-16T07:30:00Z"
    },
    {
        "id": "job-chn-01",
        "title": "Morning Warehouse Packing Helper",
        "description": "Fulfillment center product scanning, box packing, and barcode labeling. Morning shift 6 AM to 11 AM.",
        "category": "Packing",
        "job_type": "Part-time",
        "shift": "Morning (6 AM - 11 AM)",
        "state": "Tamil Nadu",
        "district": "Kanchipuram",
        "city": "Chennai",
        "area": "Sriperumbudur & OMR",
        "location": "Sriperumbudur, Chennai",
        "salary_min": 500.0,
        "salary_max": 800.0,
        "salary_currency": "INR",
        "payment_frequency": "Per Day",
        "skills_required": ["Box Packing", "Sorting", "Physical Stamina"],
        "openings": 12,
        "is_urgent": True,
        "is_weekend": False,
        "is_active": True,
        "applications_count": 19,
        "created_at": "2026-08-16T06:00:00Z"
    },
    {
        "id": "job-mum-01",
        "title": "Catering & Banquet Event Staff",
        "description": "Event management and food service support for wedding banquets and corporate seminars in Andheri West.",
        "category": "Event Staff",
        "job_type": "One-day job",
        "shift": "Evening (6 PM - 12 AM)",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "city": "Mumbai",
        "area": "Andheri West",
        "location": "Andheri West, Mumbai",
        "salary_min": 1200.0,
        "salary_max": 1800.0,
        "salary_currency": "INR",
        "payment_frequency": "Per Event",
        "skills_required": ["Hospitality", "Food Serving", "Punctuality"],
        "openings": 15,
        "is_urgent": True,
        "is_weekend": True,
        "is_active": True,
        "applications_count": 31,
        "created_at": "2026-08-16T05:00:00Z"
    },
    {
        "id": "job-hyd-01",
        "title": "Part-time Customer Support (Telugu/English)",
        "description": "Handle inbound support queries for e-commerce clients. Work from office near HITEC City. 4 hours per day.",
        "category": "Customer Support",
        "job_type": "Part-time",
        "shift": "Flexible",
        "state": "Telangana",
        "district": "Hyderabad",
        "city": "Hyderabad",
        "area": "Madhapur / HITEC City",
        "location": "Madhapur, Hyderabad",
        "salary_min": 12000.0,
        "salary_max": 16000.0,
        "salary_currency": "INR",
        "payment_frequency": "Per Month",
        "skills_required": ["Telugu & English Communication", "Basic Computer Skills"],
        "openings": 6,
        "is_urgent": False,
        "is_weekend": False,
        "is_active": True,
        "applications_count": 27,
        "created_at": "2026-08-16T04:00:00Z"
    },
    {
        "id": "job-pun-01",
        "title": "Automobile Service Assistant Helper",
        "description": "Assist senior mechanics in car washing, interior vacuuming, tyre pressure checking, and oil changes in Hinjewadi.",
        "category": "Mechanic Helper",
        "job_type": "Daily wage",
        "shift": "Morning (9 AM - 2 PM)",
        "state": "Maharashtra",
        "district": "Pune",
        "city": "Pune",
        "area": "Hinjewadi",
        "location": "Hinjewadi, Pune",
        "salary_min": 600.0,
        "salary_max": 900.0,
        "salary_currency": "INR",
        "payment_frequency": "Per Day",
        "skills_required": ["Car Wash", "Tool Handling"],
        "openings": 3,
        "is_urgent": False,
        "is_weekend": True,
        "is_active": True,
        "applications_count": 8,
        "created_at": "2026-08-16T03:00:00Z"
    },
    {
        "id": "job-koc-01",
        "title": "Supermarket Billing & Shelf Organizer",
        "description": "Organize grocery racks and scan barcodes at billing counter in Kakkanad Infopark area.",
        "category": "Store Assistant",
        "job_type": "Part-time",
        "shift": "Evening (4 PM - 9 PM)",
        "state": "Kerala",
        "district": "Ernakulam",
        "city": "Kochi",
        "area": "Kakkanad",
        "location": "Kakkanad, Kochi",
        "salary_min": 450.0,
        "salary_max": 700.0,
        "salary_currency": "INR",
        "payment_frequency": "Per Day",
        "skills_required": ["Malayalam Communication", "Inventory Handling"],
        "openings": 5,
        "is_urgent": False,
        "is_weekend": False,
        "is_active": True,
        "applications_count": 11,
        "created_at": "2026-08-16T02:00:00Z"
    }
]


# ==================== Request Models ====================

class JobCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    job_type: Optional[str] = "Part-time"
    shift: Optional[str] = "Flexible"
    state: Optional[str] = "Tamil Nadu"
    district: Optional[str] = None
    city: Optional[str] = "Chennai"
    area: Optional[str] = None
    pin_code: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = "INR"
    payment_frequency: Optional[str] = "Per Day"
    experience_required: Optional[str] = None
    skills_required: Optional[List[str]] = None
    openings: Optional[int] = 1
    is_urgent: Optional[bool] = False
    is_weekend: Optional[bool] = False
    application_deadline: Optional[str] = None
    is_active: bool = True


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    job_type: Optional[str] = None
    shift: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    pin_code: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    payment_frequency: Optional[str] = None
    experience_required: Optional[str] = None
    skills_required: Optional[List[str]] = None
    openings: Optional[int] = None
    is_urgent: Optional[bool] = None
    is_weekend: Optional[bool] = None
    application_deadline: Optional[str] = None
    is_active: Optional[bool] = None


async def get_db():
    """Database dependency"""
    from supabase import create_client
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_KEY
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(supabase_url, supabase_key)


# ==================== Endpoints ====================

@router.get("", response_model=dict)
@router.get("/", response_model=dict)
async def list_jobs(
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
    is_urgent: Optional[bool] = Query(None),
    is_weekend: Optional[bool] = Query(None),
    salary_min: Optional[float] = Query(None),
    salary_max: Optional[float] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """Get all Pan-India jobs with location, shift, urgency, and category filters"""
    db_jobs = []
    try:
        query = db.table("jobs").select("*").eq("is_active", True)
        if category:
            query = query.eq("category", category)
        if location:
            query = query.ilike("location", f"%{location}%")
        if city:
            query = query.ilike("city", f"%{city}%")
        if state:
            query = query.ilike("state", f"%{state}%")
        if job_type:
            query = query.eq("job_type", job_type)
        if salary_min:
            query = query.gte("salary_min", salary_min)
        if salary_max:
            query = query.lte("salary_max", salary_max)
        
        resp = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        db_jobs = resp.data or []
    except Exception:
        db_jobs = []

    # Merge with seed jobs for rich initial discovery
    all_jobs = db_jobs + PAN_INDIA_SEED_JOBS

    filtered = []
    for j in all_jobs:
        if category and category.lower() not in (j.get("category") or "").lower():
            continue
        if city and city.strip().lower() not in (j.get("city") or j.get("location") or "").lower():
            continue
        if state and state.strip().lower() not in (j.get("state") or "").lower():
            continue
        if job_type and job_type.lower() != (j.get("job_type") or "").lower():
            continue
        if shift and shift.lower() not in (j.get("shift") or "").lower():
            continue
        if is_urgent is not None and j.get("is_urgent") != is_urgent:
            continue
        if is_weekend is not None and j.get("is_weekend") != is_weekend:
            continue
        filtered.append(j)

    # Deduplicate by ID
    seen_ids = set()
    unique_jobs = []
    for j in filtered:
        jid = j.get("id")
        if jid not in seen_ids:
            seen_ids.add(jid)
            unique_jobs.append(j)

    paginated = unique_jobs[skip:skip + limit]

    return {
        "status": "success",
        "data": paginated,
        "total": len(unique_jobs),
        "skip": skip,
        "limit": limit
    }


@router.get("/trending", response_model=dict)
@router.get("/trending/", response_model=dict)
async def get_trending_jobs(limit: int = Query(10, ge=1, le=50), db = Depends(get_db)):
    """Get trending/urgent jobs across India"""
    try:
        resp = db.table("jobs").select("*").eq("is_active", True).order("applications_count", desc=True).limit(limit).execute()
        if resp.data and len(resp.data) > 0:
            return {"status": "success", "data": resp.data}
    except Exception:
        pass

    return {
        "status": "success",
        "data": PAN_INDIA_SEED_JOBS[:limit]
    }


@router.get("/search", response_model=dict)
@router.get("/search/", response_model=dict)
async def search_jobs(
    q: str = Query(..., min_length=1),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """Keyword search across job title, description, skills, and Indian cities"""
    query = q.strip().lower()
    matches = []

    # Search in seed jobs
    for j in PAN_INDIA_SEED_JOBS:
        text_corpus = f"{j.get('title')} {j.get('description')} {j.get('category')} {j.get('city')} {j.get('state')} {' '.join(j.get('skills_required', []))}".lower()
        if query in text_corpus:
            if city and city.lower() not in (j.get("city") or "").lower():
                continue
            matches.append(j)

    # Search DB
    try:
        resp = db.table("jobs").select("*").eq("is_active", True).ilike("title", f"%{query}%").limit(limit).execute()
        if resp.data:
            matches.extend(resp.data)
    except Exception:
        pass

    seen = set()
    deduped = []
    for m in matches:
        mid = m.get("id")
        if mid not in seen:
            seen.add(mid)
            deduped.append(m)

    return {
        "status": "success",
        "query": q,
        "total": len(deduped),
        "data": deduped[skip:skip + limit]
    }


@router.get("/{job_id}", response_model=dict)
async def get_job_by_id(job_id: str, db = Depends(get_db)):
    """Fetch single job details by ID"""
    for j in PAN_INDIA_SEED_JOBS:
        if j.get("id") == job_id:
            return {"status": "success", "data": j}

    try:
        resp = db.table("jobs").select("*").eq("id", job_id).single().execute()
        if resp.data:
            return {"status": "success", "data": resp.data}
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Job not found")


@router.post("", status_code=201, response_model=dict)
@router.post("/", status_code=201, response_model=dict)
async def create_job(
    job_data: JobCreate,
    employer_id: Optional[str] = Query(None),
    x_employer_id: Optional[str] = Header(None, alias="X-Employer-ID"),
    db = Depends(get_db)
):
    """Create a new part-time or local service job posting"""
    target_employer_id = employer_id or x_employer_id
    if not target_employer_id:
        raise HTTPException(status_code=400, detail="employer_id is required")

    try:
        response = db.table("jobs").insert({
            "employer_id": target_employer_id,
            "title": job_data.title,
            "description": job_data.description,
            "category": job_data.category or "General",
            "job_type": job_data.job_type or "Part-time",
            "shift": job_data.shift or "Flexible",
            "state": job_data.state or "Tamil Nadu",
            "district": job_data.district,
            "city": job_data.city or "Chennai",
            "area": job_data.area,
            "pin_code": job_data.pin_code,
            "location": job_data.location or f"{job_data.city}, {job_data.state}",
            "salary_min": job_data.salary_min,
            "salary_max": job_data.salary_max,
            "salary_currency": job_data.salary_currency or "INR",
            "payment_frequency": job_data.payment_frequency or "Per Day",
            "experience_required": job_data.experience_required,
            "skills_required": job_data.skills_required or [],
            "openings": job_data.openings or 1,
            "is_urgent": job_data.is_urgent or False,
            "is_weekend": job_data.is_weekend or False,
            "application_deadline": job_data.application_deadline,
            "is_active": job_data.is_active,
            "applications_count": 0
        }).execute()

        return {
            "status": "success",
            "message": "Job posted successfully",
            "data": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
