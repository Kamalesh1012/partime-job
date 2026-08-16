"""
SEWAA - Pan-India Jobs & Local Mapping REST API
Provides Relational Location Search, Haversine Nearby Discovery, Dedicated Job Map Endpoints,
Location-Based Counts, and Strict Relationship Validation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header, Path
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path as FilePath
import json
import math

from app.core.config import settings

router = APIRouter()

_data_dir = FilePath(__file__).resolve().parent.parent / "data" / "india"

# Load Master Data & Seed Jobs
try:
    with open(_data_dir / "states.json", "r", encoding="utf-8") as f:
        STATES_MASTER: List[Dict] = json.load(f)
    with open(_data_dir / "districts.json", "r", encoding="utf-8") as f:
        DISTRICTS_MASTER: List[Dict] = json.load(f)
    with open(_data_dir / "cities.json", "r", encoding="utf-8") as f:
        CITIES_MASTER: List[Dict] = json.load(f)
except Exception:
    STATES_MASTER = []
    DISTRICTS_MASTER = []
    CITIES_MASTER = []

# Haversine distance calculator
def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates using Haversine formula."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


# Curated in-memory store of relational jobs initialized from seed
from seed_locations import get_relational_seed_jobs
JOBS_STORE: List[Dict[str, Any]] = get_relational_seed_jobs()


# ==================== Models ====================

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    category: str = Field(..., description="Job category (e.g. Delivery, Store Assistant, Event Staff, Packing)")
    job_type: str = Field(..., description="Part-time, Daily wage, Weekend, One-day job")
    work_type: Optional[str] = Field("On-site", description="On-site, Field, Remote")
    shift: Optional[str] = Field("Flexible Shift", description="Morning, Evening, Night, Weekend")
    state_id: str = Field(..., description="Unique State ID (e.g. ST-TN, ST-KA)")
    district_id: str = Field(..., description="Unique District ID (e.g. DIST-TN-CHEN)")
    city_id: Optional[str] = None
    state_name: Optional[str] = None
    district_name: Optional[str] = None
    city_name: Optional[str] = None
    area_name: Optional[str] = None
    address: str = Field(..., description="Street address or landmark")
    pin_code: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    salary_min: float = Field(..., ge=0)
    salary_max: float = Field(..., ge=0)
    salary_currency: Optional[str] = "INR"
    payment_frequency: Optional[str] = "Per Day"
    skills_required: Optional[List[str]] = None
    openings: Optional[int] = 1
    is_urgent: Optional[bool] = False
    is_weekend: Optional[bool] = False
    application_deadline: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    job_type: Optional[str] = None
    work_type: Optional[str] = None
    shift: Optional[str] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    city_id: Optional[str] = None
    state_name: Optional[str] = None
    district_name: Optional[str] = None
    city_name: Optional[str] = None
    area_name: Optional[str] = None
    address: Optional[str] = None
    pin_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    payment_frequency: Optional[str] = None
    skills_required: Optional[List[str]] = None
    openings: Optional[int] = None
    is_urgent: Optional[bool] = None
    is_weekend: Optional[bool] = None
    is_active: Optional[bool] = None


# ==================== Database Sync Helper ====================

async def get_db_client():
    """Returns Supabase client if configured."""
    try:
        from supabase import create_client
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception:
        pass
    return None


# ==================== 1. Primary Jobs Query Endpoint ====================

@router.get("", summary="List Pan-India jobs with multi-parameter relational location filters")
@router.get("/", summary="List Pan-India jobs")
async def list_jobs(
    state_id: Optional[str] = Query(None, description="State ID (e.g. ST-TN)"),
    district_id: Optional[str] = Query(None, description="District ID (e.g. DIST-TN-CHEN)"),
    city_id: Optional[str] = Query(None, description="City / Locality ID"),
    state: Optional[str] = Query(None, description="State Name"),
    district: Optional[str] = Query(None, description="District Name"),
    city: Optional[str] = Query(None, description="City / Locality Name"),
    category: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
    is_urgent: Optional[bool] = Query(None),
    is_weekend: Optional[bool] = Query(None),
    salary_min: Optional[float] = Query(None),
    salary_max: Optional[float] = Query(None),
    employer_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Returns filtered jobs using relational IDs, state/district criteria, and compensation filters."""
    filtered = []

    for j in JOBS_STORE:
        if not j.get("is_active", True):
            continue

        # Employer filter
        if employer_id and j.get("employer_id") != employer_id:
            continue

        # State filter
        if state_id and j.get("state_id", "").upper() != state_id.upper():
            continue
        if state and state.lower() not in (j.get("state_name") or "").lower():
            continue

        # District filter
        if district_id:
            did_u = district_id.upper()
            j_did_u = j.get("district_id", "").upper()
            if not (j_did_u == did_u or j_did_u.startswith(did_u) or did_u.startswith(j_did_u)):
                continue
        if district and district.lower() not in (j.get("district_name") or "").lower():
            continue

        # City / Locality filter
        if city_id and j.get("city_id", "").upper() != city_id.upper():
            continue
        if city and city.lower() not in f"{j.get('city_name', '')} {j.get('area_name', '')} {j.get('address', '')}".lower():
            continue

        # Category filter
        if category and category.lower() not in j.get("category", "").lower():
            continue

        # Job type & Work type
        if job_type and job_type.lower() != j.get("job_type", "").lower():
            continue
        if work_type and work_type.lower() != j.get("work_type", "").lower():
            continue

        # Shift
        if shift and shift != "all" and shift.lower() not in j.get("shift", "").lower():
            continue

        # Urgency & Weekend
        if is_urgent is not None and j.get("is_urgent") != is_urgent:
            continue
        if is_weekend is not None and j.get("is_weekend") != is_weekend:
            continue

        # Salary range
        if salary_min is not None and j.get("salary_max", 0) < salary_min:
            continue
        if salary_max is not None and j.get("salary_min", 0) > salary_max:
            continue

        # Text search
        if search:
            s_low = search.lower()
            text_blob = f"{j.get('title', '')} {j.get('description', '')} {j.get('category', '')} {j.get('area_name', '')} {j.get('city_name', '')}".lower()
            if s_low not in text_blob:
                continue

        filtered.append(j)

    total_count = len(filtered)
    paginated = filtered[skip : skip + limit]

    return {
        "success": True,
        "total": total_count,
        "count": len(paginated),
        "skip": skip,
        "limit": limit,
        "data": paginated
    }


# ==================== 2. Nearby Jobs API with Haversine Calculation ====================

@router.get("/nearby", summary="Find jobs near user GPS coordinates using Haversine calculation")
async def get_nearby_jobs(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="User Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="User Longitude"),
    radius: float = Query(15.0, ge=1.0, le=100.0, description="Search radius in Kilometers"),
    category: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100)
):
    """Calculates true geodesic distance from user location to all jobs and returns sorted results."""
    nearby_list = []

    for j in JOBS_STORE:
        if not j.get("is_active", True):
            continue

        j_lat = j.get("latitude")
        j_lng = j.get("longitude")
        if j_lat is None or j_lng is None:
            continue

        dist_km = calculate_distance_km(latitude, longitude, j_lat, j_lng)
        if dist_km <= radius:
            if category and category.lower() not in j.get("category", "").lower():
                continue
            if job_type and job_type.lower() != j.get("job_type", "").lower():
                continue

            nearby_list.append({
                **j,
                "distance_km": dist_km,
                "distance_display": f"{dist_km} km away"
            })

    # Sort by nearest distance first
    nearby_list.sort(key=lambda x: x["distance_km"])
    results = nearby_list[:limit]

    return {
        "success": True,
        "user_coordinates": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius,
        "total_nearby": len(nearby_list),
        "count": len(results),
        "data": results
    }


# ==================== 3. Dedicated Job Map API ====================

@router.get("/map", summary="Dedicated endpoint returning jobs formatted for Leaflet Map view")
async def get_jobs_for_map(
    state_id: Optional[str] = Query(None),
    district_id: Optional[str] = Query(None),
    city_id: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius: Optional[float] = Query(25.0),
    category: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    min_salary: Optional[float] = Query(None),
    max_salary: Optional[float] = Query(None)
):
    """Returns coordinate pins, cluster info, and map popup summaries for viewport rendering."""
    map_markers = []

    for j in JOBS_STORE:
        if not j.get("is_active", True):
            continue

        j_lat = j.get("latitude")
        j_lng = j.get("longitude")
        if j_lat is None or j_lng is None:
            continue

        # Location filters
        if state_id and j.get("state_id", "").upper() != state_id.upper():
            continue
        if district_id and j.get("district_id", "").upper() != district_id.upper():
            continue
        if city_id and j.get("city_id", "").upper() != city_id.upper():
            continue

        # Distance filter if center coordinates provided
        dist_km = None
        if latitude is not None and longitude is not None:
            dist_km = calculate_distance_km(latitude, longitude, j_lat, j_lng)
            if radius and dist_km > radius:
                continue

        # Category & salary filters
        if category and category.lower() not in j.get("category", "").lower():
            continue
        if job_type and job_type.lower() != j.get("job_type", "").lower():
            continue
        if min_salary and j.get("salary_max", 0) < min_salary:
            continue
        if max_salary and j.get("salary_min", 0) > max_salary:
            continue

        map_markers.append({
            "id": j["id"],
            "title": j["title"],
            "category": j.get("category"),
            "job_type": j.get("job_type"),
            "employer": j.get("employer_name", "SEWAA Verified Employer"),
            "salary_display": f"₹{j.get('salary_min', 0):,.0f} - ₹{j.get('salary_max', 0):,.0f} /{j.get('payment_frequency', 'day')}",
            "latitude": j_lat,
            "longitude": j_lng,
            "address": j.get("address"),
            "area": j.get("area_name") or j.get("city_name"),
            "district": j.get("district_name"),
            "state": j.get("state_name"),
            "distance_km": dist_km,
            "distance_display": f"{dist_km} km away" if dist_km is not None else None,
            "is_urgent": j.get("is_urgent", False)
        })

    return {
        "success": True,
        "total": len(map_markers),
        "jobs": map_markers
    }


# ==================== 4. Job Distribution Counts by Location ====================

@router.get("/counts-by-location", summary="Get job counts grouped by State and District")
async def get_job_counts_by_location():
    """Aggregates active job listings across Indian States and Districts."""
    state_counts: Dict[str, Dict] = {}

    for s in STATES_MASTER:
        state_counts[s["id"]] = {
            "state_id": s["id"],
            "state_name": s["name"],
            "code": s["code"],
            "job_count": 0,
            "districts": {}
        }

    for j in JOBS_STORE:
        if not j.get("is_active", True):
            continue
        st_id = j.get("state_id")
        dist_id = j.get("district_id")
        dist_name = j.get("district_name", "General")

        if st_id and st_id in state_counts:
            state_counts[st_id]["job_count"] += 1
            if dist_name not in state_counts[st_id]["districts"]:
                state_counts[st_id]["districts"][dist_name] = 0
            state_counts[st_id]["districts"][dist_name] += 1

    return {
        "success": True,
        "total_active_jobs": len([j for j in JOBS_STORE if j.get("is_active", True)]),
        "states": list(state_counts.values())
    }


# ==================== 5. Create Job with Strict Relationship Validation ====================

@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a job with strict location foreign keys")
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    x_employer_id: Optional[str] = Header(None, alias="X-Employer-ID")
):
    """Creates a job verifying that district_id belongs to state_id and coordinates are valid."""
    # 1. Validate state existence
    matching_state = next((s for s in STATES_MASTER if s["id"] == job_in.state_id), None)
    if not matching_state:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state_id '{job_in.state_id}'. Must match official Indian State ID."
        )

    # 2. Validate district existence & relationship to state
    matching_district = next((d for d in DISTRICTS_MASTER if d["id"] == job_in.district_id), None)
    if not matching_district:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid district_id '{job_in.district_id}'."
        )

    if matching_district.get("state_id") != matching_state["id"]:
        raise HTTPException(
            status_code=400,
            detail=f"District '{matching_district['name']}' ({matching_district['id']}) does NOT belong to State '{matching_state['name']}' ({matching_state['id']})."
        )

    job_id = f"job-{matching_state['code'].lower()}-{len(JOBS_STORE)+1:03d}"
    new_job = {
        "id": job_id,
        "title": job_in.title,
        "description": job_in.description,
        "category": job_in.category,
        "job_type": job_in.job_type,
        "work_type": job_in.work_type,
        "shift": job_in.shift,
        "state_id": matching_state["id"],
        "district_id": matching_district["id"],
        "city_id": job_in.city_id or f"CITY-{matching_district['code']}-01",
        "state_name": matching_state["name"],
        "district_name": matching_district["name"],
        "city_name": job_in.city_name or matching_district["name"],
        "area_name": job_in.area_name or matching_district["name"],
        "address": job_in.address,
        "pin_code": job_in.pin_code,
        "latitude": job_in.latitude,
        "longitude": job_in.longitude,
        "salary_min": job_in.salary_min,
        "salary_max": job_in.salary_max,
        "salary_currency": job_in.salary_currency,
        "payment_frequency": job_in.payment_frequency,
        "skills_required": job_in.skills_required or [],
        "openings": job_in.openings or 1,
        "is_urgent": job_in.is_urgent,
        "is_weekend": job_in.is_weekend,
        "application_deadline": job_in.application_deadline,
        "employer_id": x_employer_id or "employer-verified",
        "is_active": True,
        "applications_count": 0,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    JOBS_STORE.insert(0, new_job)
    return {"success": True, "message": "Job created successfully", "data": new_job}


# ==================== 6. Single Job Details, Update & Delete ====================

@router.get("/{job_id}", summary="Get single job details by ID")
async def get_job_details(job_id: str = Path(...)):
    """Fetch single job posting details."""
    for j in JOBS_STORE:
        if j["id"] == job_id:
            return {"success": True, "data": j}
    raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")


@router.put("/{job_id}", summary="Update an existing job posting")
async def update_job(
    job_id: str,
    job_in: JobUpdate,
    x_employer_id: Optional[str] = Header(None, alias="X-Employer-ID")
):
    """Updates job posting details."""
    for idx, j in enumerate(JOBS_STORE):
        if j["id"] == job_id:
            update_data = job_in.dict(exclude_unset=True)
            JOBS_STORE[idx] = {**j, **update_data, "updated_at": datetime.utcnow().isoformat() + "Z"}
            return {"success": True, "message": "Job updated", "data": JOBS_STORE[idx]}
    raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")


@router.delete("/{job_id}", summary="Delete / deactivate a job posting")
async def delete_job(
    job_id: str,
    x_employer_id: Optional[str] = Header(None, alias="X-Employer-ID")
):
    """Deactivates a job posting."""
    for idx, j in enumerate(JOBS_STORE):
        if j["id"] == job_id:
            JOBS_STORE[idx]["is_active"] = False
            return {"success": True, "message": "Job removed successfully"}
    raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
