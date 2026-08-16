import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveTrackingMap.css';

export default function LiveTrackingMap({
  jobTitle = 'On-Demand Service',
  workerName = 'Assigned Technician',
  workerRole = 'Service Professional',
  status = 'on_the_way', // 'accepted' | 'on_the_way' | 'arrived' | 'work_started' | 'work_completed'
  destinationAddress = 'Saket & South Extension Hub, New Delhi',
  etaMinutes = 8
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const workerMarkerRef = useRef(null);
  const [liveEta, setLiveEta] = useState(etaMinutes);

  // Base coordinates around destination
  const destLat = 28.5244;
  const destLng = 77.2188;

  // Worker starts a short distance away
  const [workerLat, setWorkerLat] = useState(28.5390);
  const [workerLng, setWorkerLng] = useState(77.2050);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [(destLat + workerLat) / 2, (destLng + workerLng) / 2],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Destination Pin (Customer Home)
    const destIcon = L.divIcon({
      className: 'dest-pin-icon',
      html: `
        <div class="dest-marker-badge">
          <span>🏠 Destination</span>
        </div>
      `,
      iconSize: [80, 26],
      iconAnchor: [40, 13]
    });

    L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`<strong>📍 Service Address</strong><p>${destinationAddress}</p>`)
      .addTo(map);

    // Worker Moving Pin
    const workerIcon = L.divIcon({
      className: 'worker-moving-icon',
      html: `
        <div class="worker-marker-badge">
          <span class="moving-vehicle-icon">🛵</span>
          <span>${workerName.split(' ')[0]}</span>
        </div>
      `,
      iconSize: [75, 26],
      iconAnchor: [37, 13]
    });

    const wMarker = L.marker([workerLat, workerLng], { icon: workerIcon })
      .bindPopup(`<strong>🛵 ${workerName}</strong><p>${workerRole} • On the way</p>`)
      .addTo(map);

    workerMarkerRef.current = wMarker;

    // Route Polyline (Dashed Line)
    const routeLine = L.polyline([
      [workerLat, workerLng],
      [destLat, destLng]
    ], {
      color: '#16a34a',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Simulate live worker movement
  useEffect(() => {
    if (status !== 'on_the_way') return;

    const interval = setInterval(() => {
      setWorkerLat((prevLat) => {
        const nextLat = prevLat + (destLat - prevLat) * 0.08;
        return nextLat;
      });
      setWorkerLng((prevLng) => {
        const nextLng = prevLng + (destLng - prevLng) * 0.08;
        return nextLng;
      });
      setLiveEta((prev) => (prev > 1 ? prev - 1 : 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [status]);

  // Update marker position when worker moves
  useEffect(() => {
    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLatLng([workerLat, workerLng]);
    }
  }, [workerLat, workerLng]);

  return (
    <div className="live-tracking-map-container">
      <div className="live-tracking-header">
        <div className="live-status-pill">
          <span className="live-pulse-dot"></span>
          <span>
            {status === 'on_the_way'
              ? `LIVE GPS TRACKING • ETA: ${liveEta} mins`
              : status === 'arrived'
              ? 'PRO HAS ARRIVED AT LOCATION'
              : 'SERVICE IN PROGRESS'}
          </span>
        </div>
        <span className="speed-tag">⚡ Live Updates</span>
      </div>

      <div ref={mapRef} className="live-map-canvas" style={{ height: '260px', width: '100%' }} />

      <div className="live-tracking-footer">
        <div className="footer-worker-info">
          <span className="worker-avatar">👤</span>
          <div>
            <strong>{workerName}</strong>
            <span>{workerRole}</span>
          </div>
        </div>
        <div className="footer-destination-info">
          <span className="dest-icon">📍</span>
          <span>{destinationAddress}</span>
        </div>
      </div>
    </div>
  );
}
