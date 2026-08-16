"""
WorkMate India - Pan-India Locations API
Provides state, district, city, popular hubs, and PIN code lookup for all 28 Indian states & 8 UTs
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
        "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"
    ],
    "Bihar": [
        "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai"
    ],
    "Odisha": [
        "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak"
    ],
    "Assam": [
        "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur"
    ],
    "Jharkhand": [
        "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh"
    ],
    "Chhattisgarh": [
        "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Durg", "Raigarh"
    ],
    "Uttarakhand": [
        "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh"
    ],
    "Goa": [
        "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"
    ],
    "Himachal Pradesh": [
        "Shimla", "Dharamshala", "Solan", "Mandi", "Baddi", "Kullu"
    ],
    "Chandigarh": ["Chandigarh"],
    "Puducherry": ["Puducherry", "Karaikal", "Yanam", "Mahe"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua"],
    "Tripura": ["Agartala"],
    "Meghalaya": ["Shillong"],
    "Manipur": ["Imphal"],
    "Nagaland": ["Dimapur", "Kohima"],
    "Mizoram": ["Aizawl"],
    "Arunachal Pradesh": ["Itanagar"],
    "Sikkim": ["Gangtok"],
    "Ladakh": ["Leh", "Kargil"],
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
    "Lakshadweep": ["Kavaratti"]
}

POPULAR_CITIES = [
    {"city": "Chennai", "state": "Tamil Nadu", "tag": "Industrial & Tech Hub", "icon": "🏛️"},
    {"city": "Bengaluru", "state": "Karnataka", "tag": "Silicon Valley of India", "icon": "💻"},
    {"city": "Hyderabad", "state": "Telangana", "tag": "Cyberabad Hub", "icon": "🕌"},
    {"city": "Mumbai", "state": "Maharashtra", "tag": "Financial Capital", "icon": "🌆"},
    {"city": "Delhi NCR", "state": "Delhi", "tag": "National Capital Region", "icon": "🏛️"},
    {"city": "Pune", "state": "Maharashtra", "tag": "Automobile & IT Hub", "icon": "⚙️"},
    {"city": "Kochi", "state": "Kerala", "tag": "Coastal & Port Hub", "icon": "🌴"},
    {"city": "Coimbatore", "state": "Tamil Nadu", "tag": "Textile & Engineering", "icon": "🏭"},
    {"city": "Kolkata", "state": "West Bengal", "tag": "Eastern Metropolis", "icon": "🌉"},
    {"city": "Ahmedabad", "state": "Gujarat", "tag": "Commercial Capital", "icon": "🏢"},
    {"city": "Jaipur", "state": "Rajasthan", "tag": "Heritage & Tourism Hub", "icon": "🏰"},
    {"city": "Lucknow", "state": "Uttar Pradesh", "tag": "North Commercial Hub", "icon": "🕌"},
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
    """Autocomplete search for any Indian city or state"""
    query = q.strip().lower()
    matches = []

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
