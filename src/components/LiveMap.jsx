import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, ExternalLink, MapPin } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geoUtils';
import { useAttendance } from '../context/AttendanceContext';

// Helper to generate initials avatar SVG if image fails
const getAvatarSrc = (emp, record) => {
  if (emp?.avatar) return emp.avatar;
  if (record?.capturedPhoto) return record.capturedPhoto;
  const name = emp?.name || record?.employeeName || 'Staff';
  const initial = name.trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#3B82F6"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-size="45" font-family="sans-serif" font-weight="bold">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Create custom glowing map marker icon
const createCustomMarkerIcon = (avatarUrl, isOnline, name) => {
  const ringColor = isOnline ? '#10B981' : '#6B7280';
  const shadowColor = isOnline ? 'rgba(16, 185, 129, 0.5)' : 'rgba(0,0,0,0.2)';

  const html = `
    <div style="
      position: relative;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      box-shadow: 0 0 16px ${shadowColor};
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <img src="${avatarUrl}" style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      " alt="${name}" />
      ${isOnline ? `
        <span style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 6px #10B981;
        "></span>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-map-marker',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23]
  });
};

// Dynamic Map Bounds/Center Controller
function MapAutoBounds({ pins }) {
  const map = useMap();

  useEffect(() => {
    if (!pins || pins.length === 0) return;
    try {
      const validPoints = pins
        .map(p => p.coords)
        .filter(c => c && typeof c.lat === 'number' && typeof c.lng === 'number');

      if (validPoints.length === 1) {
        map.setView([validPoints[0].lat, validPoints[0].lng], 13);
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } catch (e) {
      console.warn("Map bounds fit notice:", e);
    }
  }, [pins, map]);

  return null;
}

export default function LiveMap({ activeRecords = [], records = [], employees = [] }) {
  const { theme } = useAttendance();

  // Combine records & employee profiles to ensure every employee has a pin on the map
  const effectiveRecords = activeRecords.length > 0 ? activeRecords : records;

  // Build map pin list
  const pins = [];
  const processedEmpIds = new Set();

  // 1. Process active clock-in & attendance records
  effectiveRecords.forEach(rec => {
    if (!rec || !rec.employeeId) return;
    const emp = employees.find(e => e.id === rec.employeeId);
    
    // Determine coordinates (from record geotag, or employee fallback, or default city)
    let lat = rec.coordinates?.lat || emp?.coordinates?.lat || 12.9716;
    let lng = rec.coordinates?.lng || emp?.coordinates?.lng || 77.5946;

    // Small random offset if multiple pins stack on identical coordinates
    if (pins.some(p => Math.abs(p.coords.lat - lat) < 0.001 && Math.abs(p.coords.lng - lng) < 0.001)) {
      lat += (Math.random() - 0.5) * 0.008;
      lng += (Math.random() - 0.5) * 0.008;
    }

    const isOnline = rec.status === 'CLOCK_IN';

    pins.push({
      id: `PIN_REC_${rec.id}`,
      employeeId: rec.employeeId,
      name: rec.employeeName || emp?.name || 'Employee',
      role: emp?.role || emp?.department || 'Staff',
      avatar: getAvatarSrc(emp, rec),
      locationName: rec.locationName || emp?.defaultCity || 'GPS Geotag',
      clockInTime: rec.clockInTime || 'N/A',
      workMode: rec.workMode || emp?.workMode || 'Remote',
      isOnline: isOnline,
      coords: { lat, lng }
    });

    processedEmpIds.add(rec.employeeId);
  });

  // 2. Include all remaining registered employees as OFF-DUTY pins
  employees.forEach(emp => {
    if (!emp || processedEmpIds.has(emp.id)) return;

    let lat = emp.coordinates?.lat || 12.9716;
    let lng = emp.coordinates?.lng || 77.5946;

    // Offset stacked default pins
    if (pins.some(p => Math.abs(p.coords.lat - lat) < 0.001 && Math.abs(p.coords.lng - lng) < 0.001)) {
      lat += (Math.random() - 0.5) * 0.012;
      lng += (Math.random() - 0.5) * 0.012;
    }

    pins.push({
      id: `PIN_EMP_${emp.id}`,
      employeeId: emp.id,
      name: emp.name,
      role: emp.role || emp.department || 'Staff',
      avatar: getAvatarSrc(emp, null),
      locationName: emp.defaultCity || emp.location || 'Registered Base',
      clockInTime: 'Off Duty',
      workMode: emp.workMode || 'Remote',
      isOnline: false,
      coords: { lat, lng }
    });
  });

  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div style={{ position: 'relative', width: '100%', height: '460px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      
      {/* Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '0.5rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.78rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          <span>Active Shift ({pins.filter(p => p.isOnline).length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6B7280', display: 'inline-block' }} />
          <span>Off Duty ({pins.filter(p => !p.isOnline).length})</span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: 'var(--bg-main)' }}
      >
        <MapAutoBounds pins={pins} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={theme === 'dark' ? 'dark-map-tiles' : ''}
        />

        {pins.map(pin => {
          const icon = createCustomMarkerIcon(pin.avatar, pin.isOnline, pin.name);
          const googleMapsUrl = getGoogleMapsUrl(pin.coords.lat, pin.coords.lng);

          return (
            <Marker
              key={pin.id}
              position={[pin.coords.lat, pin.coords.lng]}
              icon={icon}
            >
              <Popup>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.2rem', minWidth: '230px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={pin.avatar}
                      alt={pin.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${pin.isOnline ? '#10B981' : '#6B7280'}` }}
                    />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {pin.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {pin.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <Navigation size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{pin.locationName}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: pin.isOnline ? 'var(--accent-emerald)' : 'var(--text-subtle)' }} />
                      <span>Shift Status: <strong style={{ color: pin.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>{pin.isOnline ? `Clocked in (${pin.clockInTime})` : 'Off Duty'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.3rem' }}>
                      <span className={`status-badge ${pin.isOnline ? 'online' : 'offline'}`}>
                        {pin.isOnline ? pin.workMode : 'Off Duty'}
                      </span>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        <span>Google Maps</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
