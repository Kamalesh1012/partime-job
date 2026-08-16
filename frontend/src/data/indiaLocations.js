/**
 * WorkMate India - Geographic dataset for all 28 Indian States & 8 Union Territories
 * Includes popular metros, tier-1/tier-2 cities, localities, and PIN code helpers
 */

export const POPULAR_INDIAN_CITIES = [
  { city: 'Chennai', state: 'Tamil Nadu', tag: 'Industrial & Auto Hub', icon: '🏛️', pincodes: ['600001', '600028', '600096', '600100', '600119'] },
  { city: 'Bengaluru', state: 'Karnataka', tag: 'Silicon Valley of India', icon: '💻', pincodes: ['560001', '560034', '560066', '560100', '560037'] },
  { city: 'Hyderabad', state: 'Telangana', tag: 'Cyberabad & Pharma Hub', icon: '🕌', pincodes: ['500001', '500032', '500081', '500084', '500034'] },
  { city: 'Mumbai', state: 'Maharashtra', tag: 'Financial Capital', icon: '🌆', pincodes: ['400001', '400053', '400050', '400076', '400069'] },
  { city: 'New Delhi', state: 'Delhi', tag: 'National Capital Region', icon: '🏛️', pincodes: ['110001', '110017', '110024', '110092', '110075'] },
  { city: 'Pune', state: 'Maharashtra', tag: 'Automobile & IT Hub', icon: '⚙️', pincodes: ['411001', '411057', '411014', '411028', '411045'] },
  { city: 'Kochi', state: 'Kerala', tag: 'Port & Maritime Hub', icon: '🌴', pincodes: ['682001', '682030', '682024', '682020', '682035'] },
  { city: 'Coimbatore', state: 'Tamil Nadu', tag: 'Textile & Pump City', icon: '🏭', pincodes: ['641001', '641014', '641004', '641018', '641035'] },
  { city: 'Kolkata', state: 'West Bengal', tag: 'Eastern Metropolis', icon: '🌉', pincodes: ['700001', '700091', '700029', '700064', '700019'] },
  { city: 'Ahmedabad', state: 'Gujarat', tag: 'Commercial Center', icon: '🏢', pincodes: ['380001', '380015', '380054', '380009', '380051'] },
  { city: 'Jaipur', state: 'Rajasthan', tag: 'Heritage & Tourism Hub', icon: '🏰', pincodes: ['302001', '302017', '302020', '302004', '302015'] },
  { city: 'Lucknow', state: 'Uttar Pradesh', tag: 'Capital & Commerce Hub', icon: '🕌', pincodes: ['226001', '226010', '226016', '226024', '226004'] },
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
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Hosur'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Shivamogga', 'Tumakuru', 'Udupi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Suryapet'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Kalyan-Dombivli', 'Navi Mumbai', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Saket'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Kannur', 'Alappuzha', 'Kottayam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Rajahmundry'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Greater Noida', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol', 'Kharagpur', 'Bardhaman'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Bikaner', 'Ajmer', 'Alwar', 'Bhilwara'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali', 'Bathinda'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Rohtak', 'Hisar', 'Sonipat'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Baddi'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal']
};
