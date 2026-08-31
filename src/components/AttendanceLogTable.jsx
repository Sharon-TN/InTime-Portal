import React, { useState } from 'react';
import { MapPin, Search, Calendar, User, ExternalLink } from 'lucide-react';
import { getGoogleMapsUrl, formatDateDDMMYYYY } from '../utils/geoUtils';

export default function AttendanceLogTable({ records = [], employees = [], title = "Attendance Logs" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | Remote | Office
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | ON_TIME | LATE

  // Filter logic
  const filteredRecords = records.filter(record => {
    const emp = employees.find(e => e.id === record.employeeId) || { name: record.employeeName };
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = filterMode === 'ALL' || record.workMode === filterMode;
    const matchesStatus = filterStatus === 'ALL' || record.latenessStatus === filterStatus;

    return matchesSearch && matchesMode && matchesStatus;
  });

  return (
    <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
      {/* Table Title & Filter Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          <span>{title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ({filteredRecords.length} records)
          </span>
        </h3>

        {/* Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search employee or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '210px'
              }}
            />
          </div>

          {/* Work Mode Filter */}
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Work Modes</option>
            <option value="Remote">Remote (WFH)</option>
            <option value="Office">In Office</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Lateness Statuses</option>
            <option value="ON_TIME">On Time</option>
            <option value="LATE">Late Arrival</option>
          </select>

        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Work Mode</th>
              <th>Clock In Time</th>
              <th>Clock Out Time</th>
              <th>Status</th>
              <th>Location Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => {
                const emp = employees.find(e => e.id === record.employeeId) || {
                  name: record.employeeName,
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  role: 'Employee'
                };

                const formattedDate = formatDateDDMMYYYY(record.date);

                return (
                  <tr key={record.id}>
                    
                    {/* Employee info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {emp.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Work Mode */}
                    <td>
                      <span className={`status-badge ${record.workMode === 'Remote' ? 'remote' : 'online'}`}>
                        {record.workMode === 'Remote' ? '💻 Remote' : '🏢 Office'}
                      </span>
                    </td>

                    {/* Clock In */}
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {record.clockInTime}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        {formattedDate}
                      </div>
                    </td>

                    {/* Clock Out */}
                    <td>
                      {record.clockOutTime ? (
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {record.clockOutTime}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                            {formattedDate}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontStyle: 'italic', fontWeight: 600 }}>
                          ● Shift Active
                        </span>
                      )}
                    </td>

                    {/* Lateness Status */}
                    <td>
                      <span className={`status-badge ${record.latenessStatus === 'LATE' ? 'late' : 'online'}`}>
                        {record.latenessStatus === 'LATE' ? 'LATE' : 'ON TIME'}
                      </span>
                    </td>

                    {/* Location Name & Google Maps Link */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                          <MapPin size={14} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                          <span>{record.locationName}</span>
                        </div>
                        {record.coordinates?.lat && (
                          <a
                            href={getGoogleMapsUrl(record.coordinates.lat, record.coordinates.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--accent-cyan)',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              marginLeft: '1.2rem'
                            }}
                          >
                            <span>Google Maps</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No attendance records found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
