/**
 * SEWAA India - Hierarchical Geographic Data
 * Structure: Country -> State -> District -> Taluk / Sub-District -> City / Locality -> PIN Code
 */

export const POPULAR_INDIAN_CITIES = [
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    district: 'Chennai / Chengalpattu',
    taluk: 'Sholinganallur',
    locality: 'OMR & Sholinganallur',
    tag: 'Industrial & Tech Hub',
    pincodes: ['600119', '600096', '600100', '600028']
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluk: 'Bengaluru East',
    locality: 'Whitefield & ITPL',
    tag: 'Silicon Valley Hub',
    pincodes: ['560066', '560037', '560100', '560034']
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    district: 'Hyderabad / Rangareddy',
    taluk: 'Serilingampally',
    locality: 'Madhapur & HITEC City',
    tag: 'Cyberabad Hub',
    pincodes: ['500081', '500084', '500032', '500034']
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    taluk: 'Andheri',
    locality: 'Andheri & Bandra',
    tag: 'Commercial Capital',
    pincodes: ['400053', '400050', '400076', '400069']
  },
  {
    city: 'New Delhi',
    state: 'Delhi',
    district: 'South Delhi',
    taluk: 'Saket / Hauz Khas',
    locality: 'Saket & South Extension',
    tag: 'National Capital Hub',
    pincodes: ['110017', '110024', '110001', '110075']
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    district: 'Pune',
    taluk: 'Mulshi / Haveli',
    locality: 'Hinjewadi & Wakad',
    tag: 'Automobile & IT Hub',
    pincodes: ['411057', '411014', '411028', '411045']
  },
  {
    city: 'Kochi',
    state: 'Kerala',
    district: 'Ernakulam',
    taluk: 'Kanayannur',
    locality: 'Kakkanad & Infopark',
    tag: 'Port & Coastal Hub',
    pincodes: ['682030', '682024', '682020', '682001']
  },
  {
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    taluk: 'Coimbatore South',
    locality: 'Peelamedu & Gandhipuram',
    tag: 'Textile & Engineering Hub',
    pincodes: ['641004', '641014', '641018', '641035']
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    district: 'North 24 Parganas / Kolkata',
    taluk: 'Bidhannagar',
    locality: 'Salt Lake & New Town',
    tag: 'Eastern Metropolis',
    pincodes: ['700091', '700156', '700064', '700029']
  },
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    district: 'Ahmedabad',
    taluk: 'Daskroi',
    locality: 'SG Highway & Satellite',
    tag: 'Commercial Center',
    pincodes: ['380054', '380015', '380051', '380009']
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    district: 'Jaipur',
    taluk: 'Sanganer',
    locality: 'Malviya Nagar & Mansarovar',
    tag: 'Heritage & Tourism Hub',
    pincodes: ['302017', '302020', '302004', '302015']
  },
  {
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    taluk: 'Lucknow Sadar',
    locality: 'Gomti Nagar & Hazratganj',
    tag: 'Capital & Commerce Hub',
    pincodes: ['226010', '226001', '226016', '226024']
  },
];

export const ALL_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const MAJOR_CITIES_BY_STATE = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Varanasi', 'Agra'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
};

export const DISTRICT_TALUK_DATA = {
  'Tamil Nadu': {
    'Chennai': { taluks: ['Egmore', 'Guindy', 'Mylapore', 'Tondiarpet', 'Velachery', 'Alandur'], localities: ['T Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Mylapore'] },
    'Chengalpattu': { taluks: ['Sholinganallur', 'Tambaram', 'Pallavaram', 'Vandalur', 'Chengalpattu'], localities: ['Sholinganallur', 'Tambaram', 'Chromepet', 'Kelambakkam'] },
    'Coimbatore': { taluks: ['Coimbatore North', 'Coimbatore South', 'Pollachi', 'Sulur'], localities: ['Peelamedu', 'Gandhipuram', 'RS Puram', 'Saravanampatti'] },
    'Madurai': { taluks: ['Madurai North', 'Madurai South', 'Melur', 'Thirumangalam'], localities: ['KK Nagar', 'Anna Nagar', 'Goripalayam', 'Simmakkal'] },
    'Tiruchirappalli': { taluks: ['Tiruchirappalli East', 'Tiruchirappalli West', 'Srirangam'], localities: ['Thillai Nagar', 'Cantonment', 'KK Nagar', 'Srirangam'] },
  },
  'Karnataka': {
    'Bengaluru Urban': { taluks: ['Bengaluru East', 'Bengaluru South', 'Bengaluru North', 'Anekal'], localities: ['Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Electronic City'] },
    'Mysuru': { taluks: ['Mysuru', 'Hunsur', 'Nanjangud', 'T Narasipura'], localities: ['Gokulam', 'Jayalakshmipuram', 'Kuvempunagar', 'Vijayanagar'] },
    'Dakshina Kannada': { taluks: ['Mangaluru', 'Bantwal', 'Puttur', 'Belthangady'], localities: ['Kadri', 'Bejai', 'Hampankatta', 'Surathkal'] },
  },
  'Telangana': {
    'Hyderabad': { taluks: ['Secunderabad', 'Khairatabad', 'Golconda', 'Charminar', 'Musheerabad'], localities: ['Banjara Hills', 'Jubilee Hills', 'Ameerpet', 'Begumpet'] },
    'Rangareddy': { taluks: ['Serilingampally', 'Rajendranagar', 'Gandipet'], localities: ['Madhapur', 'Gachibowli', 'Kondapur', 'HITEC City', 'Manikonda'] },
  },
  'Maharashtra': {
    'Mumbai Suburban': { taluks: ['Andheri', 'Borivali', 'Kurla'], localities: ['Andheri West', 'Bandra West', 'Goregaon', 'Malad', 'Powai'] },
    'Pune': { taluks: ['Haveli', 'Mulshi', 'Pune City'], localities: ['Hinjewadi', 'Kothrud', 'Wakad', 'Viman Nagar', 'Baner'] },
    'Thane': { taluks: ['Thane', 'Kalyan', 'Bhiwandi'], localities: ['Ghodbunder Road', 'Naupada', 'Vartak Nagar'] },
  },
  'Delhi': {
    'South Delhi': { taluks: ['Saket', 'Hauz Khas', 'Mehrauli'], localities: ['Saket', 'Hauz Khas', 'Greater Kailash', 'Malviya Nagar'] },
    'New Delhi': { taluks: ['Chanakyapuri', 'Connaught Place', 'Delhi Cantonment'], localities: ['Connaught Place', 'Lajpat Nagar', 'South Extension', 'Khan Market'] },
  },
  'Kerala': {
    'Ernakulam': { taluks: ['Kanayannur', 'Kochi', 'Aluva', 'Paravur'], localities: ['Kakkanad', 'Edappally', 'Marine Drive', 'Kaloor', 'Palarivattom'] },
    'Thiruvananthapuram': { taluks: ['Thiruvananthapuram', 'Neyyattinkara', 'Nedumangad'], localities: ['Kazhakkoottam', 'Technopark', 'Kowdiar', 'Pattom'] },
  }
};
