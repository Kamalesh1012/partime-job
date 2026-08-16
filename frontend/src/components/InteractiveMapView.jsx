import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '../store';
import './InteractiveMapView.css';

// Geographic Coordinates Directory for Indian Metros, Districts and States
const CITY_COORDINATES = {
  // Metros & Major Hubs
  'Chennai': [13.0827, 80.2707],
  'Sholinganallur': [12.8996, 80.2279],
  'Coimbatore': [11.0168, 76.9558],
  'Madurai': [9.9252, 78.1198],
  'Tiruchirappalli': [10.7905, 78.7047],
  'Salem': [11.6643, 78.1460],
  'Tiruppur': [11.1085, 77.3411],
  'Erode': [11.3410, 77.7172],
  'Vellore': [12.9165, 79.1325],
  'Tirunelveli': [8.7139, 77.7567],
  'Chengalpattu': [12.6819, 79.9888],
  'Kanchipuram': [12.8342, 79.7036],
  'Ariyalur': [11.1401, 79.0786],
  'Virudhunagar': [9.5680, 77.9624],
  'Thoothukudi': [8.7642, 78.1348],
  'Dindigul': [10.3673, 77.9803],
  'Thanjavur': [10.7870, 79.1378],
  'Cuddalore': [11.7480, 79.7714],
  'Dharmapuri': [12.1211, 78.1582],
  'Krishnagiri': [12.5186, 78.2137],
  'Kanyakumari': [8.0883, 77.5385],
  'Nagapattinam': [10.7672, 79.8449],
  'Namakkal': [11.2189, 78.1674],
  'Nilgiris': [11.4102, 76.6950],
  'Pudukkottai': [10.3797, 78.8208],
  'Ramanathapuram': [9.3639, 78.8395],
  'Ranipet': [12.9272, 79.3330],
  'Sivaganga': [9.8433, 78.4809],
  'Tenkasi': [8.9594, 77.3152],
  'Theni': [10.0104, 77.4768],
  'Tirupathur': [12.4962, 78.5678],
  'Tiruvallur': [13.1432, 79.9074],
  'Tiruvannamalai': [12.2253, 79.0747],
  'Tiruvarur': [10.7725, 79.6365],
  'Viluppuram': [11.9401, 79.4861],
  'Bengaluru': [12.9716, 77.5946],
  'Bengaluru Urban': [12.9716, 77.5946],
  'Bengaluru Rural': [13.2257, 77.5750],
  'Whitefield': [12.9698, 77.7500],
  'Mysuru': [12.2958, 76.6394],
  'Mangaluru': [12.9141, 74.8560],
  'Dakshina Kannada': [12.8703, 75.2285],
  'Hubballi-Dharwad': [15.3647, 75.1240],
  'Dharwad': [15.4589, 75.0078],
  'Belagavi': [15.8497, 74.4977],
  'Kalaburagi': [17.3297, 76.8343],
  'Davanagere': [14.4644, 75.9218],
  'Ballari': [15.1394, 76.9214],
  'Shivamogga': [13.9299, 75.5681],
  'Tumakuru': [13.3379, 77.1010],
  'Udupi': [13.3409, 74.7421],
  'Hassan': [13.0072, 76.1030],
  'Kolar': [13.1367, 78.1291],
  'Mandya': [12.5218, 76.8951],
  'Hyderabad': [17.3850, 78.4867],
  'Madhapur': [17.4483, 78.3915],
  'Warangal': [17.9689, 79.5941],
  'Nizamabad': [18.6725, 78.0941],
  'Khammam': [17.2473, 80.1514],
  'Karimnagar': [18.4386, 79.1288],
  'Mumbai': [19.0760, 72.8777],
  'Mumbai Suburban': [19.1136, 72.8697],
  'Mumbai City': [18.9388, 72.8354],
  'Andheri': [19.1136, 72.8697],
  'Pune': [18.5204, 73.8567],
  'Hinjewadi': [18.5913, 73.7389],
  'Nagpur': [21.1458, 79.0882],
  'Thane': [19.2183, 72.9781],
  'Nashik': [19.9975, 73.7898],
  'Chhatrapati Sambhajinagar': [19.8762, 75.3433],
  'New Delhi': [28.6139, 77.2090],
  'Delhi': [28.6139, 77.2090],
  'South Delhi': [28.5244, 77.2188],
  'Saket': [28.5244, 77.2188],
  'Kochi': [9.9312, 76.2673],
  'Ernakulam': [9.9816, 76.2999],
  'Kakkanad': [10.0159, 76.3419],
  'Thiruvananthapuram': [8.5241, 76.9366],
  'Kozhikode': [11.2588, 75.7804],
  'Kolkata': [22.5726, 88.3639],
  'Salt Lake': [22.5804, 88.4174],
  'Ahmedabad': [23.0225, 72.5714],
  'Surat': [21.1702, 72.8311],
  'Vadodara': [22.3072, 73.1812],
  'Jaipur': [26.9124, 75.7873],
  'Jodhpur': [26.2389, 73.0243],
  'Lucknow': [26.8467, 80.9462],
  'Gomti Nagar': [26.8530, 80.9984],
  'Noida': [28.5355, 77.3910],
  'Gautam Buddha Nagar': [28.5355, 77.3910],
  'Ghaziabad': [28.6692, 77.4538],
  'Varanasi': [25.3176, 82.9739],
  'Kanpur': [26.4499, 80.3319],
  'Agra': [27.1767, 78.0081],
  'Prayagraj': [25.4358, 81.8463],
  'Patna': [25.5941, 85.1376],
  'Bhopal': [23.2599, 77.4126],
  'Indore': [22.7196, 75.8577],
  'Visakhapatnam': [17.6868, 83.2185],
  'Vijayawada': [16.5062, 80.6480],
  'Guntur': [16.3067, 80.4365],
  'Tirupati': [13.6288, 79.4192],
  'Ludhiana': [30.9010, 75.8573],
  'Amritsar': [31.6340, 74.8723],
  'Chandigarh': [30.7333, 76.7794],
  'Gurugram': [28.4595, 77.0266],
  'Faridabad': [28.4089, 77.3178],
  'Guwahati': [26.1445, 91.7362],
  'Bhubaneswar': [20.2961, 85.8245],
  'Cuttack': [20.4625, 85.8828],
  'Raipur': [21.2514, 81.6296],
  'Ranchi': [23.3441, 85.3096],
  'Jamshedpur': [22.8046, 86.2029],
  'Dehradun': [30.3165, 78.0322],
  'Haridwar': [29.9457, 78.1642],
  'Shimla': [31.1048, 77.1734],
  'Srinagar': [34.0837, 74.7973],
  'Jammu': [32.7266, 74.8570],
  'Panaji': [15.4909, 73.8278],
  'Puducherry': [11.9416, 79.8083]
};

const STATE_CENTERS = {
  'Tamil Nadu': [11.1271, 78.6569],
  'Karnataka': [15.3173, 75.7139],
  'Kerala': [10.8505, 76.2711],
  'Andhra Pradesh': [15.9129, 79.7400],
  'Telangana': [18.1124, 79.0193],
  'Maharashtra': [19.7515, 75.7139],
  'Gujarat': [22.2587, 71.1924],
  'Rajasthan': [27.0238, 74.2179],
  'Uttar Pradesh': [26.8467, 80.9462],
  'Madhya Pradesh': [22.9734, 78.6569],
  'West Bengal': [22.9868, 87.8550],
  'Bihar': [25.0961, 85.3131],
  'Punjab': [31.1471, 75.3412],
  'Haryana': [29.0588, 76.0856],
  'Delhi': [28.7041, 77.1025],
  'Odisha': [20.9517, 85.0985],
  'Assam': [26.2006, 92.9376],
  'Jharkhand': [23.6102, 85.2799],
  'Chhattisgarh': [21.2787, 81.8661],
  'Uttarakhand': [30.0668, 79.0193],
  'Himachal Pradesh': [31.1048, 77.1734],
  'Goa': [15.2993, 74.1240],
  'Tripura': [23.9408, 91.9882],
  'Manipur': [24.6637, 93.9063],
  'Meghalaya': [25.4670, 91.3662],
  'Mizoram': [23.1645, 92.9376],
  'Nagaland': [26.1584, 94.5624],
  'Arunachal Pradesh': [28.2180, 94.7278],
  'Sikkim': [27.5330, 88.5122],
  'Jammu and Kashmir': [33.7782, 76.5762],
  'Ladakh': [34.1526, 77.5771],
  'Puducherry': [11.9416, 79.8083],
  'Chandigarh': [30.7333, 76.7794],
  'Andaman and Nicobar Islands': [11.7401, 92.6586],
  'Dadra and Nagar Haveli and Daman and Diu': [20.3974, 72.8328],
  'Lakshadweep': [10.5667, 72.6417]
};

export default function InteractiveMapView({
  technicians = [],
  jobs = [],
  onSelectTechnician,
  onSelectJob,
  height = '480px',
  showFilters = true
}) {
  const { selectedCity, selectedState, selectedArea, radiusKm, setLocation, openLocationModal } = useLocationStore();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'technicians' | 'jobs'
  const [mapLoaded, setMapLoaded] = useState(false);

  // Helper to get coordinates for city/area
  const getCoords = (city, state, area) => {
    if (area && CITY_COORDINATES[area]) return CITY_COORDINATES[area];
    if (city && CITY_COORDINATES[city]) return CITY_COORDINATES[city];
    if (state && STATE_CENTERS[state]) return STATE_CENTERS[state];
    return [13.0827, 80.2707]; // Chennai fallback
  };

  const centerCoords = getCoords(selectedCity, selectedState, selectedArea);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: centerCoords,
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: true
    });

    // High quality OpenStreetMap tile layer with retina support
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // Zoom Controls top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedCity, selectedState]);

  // Update Markers & Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const [centerLat, centerLng] = centerCoords;

    // Pan / Fly to center
    map.setView([centerLat, centerLng], 12);

    // 1. Center Location Marker (User / Active City)
    const userIcon = L.divIcon({
      className: 'custom-map-user-pin',
      html: `
        <div class="user-pin-bubble">
          <span class="user-pin-dot"></span>
          <span class="user-pin-pulse"></span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const userMarker = L.marker([centerLat, centerLng], { icon: userIcon })
      .bindPopup(`
        <div class="map-popup-card user-popup">
          <strong>📍 Active Location: ${selectedArea ? `${selectedArea}, ` : ''}${selectedCity}</strong>
          <p>${selectedState} • Search radius: ${radiusKm} km</p>
        </div>
      `);
    layerGroup.addLayer(userMarker);

    // Add search radius circle
    const radiusCircle = L.circle([centerLat, centerLng], {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 1.5,
      radius: (radiusKm || 10) * 1000
    });
    layerGroup.addLayer(radiusCircle);

    // 2. Add Technician Markers
    if (activeFilter === 'all' || activeFilter === 'technicians') {
      const demoTechs = technicians.length > 0 ? technicians : [
        { id: 'tech-1', full_name: 'Murugan Sundaram', role: 'Electrician', rating: 4.9, visiting_charge: 199, locality: 'Main Hub' },
        { id: 'tech-2', full_name: 'Ramesh Gowda', role: 'AC Specialist', rating: 4.8, visiting_charge: 299, locality: 'Sector 4' },
        { id: 'tech-3', full_name: 'Suresh Kumar', role: 'Plumbing Expert', rating: 4.95, visiting_charge: 149, locality: 'Express Ave' },
        { id: 'tech-4', full_name: 'Anand Verma', role: 'Appliance Repair', rating: 4.85, visiting_charge: 249, locality: 'Ring Road' }
      ];

      demoTechs.forEach((tech, i) => {
        // Scatter around center coordinates
        const angle = (i * 2 * Math.PI) / demoTechs.length + 0.3;
        const dist = 0.015 + (i % 3) * 0.012;
        const lat = centerLat + Math.cos(angle) * dist;
        const lng = centerLng + Math.sin(angle) * dist;

        const techIcon = L.divIcon({
          className: 'custom-map-tech-pin',
          html: `
            <div class="tech-marker-badge">
              <span class="tech-marker-icon">🔧</span>
              <span class="tech-marker-name">${tech.full_name?.split(' ')[0] || 'Tech'}</span>
            </div>
          `,
          iconSize: [44, 30],
          iconAnchor: [22, 15]
        });

        const techMarker = L.marker([lat, lng], { icon: techIcon })
          .bindPopup(`
            <div class="map-popup-card tech-popup">
              <div class="popup-header">
                <strong>🔧 ${tech.full_name}</strong>
                <span class="popup-rating">⭐ ${tech.rating || 4.9}</span>
              </div>
              <p class="popup-role">${tech.service_categories?.[0] || tech.role || 'Verified Technician'}</p>
              <div class="popup-footer">
                <span class="popup-price">₹${tech.visiting_charge || 199} visit fee</span>
                <button class="popup-action-btn" id="book-tech-${tech.id}">Book Now</button>
              </div>
            </div>
          `);

        techMarker.on('popupopen', () => {
          const btn = document.getElementById(`book-tech-${tech.id}`);
          if (btn && onSelectTechnician) {
            btn.onclick = () => onSelectTechnician(tech);
          }
        });

        layerGroup.addLayer(techMarker);
      });
    }

    // 3. Add Job & Event Markers
    if (activeFilter === 'all' || activeFilter === 'jobs') {
      const demoJobs = jobs.length > 0 ? jobs : [
        { id: 'job-1', title: 'Grand Wedding Event Assistant', employer: 'Elite Banquets', pay: '₹950 / Day', category: 'Event Staff' },
        { id: 'job-2', title: 'Weekend Exhibition Stall Helper', employer: 'Trade Fair Hub', pay: '₹800 / Day', category: 'Exhibition' },
        { id: 'job-3', title: 'Express Parcel Delivery Partner', employer: 'City Logistics', pay: '₹1,200 / Day', category: 'Delivery' }
      ];

      demoJobs.forEach((job, i) => {
        const angle = (i * 2 * Math.PI) / demoJobs.length + 1.2;
        const dist = 0.02 + (i % 2) * 0.015;
        const lat = centerLat + Math.cos(angle) * dist;
        const lng = centerLng + Math.sin(angle) * dist;

        const jobIcon = L.divIcon({
          className: 'custom-map-job-pin',
          html: `
            <div class="job-marker-badge">
              <span class="job-marker-icon">🎪</span>
              <span class="job-marker-name">${job.title?.slice(0, 12)}...</span>
            </div>
          `,
          iconSize: [48, 30],
          iconAnchor: [24, 15]
        });

        const jobMarker = L.marker([lat, lng], { icon: jobIcon })
          .bindPopup(`
            <div class="map-popup-card job-popup">
              <div class="popup-header">
                <strong>🎪 ${job.title}</strong>
              </div>
              <p class="popup-role">${job.employer || job.company_name || 'Direct Organizer'}</p>
              <div class="popup-footer">
                <span class="popup-pay">${job.pay || job.salary_display || '₹800 - ₹1,200'}</span>
                <button class="popup-action-btn job-btn" id="apply-job-${job.id}">View Gig</button>
              </div>
            </div>
          `);

        jobMarker.on('popupopen', () => {
          const btn = document.getElementById(`apply-job-${job.id}`);
          if (btn && onSelectJob) {
            btn.onclick = () => onSelectJob(job);
          }
        });

        layerGroup.addLayer(jobMarker);
      });
    }
  }, [selectedCity, selectedState, selectedArea, radiusKm, activeFilter, technicians, jobs]);

  // Center on GPS button
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(centerCoords, 13, { duration: 1.2 });
    }
  };

  return (
    <div className="interactive-map-wrapper">
      {/* Top Map Filter Controls */}
      {showFilters && (
        <div className="map-controls-header">
          <div className="map-filter-pills">
            <button
              className={`map-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              📍 All Near You
            </button>
            <button
              className={`map-filter-pill ${activeFilter === 'technicians' ? 'active' : ''}`}
              onClick={() => setActiveFilter('technicians')}
            >
              🔧 Technicians
            </button>
            <button
              className={`map-filter-pill ${activeFilter === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveFilter('jobs')}
            >
              🎪 Events & Gigs
            </button>
          </div>

          <div className="map-right-actions">
            <button className="map-action-btn" onClick={openLocationModal} title="Change District">
              📍 {selectedCity} ▾
            </button>
            <button className="map-recenter-btn" onClick={handleRecenter} title="Re-center Map">
              🎯 Center
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="leaflet-map-canvas"
        style={{ height: height, width: '100%', borderRadius: '1rem' }}
      />

      {/* Bottom Map Info Footer */}
      <div className="map-info-footer">
        <span>📍 Map Center: <strong>{selectedArea ? `${selectedArea}, ` : ''}{selectedCity}, {selectedState}</strong></span>
        <span>• Pinch or Scroll to Zoom • Tap any pin to view details</span>
      </div>
    </div>
  );
}
