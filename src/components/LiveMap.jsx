import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Clock, ExternalLink } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/geoUtils';
import { useAttendance } from '../context/AttendanceContext';

// Create glowing SVG/HTML DivIcon for employee markers
const createCustomMarkerIcon = (avatarUrl, status, name) => {
  const isOnline = status === 'CLOCK_IN';
  const ringColor = isOnline ? '#10B981' : '#6B7280';
  const shadowColor = isOnline ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0,0,0,0.3)';

  const html = `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      box-shadow: 0 0 15px ${shadowColor};
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <img src="${avatarUrl}" style="
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
      " alt="${name}" />
      ${isOnline ? `
        <span style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid var(--bg-card);
        "></span>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-map-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

export default function LiveMap({ activeRecords = [], employees = [] }) {
  const { theme } = useAttendance();

  // Center map on India overview
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div style={{ position: 'relative', width: '100%', height: '440px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: 'var(--bg-main)' }}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={theme === 'dark' ? 'dark-map-tiles' : ''}
        />

        {/* Map Markers for Employees */}
        {activeRecords.map(record => {
          if (!record.coordinates || !record.coordinates.lat || !record.coordinates.lng) return null;

          const emp = employees.find(e => e.id === record.employeeId) || {
            name: record.employeeName,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            role: 'Employee'
          };

          const icon = createCustomMarkerIcon(
            emp.avatar,
            record.status,
            emp.name
          );

          const googleMapsUrl = getGoogleMapsUrl(record.coordinates.lat, record.coordinates.lng);

          return (
            <Marker
              key={record.id}
              position={[record.coordinates.lat, record.coordinates.lng]}
              icon={icon}
            >
              <Popup>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.2rem', minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {emp.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {emp.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <Navigation size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{record.locationName}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: 'var(--accent-emerald)' }} />
                      <span>Logged In: <strong>{record.clockInTime}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.3rem' }}>
                      <span className={`status-badge ${record.workMode === 'Remote' ? 'remote' : 'online'}`}>
                        {record.workMode}
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
