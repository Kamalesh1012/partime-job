"""
SEWAA - Pan-India Hierarchical Location REST API
Provides State -> District -> City / Area -> PIN Code lookups, autocomplete, reverse geocoding, and hierarchy.
"""
from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional, List, Dict
from pathlib import Path as FilePath
import json
import math

router = APIRouter()

_data_dir = FilePath(__file__).resolve().parent.parent / "data" / "india"

# In-memory location stores loaded from master JSON
try:
    with open(_data_dir / "states.json", "r", encoding="utf-8") as f:
        STATES_MASTER: List[Dict] = json.load(f)
    with open(_data_dir / "districts.json", "r", encoding="utf-8") as f:
        DISTRICTS_MASTER: List[Dict] = json.load(f)
    with open(_data_dir / "cities.json", "r", encoding="utf-8") as f:
        CITIES_MASTER: List[Dict] = json.load(f)
except Exception as e:
    STATES_MASTER = []
    DISTRICTS_MASTER = []
    CITIES_MASTER = []

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


# ==================== 1. States & Union Territories ====================

@router.get("/states", summary="Get all 28 Indian States & 8 Union Territories")
async def get_states(
    type: Optional[str] = Query(None, description="Filter by 'State' or 'Union Territory'"),
    is_active: bool = Query(True)
):
    """Returns all official Indian states and union territories with unique IDs and coordinates."""
    results = [s for s in STATES_MASTER if s.get("is_active", True) == is_active]
    if type:
        results = [s for s in results if s.get("type", "").lower() == type.lower()]
    return {
        "success": True,
        "count": len(results),
        "data": results
    }


@router.get("/states/{state_id}", summary="Get state by ID or Code")
async def get_state_by_id(state_id: str = Path(..., description="State ID (e.g. ST-TN, ST-KA) or Code (TN, KA)")):
    """Get state details by unique ID or Code."""
    for s in STATES_MASTER:
        if s["id"].upper() == state_id.upper() or s["code"].upper() == state_id.upper():
            return {"success": True, "data": s}
    raise HTTPException(status_code=404, detail=f"State '{state_id}' not found")


# ==================== 2. Districts within State ====================

@router.get("/states/{state_id}/districts", summary="Get all districts within a State / UT")
async def get_districts_by_state(
    state_id: str = Path(..., description="State ID (e.g. ST-TN) or Code (TN)"),
    is_active: bool = Query(True)
):
    """Returns all official districts belonging to the specified state."""
    target_state_id = None
    target_state_name = None
    for s in STATES_MASTER:
        if s["id"].upper() == state_id.upper() or s["code"].upper() == state_id.upper() or s["name"].lower() == state_id.lower():
            target_state_id = s["id"]
            target_state_name = s["name"]
            break

    if not target_state_id:
        raise HTTPException(status_code=404, detail=f"State '{state_id}' not found")

    districts = [
        d for d in DISTRICTS_MASTER
        if (d.get("state_id") == target_state_id or d.get("state_name") == target_state_name)
        and d.get("is_active", True) == is_active
    ]
    return {
        "success": True,
        "state_id": target_state_id,
        "state_name": target_state_name,
        "count": len(districts),
        "data": districts
    }


# ==================== 3. Cities / Towns / Areas within District ====================

@router.get("/districts/{district_id}/cities", summary="Get all cities, towns, and areas within a District")
async def get_cities_by_district(
    district_id: str = Path(..., description="District ID (e.g. DIST-TN-CHENN)")
):
    """Returns cities, areas, and PIN codes belonging to the specified district."""
    did_upper = district_id.upper()
    did_lower = district_id.lower()
    cities = [
        c for c in CITIES_MASTER
        if c.get("district_id", "").upper() == did_upper
        or c.get("district_id", "").upper().startswith(did_upper)
        or did_upper.startswith(c.get("district_id", "").upper())
        or c.get("district_name", "").lower() == did_lower
        or did_lower in c.get("district_name", "").lower()
    ]
    return {
        "success": True,
        "district_id": district_id,
        "count": len(cities),
        "data": cities
    }


# ==================== 4. Autocomplete Search ====================

@router.get("/search", summary="Autocomplete search across States, Districts, Cities & PIN Codes")
async def search_locations(
    q: str = Query(..., min_length=2, description="Search query (e.g. 'Chen', 'Shol', '600119')")
):
    """Fast search across all 36 States/UTs, 786 Districts, Cities, and PIN codes."""
    q_lower = q.lower().strip()
    results = []

    # 1. Search PIN codes
    for c in CITIES_MASTER:
        if c.get("pincode") and q_lower in c["pincode"]:
            results.append({
                "type": "pincode",
                "id": c["id"],
                "name": f"{c['name']} ({c['pincode']})",
                "state_id": c["state_id"],
                "state_name": c["state_name"],
                "district_id": c["district_id"],
                "district_name": c["district_name"],
                "city_name": c["name"],
                "pincode": c["pincode"],
                "latitude": c.get("latitude"),
                "longitude": c.get("longitude"),
                "tag": "PIN Code"
            })

    # 2. Search Cities / Localities
    for c in CITIES_MASTER:
        if q_lower in c["name"].lower():
            results.append({
                "type": "city",
                "id": c["id"],
                "name": f"{c['name']}, {c['district_name']}",
                "state_id": c["state_id"],
                "state_name": c["state_name"],
                "district_id": c["district_id"],
                "district_name": c["district_name"],
                "city_name": c["name"],
                "pincode": c.get("pincode"),
                "latitude": c.get("latitude"),
                "longitude": c.get("longitude"),
                "tag": f"Area in {c['district_name']}"
            })

    # 3. Search Districts
    for d in DISTRICTS_MASTER:
        if q_lower in d["name"].lower():
            results.append({
                "type": "district",
                "id": d["id"],
                "name": f"{d['name']}, {d['state_name']}",
                "state_id": d["state_id"],
                "state_name": d["state_name"],
                "district_id": d["id"],
                "district_name": d["name"],
                "city_name": d["name"],
                "tag": f"District in {d['state_name']}"
            })

    # 4. Search States
    for s in STATES_MASTER:
        if q_lower in s["name"].lower() or q_lower in s["code"].lower():
            results.append({
                "type": "state",
                "id": s["id"],
                "name": s["name"],
                "state_id": s["id"],
                "state_name": s["name"],
                "latitude": s.get("latitude"),
                "longitude": s.get("longitude"),
                "tag": s["type"]
            })

    # Deduplicate results
    seen = set()
    unique = []
    for r in results:
        key = (r.get("id"), r.get("name"))
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return {
        "success": True,
        "query": q,
        "count": len(unique[:35]),
        "data": unique[:35]
    }


# ==================== 5. Reverse Geocode ====================

@router.get("/reverse-geocode", summary="Determine State, District & City from GPS coordinates")
async def reverse_geocode(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0)
):
    """Finds nearest City, District, and State from browser coordinates using Haversine calculation."""
    nearest_city = None
    min_city_dist = float("inf")

    for c in CITIES_MASTER:
        if c.get("latitude") and c.get("longitude"):
            dist = haversine_distance(latitude, longitude, c["latitude"], c["longitude"])
            if dist < min_city_dist:
                min_city_dist = dist
                nearest_city = {**c, "distance_km": dist}

    nearest_state = None
    min_state_dist = float("inf")

    for s in STATES_MASTER:
        if s.get("latitude") and s.get("longitude"):
            dist = haversine_distance(latitude, longitude, s["latitude"], s["longitude"])
            if dist < min_state_dist:
                min_state_dist = dist
                nearest_state = s

    return {
        "success": True,
        "coordinates": {"latitude": latitude, "longitude": longitude},
        "nearest_city": nearest_city,
        "nearest_state": nearest_state
    }


# ==================== 6. Hierarchy Overview ====================

@router.get("/hierarchy", summary="Get full structured location hierarchy summary")
async def get_hierarchy():
    """Returns top-level hierarchy statistics for all 36 States/UTs."""
    summary = []
    for s in STATES_MASTER:
        dists = [d for d in DISTRICTS_MASTER if d["state_id"] == s["id"]]
        summary.append({
            "state_id": s["id"],
            "state_name": s["name"],
            "code": s["code"],
            "type": s["type"],
            "districts_count": len(dists),
            "districts": [d["name"] for d in dists]
        })
    return {
        "success": True,
        "states_count": len(STATES_MASTER),
        "districts_count": len(DISTRICTS_MASTER),
        "data": summary
    }
