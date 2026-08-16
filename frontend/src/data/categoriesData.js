/**
 * WorkMate India - Taxonomy of Part-Time Jobs and Technician & Local Home Services
 */

export const PART_TIME_JOB_CATEGORIES = [
  { id: 'Delivery', title: 'Delivery Partner', icon: '🛵', subtitle: 'Food, Grocery, E-commerce', avg_pay: '₹600 - ₹1200 / day' },
  { id: 'Packing', title: 'Packing & Sorting', icon: '📦', subtitle: 'Warehouse, Hub fulfillment', avg_pay: '₹500 - ₹900 / day' },
  { id: 'Store Assistant', title: 'Store Assistant', icon: '🏪', subtitle: 'Retail, Supermarket, Malls', avg_pay: '₹600 - ₹1000 / day' },
  { id: 'Event Staff', title: 'Event & Catering', icon: '🎪', subtitle: 'Banquets, Exhibitions, Weddings', avg_pay: '₹1000 - ₹2000 / event' },
  { id: 'Security', title: 'Security & Gate Help', icon: '🛡️', subtitle: 'Offices, Events, Housing', avg_pay: '₹700 - ₹1100 / shift' },
  { id: 'Driver', title: 'Driver (Car/Van/Auto)', icon: '🚗', subtitle: 'On-demand, Delivery trips', avg_pay: '₹800 - ₹1500 / day' },
  { id: 'Data Entry', title: 'Data Entry & Office', icon: '💻', subtitle: 'Typing, Scanning, Billing', avg_pay: '₹400 - ₹800 / day' },
  { id: 'Customer Support', title: 'Customer Support', icon: '🎧', subtitle: 'Call support, Helpdesk', avg_pay: '₹10k - ₹18k / month' },
  { id: 'Marketing', title: 'Sales & Field Promoter', icon: '📢', subtitle: 'Canvassing, Pamphlets, Booths', avg_pay: '₹600 - ₹1200 / day' },
  { id: 'Hotel Helper', title: 'Hotel & Kitchen Helper', icon: '🍳', subtitle: 'Kitchen prep, Dishwashing', avg_pay: '₹500 - ₹900 / day' },
  { id: 'Mechanic Helper', title: 'Mechanic Helper', icon: '⚙️', subtitle: 'Car/Bike service, Wash helper', avg_pay: '₹500 - ₹900 / day' },
  { id: 'Daily Wage', title: 'Daily Wage Work', icon: '🏗️', subtitle: 'Loading, Unloading, Shift help', avg_pay: '₹600 - ₹1000 / day' },
];

export const TECHNICIAN_SERVICE_CATEGORIES = [
  { id: 'electrician', title: 'Electrician', icon: '⚡', subtitle: 'Wiring, switches, fuse & fan fixing', min_price: '₹299' },
  { id: 'plumber', title: 'Plumber', icon: '🔧', subtitle: 'Leakage, taps, pipes, bathroom', min_price: '₹249' },
  { id: 'ac_repair', title: 'AC Repair & Gas', icon: '❄️', subtitle: 'Cooling problem, servicing, filter', min_price: '₹499' },
  { id: 'refrigerator', title: 'Refrigerator Repair', icon: '🧊', subtitle: 'Compressor, ice cooling, thermostat', min_price: '₹349' },
  { id: 'washing_machine', title: 'Washing Machine', icon: '🧺', subtitle: 'Drum spin, water drain, motor', min_price: '₹399' },
  { id: 'tv_repair', title: 'Smart TV & Mounting', icon: '📺', subtitle: 'Display, sound, wall stand', min_price: '₹349' },
  { id: 'ro_service', title: 'RO Water Purifier', icon: '💧', subtitle: 'Filter change, TDS check, leaks', min_price: '₹299' },
  { id: 'cleaning', title: 'Home Deep Cleaning', icon: '🧹', subtitle: 'Kitchen, bathroom, sofa wash', min_price: '₹599' },
  { id: 'mechanic', title: 'Car & Bike Mechanic', icon: '🏍️', subtitle: 'Doorstep puncture, oil change', min_price: '₹299' },
  { id: 'carpenter', title: 'Carpenter Woodwork', icon: '🪚', subtitle: 'Doors, locks, tables, cupboards', min_price: '₹299' },
  { id: 'painter', title: 'House Painter', icon: '🎨', subtitle: 'Wall painting, touchup, waterproofing', min_price: '₹499' },
  { id: 'cctv_tech', title: 'CCTV & Wi-Fi Setup', icon: '📹', subtitle: 'Security cams, router config', min_price: '₹399' },
  { id: 'appliance_repair', title: 'Geyser & Microwave', icon: '♨️', subtitle: 'Heating coil, thermostat repair', min_price: '₹299' },
];

export const WORK_SHIFTS = [
  { id: 'all', label: 'All Shifts' },
  { id: 'Morning', label: '🌅 Morning (6 AM - 12 PM)' },
  { id: 'Afternoon', label: '☀️ Afternoon (12 PM - 5 PM)' },
  { id: 'Evening', label: '🌆 Evening (5 PM - 10 PM)' },
  { id: 'Night', label: '🌙 Night (10 PM - 6 AM)' },
  { id: 'Flexible', label: '🔄 Flexible Hours' },
];

export const JOB_TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'Part-time', label: '⏱️ Part-Time' },
  { id: 'Daily wage', label: '💵 Daily Wage' },
  { id: 'Weekend', label: '📅 Weekend' },
  { id: 'One-day job', label: '⚡ Urgent 1-Day' },
];
