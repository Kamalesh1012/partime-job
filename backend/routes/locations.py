"""
SEWAA India - Pan-India Locations API
Provides state, district, taluk, city, popular hubs, and PIN code lookup for all 28 Indian states & 8 UTs
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict

router = APIRouter()

INDIAN_STATES_DATA: Dict[str, List[str]] = {
    "Tamil Nadu": [
        "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", 
        "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Kanchipuram", "Chengalpattu", "Hosur"
    ],
    "Karnataka": [
        "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", 
        "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Udupi"
    ],
    "Telangana": [
        "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", 
        "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"
    ],
    "Maharashtra": [
        "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Kalyan-Dombivli", "Vasai-Virar", 
        "Aurangabad (Chhatrapati Sambhajinagar)", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Amravati", "Kolhapur"
    ],
    "Delhi": [
        "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", 
        "Central Delhi", "North East Delhi", "North West Delhi", "South East Delhi", "South West Delhi"
    ],
    "Kerala": [
        "Kochi", "Thiruvananthapuram", "Kozhikode", "Kollam", "Thrissur", "Alappuzha", 
        "Palakkad", "Malappuram", "Kannur", "Kottayam", "Kasaragod"
    ],
    "Andhra Pradesh": [
        "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", 
        "Rajahmundry", "Tirupati", "Kadapa", "Anantapur", "Eluru", "Ongole"
    ],
    "Gujarat": [
        "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", 
        "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Bharuch"
    ],
    "Uttar Pradesh": [
        "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", 
        "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Greater Noida"
    ],
    "West Bengal": [
        "Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Bardhaman", 
        "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur"
    ],
    "Rajasthan": [
        "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", 
        "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali"
    ],
    "Madhya Pradesh": [
        "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", 
        "Dewas", "Satna", "Ratlam", "Rewa"
    ],
    "Punjab": [
        "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Batala", "Pathankot"
    ],
    "Haryana": [
        "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"
    ],
    "Bihar": [
        "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"
    ],
    "Odisha": [
        "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada"
    ],
    "Assam": [
        "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur"
    ],
    "Jharkhand": [
        "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh"
    ],
    "Chhattisgarh": [
        "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Durg", "Jagdalpur"
    ],
    "Uttarakhand": [
        "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh"
    ],
    "Goa": [
        "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"
    ],
    "Himachal Pradesh": [
        "Shimla", "Dharamshala", "Mandi", "Solan", "Baddi", "Kullu"
    ],
    "Tripura": ["Agartala"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Nagaland": ["Dimapur", "Kohima"],
    "Mizoram": ["Aizawl"],
    "Arunachal Pradesh": ["Itanagar"],
    "Sikkim": ["Gangtok"],
    "Chandigarh": ["Chandigarh"],
    "Puducherry": ["Puducherry", "Karaikal", "Yanam", "Mahe"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    "Ladakh": ["Leh", "Kargil"],
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
    "Lakshadweep": ["Kavaratti"]
}

POPULAR_TALUKS: List[Dict] = [
    {"name": "Whitefield, Bengaluru", "taluk": "Whitefield", "city": "Bengaluru", "district": "Bengaluru Urban", "state": "Karnataka"},
    {"name": "Sholinganallur, Chennai", "taluk": "Sholinganallur", "city": "Chennai", "district": "Chengalpattu", "state": "Tamil Nadu"},
    {"name": "Madhapur, Hyderabad", "taluk": "Madhapur", "city": "Hyderabad", "district": "Rangareddy", "state": "Telangana"},
    {"name": "Andheri, Mumbai", "taluk": "Andheri", "city": "Mumbai", "district": "Mumbai Suburban", "state": "Maharashtra"},
    {"name": "Saket, New Delhi", "taluk": "Saket", "city": "New Delhi", "district": "South Delhi", "state": "Delhi"},
    {"name": "Hinjewadi, Pune", "taluk": "Hinjewadi", "city": "Pune", "district": "Pune", "state": "Maharashtra"},
    {"name": "Kakkanad, Kochi", "taluk": "Kakkanad", "city": "Kochi", "district": "Ernakulam", "state": "Kerala"},
    {"name": "Peelamedu, Coimbatore", "taluk": "Peelamedu", "city": "Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu"},
    {"name": "Salt Lake, Kolkata", "taluk": "Salt Lake", "city": "Kolkata", "district": "North 24 Parganas", "state": "West Bengal"},
]

POPULAR_CITIES = [
    {"city": "Chennai", "state": "Tamil Nadu", "tag": "Industrial & Tech Hub", "lat": 13.0827, "lng": 80.2707},
    {"city": "Bengaluru", "state": "Karnataka", "tag": "Silicon Valley Hub", "lat": 12.9716, "lng": 77.5946},
    {"city": "Hyderabad", "state": "Telangana", "tag": "Cyberabad Hub", "lat": 17.3850, "lng": 78.4867},
    {"city": "Mumbai", "state": "Maharashtra", "tag": "Commercial Capital", "lat": 19.0760, "lng": 72.8777},
    {"city": "New Delhi", "state": "Delhi", "tag": "National Capital Hub", "lat": 28.6139, "lng": 77.2090},
    {"city": "Pune", "state": "Maharashtra", "tag": "Automobile & IT Hub", "lat": 18.5204, "lng": 73.8567},
    {"city": "Kochi", "state": "Kerala", "tag": "Port & Coastal Hub", "lat": 9.9312, "lng": 76.2673},
    {"city": "Coimbatore", "state": "Tamil Nadu", "tag": "Textile & Engineering Hub", "lat": 11.0168, "lng": 76.9558},
    {"city": "Kolkata", "state": "West Bengal", "tag": "Eastern Metropolis", "lat": 22.5726, "lng": 88.3639},
    {"city": "Ahmedabad", "state": "Gujarat", "tag": "Commercial Center", "lat": 23.0225, "lng": 72.5714},
    {"city": "Jaipur", "state": "Rajasthan", "tag": "Heritage & Tourism Hub", "lat": 26.9124, "lng": 75.7873},
    {"city": "Lucknow", "state": "Uttar Pradesh", "tag": "Capital & Commerce Hub", "lat": 26.8467, "lng": 80.9462},
]


@router.get("/states")
@router.get("/states/")
async def get_states():
    """List all 28 Indian States and 8 Union Territories"""
    return {
        "status": "success",
        "data": list(INDIAN_STATES_DATA.keys())
    }


@router.get("/districts")
@router.get("/districts/")
async def get_districts(state: Optional[str] = Query(None)):
    """Get districts/cities for a specific state or all"""
    if state and state in INDIAN_STATES_DATA:
        return {
            "status": "success",
            "state": state,
            "data": INDIAN_STATES_DATA[state]
        }
    elif state:
        # Case-insensitive match
        for s_key, cities in INDIAN_STATES_DATA.items():
            if s_key.lower() == state.lower():
                return {
                    "status": "success",
                    "state": s_key,
                    "data": cities
                }
        raise HTTPException(status_code=404, detail=f"State '{state}' not found")
    
    return {
        "status": "success",
        "data": INDIAN_STATES_DATA
    }


@router.get("/popular")
@router.get("/popular/")
async def get_popular_cities():
    """Get top Indian metropolitan and tier-1/tier-2 job hubs"""
    return {
        "status": "success",
        "data": POPULAR_CITIES
    }


@router.get("/search")
@router.get("/search/")
async def search_location(q: str = Query(..., min_length=1)):
    """Autocomplete search for any Indian city, taluk, or state"""
    query = q.strip().lower()
    matches = []

    # Check taluks first
    for taluk_obj in POPULAR_TALUKS:
        if query in taluk_obj["taluk"].lower() or query in taluk_obj["name"].lower():
            matches.append({
                "type": "taluk",
                "name": taluk_obj["name"],
                "taluk": taluk_obj["taluk"],
                "city": taluk_obj["city"],
                "district": taluk_obj["district"],
                "state": taluk_obj["state"]
            })

    for state, cities in INDIAN_STATES_DATA.items():
        if query in state.lower():
            matches.append({"type": "state", "name": state, "state": state})
        for city in cities:
            if query in city.lower():
                matches.append({"type": "city", "name": f"{city}, {state}", "city": city, "state": state})

    return {
        "status": "success",
        "count": len(matches),
        "data": matches[:20]
    }
