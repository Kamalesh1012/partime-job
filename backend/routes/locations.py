"""
SEWAA - Pan-India Locations API
Provides state, district, taluk, city, popular hubs, and PIN code lookup for all 28 Indian states & 8 UTs (786 Districts)
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict

router = APIRouter()

ALL_INDIAN_DISTRICTS: Dict[str, List[str]] = {
    "Tamil Nadu": [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", 
        "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", 
        "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", 
        "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", 
        "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
        "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", 
        "Viluppuram", "Virudhunagar"
    ],
    "Karnataka": [
        "Bagalkote", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", 
        "Chamarajanagara", "Chikkaballapura", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", 
        "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", 
        "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
        "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
    ],
    "Kerala": [
        "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", 
        "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", 
        "Thrissur", "Wayanad"
    ],
    "Andhra Pradesh": [
        "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", 
        "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", 
        "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", 
        "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Tirupati", 
        "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
    ],
    "Telangana": [
        "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial", 
        "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", 
        "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", 
        "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", 
        "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", 
        "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
    ],
    "Maharashtra": [
        "Ahilyanagar (Ahmednagar)", "Akola", "Amravati", "Chhatrapati Sambhajinagar (Aurangabad)", 
        "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", 
        "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", 
        "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv (Osmanabad)", "Palghar", 
        "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", 
        "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ],
    "Gujarat": [
        "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", 
        "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", 
        "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", 
        "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", 
        "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"
    ],
    "Rajasthan": [
        "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", 
        "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", 
        "Dholpur", "Didwana-Kuchaman", "Dudu", "Dungarpur", "Gangapur City", "Hanumangarh", 
        "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", 
        "Jodhpur Rural", "Karauli", "Kekri", "Khairthal-Tijara", "Kota", "Kotputli-Behror", 
        "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumber", 
        "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Sri Ganganagar", 
        "Tonk", "Udaipur"
    ],
    "Uttar Pradesh": [
        "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", 
        "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", 
        "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", 
        "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", 
        "Gautam Buddha Nagar (Noida)", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", 
        "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", 
        "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri (Lakhimpur)", 
        "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", 
        "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", 
        "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", 
        "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", 
        "Sultanpur", "Unnao", "Varanasi"
    ],
    "Madhya Pradesh": [
        "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", 
        "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", 
        "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram (Hoshangabad)", "Indore", 
        "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Maihar", "Mandla", "Mandsaur", 
        "Mauganj", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Pandhurna", 
        "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", 
        "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", 
        "Ujjain", "Umaria", "Vidisha"
    ],
    "West Bengal": [
        "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", 
        "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", 
        "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", 
        "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"
    ],
    "Bihar": [
        "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", 
        "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", 
        "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", 
        "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", 
        "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", 
        "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran (Bettiah)"
    ],
    "Punjab": [
        "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", 
        "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", 
        "Malerkotla", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", 
        "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur", "Shahid Bhagat Singh Nagar (Nawanshahr)", 
        "Tarn Taran"
    ],
    "Haryana": [
        "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", 
        "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", 
        "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", 
        "Yamunanagar"
    ],
    "Delhi": [
        "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", 
        "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", 
        "West Delhi"
    ],
    "Odisha": [
        "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", 
        "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", 
        "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", 
        "Khordha (Bhubaneswar)", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", 
        "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", 
        "Sundargarh"
    ],
    "Assam": [
        "Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", 
        "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", 
        "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan (Guwahati)", 
        "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", 
        "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tamulpur", 
        "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],
    "Jharkhand": [
        "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum (Jamshedpur)", 
        "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", 
        "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", 
        "Seraikela Kharsawan", "Simdega", "West Singhbhum"
    ],
    "Chhattisgarh": [
        "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", 
        "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", 
        "Jashpur", "Kabirdham (Kawardha)", "Kanker", "Khairagarh-Chhuikhadan-Gandai", 
        "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", 
        "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", 
        "Rajnandgaon", "Sarangarh-Bilaigarh", "Sakti", "Sukma", "Surajpur", "Surguja"
    ],
    "Uttarakhand": [
        "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", 
        "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", 
        "Uttarkashi"
    ],
    "Himachal Pradesh": [
        "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", 
        "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
    ],
    "Goa": [
        "North Goa (Panaji)", "South Goa (Margao)"
    ],
    "Tripura": [
        "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", 
        "Unakoti", "West Tripura (Agartala)"
    ],
    "Manipur": [
        "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", 
        "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", 
        "Tengnoupal", "Thoubal", "Ukhrul"
    ],
    "Meghalaya": [
        "Eastern West Khasi Hills", "East Garo Hills", "East Jaintia Hills", "East Khasi Hills (Shillong)", 
        "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", 
        "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
    ],
    "Mizoram": [
        "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", 
        "Mamit", "Saitual", "Serchhip", "Siaha"
    ],
    "Nagaland": [
        "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", 
        "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyü", "Tuensang", "Wokha", 
        "Zünheboto"
    ],
    "Arunachal Pradesh": [
        "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", 
        "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", 
        "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare (Itanagar)", 
        "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", 
        "West Siang", "Itanagar Capital Complex"
    ],
    "Sikkim": [
        "Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"
    ],
    "Jammu and Kashmir": [
        "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", 
        "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", 
        "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
    ],
    "Ladakh": [
        "Leh", "Kargil"
    ],
    "Puducherry": [
        "Puducherry", "Karaikal", "Mahe", "Yanam"
    ],
    "Chandigarh": [
        "Chandigarh"
    ],
    "Andaman and Nicobar Islands": [
        "Nicobar", "North and Middle Andaman", "South Andaman (Port Blair)"
    ],
    "Dadra and Nagar Haveli and Daman and Diu": [
        "Dadra and Nagar Haveli (Silvassa)", "Daman", "Diu"
    ],
    "Lakshadweep": [
        "Lakshadweep (Kavaratti)"
    ]
}

POPULAR_HUBS = [
    {
        "city": "Chennai",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "taluk": "Sholinganallur",
        "locality": "OMR & Sholinganallur",
        "tag": "Industrial & Tech Hub",
        "popular_taluks": ["Egmore", "Guindy", "Mylapore", "Sholinganallur", "Tambaram", "Velachery"]
    },
    {
        "city": "Bengaluru",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "taluk": "Whitefield",
        "locality": "Whitefield & ITPL",
        "tag": "Silicon Valley Hub",
        "popular_taluks": ["Whitefield", "Indiranagar", "Koramangala", "HSR Layout", "Electronic City", "Yelahanka"]
    },
    {
        "city": "Hyderabad",
        "state": "Telangana",
        "district": "Hyderabad",
        "taluk": "Madhapur",
        "locality": "Madhapur & HITEC City",
        "tag": "Cyberabad Hub",
        "popular_taluks": ["Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "Secunderabad", "Banjara Hills"]
    },
    {
        "city": "Mumbai",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "taluk": "Andheri",
        "locality": "Andheri & Bandra",
        "tag": "Commercial Capital",
        "popular_taluks": ["Andheri", "Bandra", "Borivali", "Kurla", "Dadar", "Powai"]
    },
    {
        "city": "New Delhi",
        "state": "Delhi",
        "district": "South Delhi",
        "taluk": "Saket",
        "locality": "Saket & South Extension",
        "tag": "National Capital Hub",
        "popular_taluks": ["Saket", "Connaught Place", "Dwarka", "Hauz Khas", "Lajpat Nagar"]
    },
    {
        "city": "Pune",
        "state": "Maharashtra",
        "district": "Pune",
        "taluk": "Hinjewadi",
        "locality": "Hinjewadi & Wakad",
        "tag": "Automobile & IT Hub",
        "popular_taluks": ["Hinjewadi", "Wakad", "Kothrud", "Viman Nagar", "Baner"]
    },
    {
        "city": "Kochi",
        "state": "Kerala",
        "district": "Ernakulam",
        "taluk": "Kakkanad",
        "locality": "Kakkanad & Infopark",
        "tag": "Port & Coastal Hub",
        "popular_taluks": ["Kakkanad", "Edappally", "Aluva", "Marine Drive"]
    },
    {
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "taluk": "Peelamedu",
        "locality": "Peelamedu & Gandhipuram",
        "tag": "Textile & Engineering Hub",
        "popular_taluks": ["Peelamedu", "Gandhipuram", "RS Puram", "Saravanampatti", "Pollachi"]
    },
    {
        "city": "Kolkata",
        "state": "West Bengal",
        "district": "Kolkata",
        "taluk": "Salt Lake",
        "locality": "Salt Lake & New Town",
        "tag": "Eastern Metropolis",
        "popular_taluks": ["Salt Lake", "New Town", "Park Street", "Ballygunge"]
    },
    {
        "city": "Ahmedabad",
        "state": "Gujarat",
        "district": "Ahmedabad",
        "taluk": "Satellite",
        "locality": "SG Highway & Satellite",
        "tag": "Commercial Center",
        "popular_taluks": ["Satellite", "SG Highway", "Vastrapur", "Navrangpura"]
    },
    {
        "city": "Jaipur",
        "state": "Rajasthan",
        "district": "Jaipur",
        "taluk": "Malviya Nagar",
        "locality": "Malviya Nagar & Mansarovar",
        "tag": "Heritage & Tourism Hub",
        "popular_taluks": ["Malviya Nagar", "Mansarovar", "Vaishali Nagar", "C-Scheme"]
    },
    {
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "taluk": "Gomti Nagar",
        "locality": "Gomti Nagar & Hazratganj",
        "tag": "Capital & Commerce Hub",
        "popular_taluks": ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar"]
    }
]


@router.get("/states", summary="Get all 28 Indian states and 8 UTs")
async def get_states():
    """Returns all 36 Indian states and Union Territories."""
    return {
        "success": True,
        "count": len(ALL_INDIAN_DISTRICTS),
        "data": list(ALL_INDIAN_DISTRICTS.keys())
    }


@router.get("/districts", summary="Get all official districts for a state")
async def get_districts(state: str = Query(..., description="Name of Indian state / UT")):
    """Returns all official districts for the given state (e.g. 38 for Tamil Nadu, 31 for Karnataka, 75 for UP, etc.)."""
    if state not in ALL_INDIAN_DISTRICTS:
        for s, d in ALL_INDIAN_DISTRICTS.items():
            if s.lower() == state.lower():
                return {"success": True, "state": s, "count": len(d), "data": d}
        raise HTTPException(status_code=404, detail=f"State '{state}' not found")
    
    districts = ALL_INDIAN_DISTRICTS[state]
    return {
        "success": True,
        "state": state,
        "count": len(districts),
        "data": districts
    }


@router.get("/popular", summary="Get popular Indian metropolitan and industrial hubs")
async def get_popular_hubs():
    """Returns top tier-1 and tier-2 city hubs across India."""
    return {
        "success": True,
        "count": len(POPULAR_HUBS),
        "data": POPULAR_HUBS
    }


@router.get("/search", summary="Autocomplete search for state, district, taluk or city across India")
async def search_locations(q: str = Query(..., min_length=2, description="Search query")):
    """Fast search across all 786 districts, 36 states, and taluk hubs in India."""
    q_lower = q.lower().strip()
    results = []

    # 1. Search popular hubs
    for hub in POPULAR_HUBS:
        if q_lower in hub["city"].lower() or q_lower in hub["state"].lower():
            results.append({
                "type": "city_hub",
                "name": hub["city"],
                "state": hub["state"],
                "district": hub["district"],
                "taluk": hub["taluk"],
                "locality": hub["locality"],
                "tag": hub["tag"]
            })
        for taluk in hub.get("popular_taluks", []):
            if q_lower in taluk.lower():
                results.append({
                    "type": "taluk_hub",
                    "name": f"{taluk}, {hub['city']}",
                    "state": hub["state"],
                    "district": hub["district"],
                    "taluk": taluk,
                    "locality": hub["locality"],
                    "tag": f"Taluk in {hub['city']}"
                })

    # 2. Search all 786 districts
    for state, dists in ALL_INDIAN_DISTRICTS.items():
        if q_lower in state.lower():
            results.append({
                "type": "state",
                "name": state,
                "state": state,
                "district": dists[0] if dists else state,
                "taluk": "",
                "locality": f"State with {len(dists)} Districts",
                "tag": "Indian State / UT"
            })
        for dist in dists:
            if q_lower in dist.lower():
                results.append({
                    "type": "district",
                    "name": dist,
                    "state": state,
                    "district": dist,
                    "taluk": "",
                    "locality": f"District in {state}",
                    "tag": "Official District"
                })

    # Deduplicate results
    unique_results = []
    seen = set()
    for r in results:
        key = (r["name"], r["state"])
        if key not in seen:
            seen.add(key)
            unique_results.append(r)

    return {
        "success": True,
        "query": q,
        "count": len(unique_results[:30]),
        "data": unique_results[:30]
    }
