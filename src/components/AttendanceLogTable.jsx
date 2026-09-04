import React, { useState } from 'react';
import { MapPin, Search, Calendar, User, ExternalLink, Camera, X, Clock, Trash2 } from 'lucide-react';
import { getGoogleMapsUrl, formatDateDDMMYYYY, formatWorkDurationHHMM } from '../utils/geoUtils';
import { useAttendance } from '../context/AttendanceContext';

export default function AttendanceLogTable({ records = [], employees = [], title = "Attendance Logs" }) {
  const { deleteAttendanceRecord } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | Remote | Office
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | ON_TIME | LATE
  const [activeSelfieRecord, setActiveSelfieRecord] = useState(null); // Record selected to view selfie
  const [recordToDelete, setRecordToDelete] = useState(null); // Record selected for deletion confirmation

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
              <th>Selfie Check-in</th>
              <th>Work Mode</th>
              <th>Clock In Time</th>
              <th>Clock Out Time</th>
              <th>Work Duration (HH:MM)</th>
              <th>Status</th>
              <th>Location Address</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => {
                const emp = employees.find(e => e.id === record.employeeId) || {
                  name: record.employeeName,
                  role: 'Employee'
                };

                const formattedDate = formatDateDDMMYYYY(record.date);
                const workDurationStr = formatWorkDurationHHMM(record.clockInIso, record.clockOutIso);

                return (
                  <tr key={record.id}>
                    
                    {/* Employee info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.95rem'
                          }}
                        >
                          {(emp.name || 'E').charAt(0).toUpperCase()}
                        </div>
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

                    {/* Selfie Preview Column */}
                    <td>
                      {record.capturedPhoto ? (
                        <div
                          onClick={() => setActiveSelfieRecord(record)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.15s ease'
                          }}
                          title="Click to view full captured selfie"
                        >
                          <img
                            src={record.capturedPhoto}
                            alt="Check-in selfie"
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--primary)' }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Camera size={12} /> View
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>No Selfie</span>
                      )}
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

                    {/* Work Duration (HH:MM) */}
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.88rem' }}>
                        <Clock size={14} />
                        <span>{workDurationStr}</span>
                      </div>
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

                    {/* Delete Log Action Button */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setRecordToDelete(record)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid var(--accent-rose)',
                          color: 'var(--accent-rose)',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease'
                        }}
                        title="Delete only this attendance log"
                      >
                        <Trash2 size={14} />
                        <span>Delete Log</span>
                      </button>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No attendance records found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Captured Selfie Inspection Modal */}
      {activeSelfieRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={20} style={{ color: 'var(--primary)' }} />
                  <span>Check-In Selfie Audit</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {activeSelfieRecord.employeeName} • {formatDateDDMMYYYY(activeSelfieRecord.date)} at {activeSelfieRecord.clockInTime}
                </p>
              </div>
              <button onClick={() => setActiveSelfieRecord(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* High-res Captured Selfie */}
            <div style={{ width: '100%', height: '320px', background: '#000000', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--primary)', marginBottom: '1.25rem' }}>
              <img
                src={activeSelfieRecord.capturedPhoto}
                alt="Captured Check-in Selfie"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Audit Details */}
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Work Duration:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatWorkDurationHHMM(activeSelfieRecord.clockInIso, activeSelfieRecord.clockOutIso)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Lateness Status:</span>
                <span className={`status-badge ${activeSelfieRecord.latenessStatus === 'LATE' ? 'late' : 'online'}`}>
                  {activeSelfieRecord.latenessStatus === 'LATE' ? 'LATE' : 'ON TIME'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Work Mode:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{activeSelfieRecord.workMode}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Captured Location:
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {activeSelfieRecord.locationName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSelfieRecord(null)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
            >
              Close Verification
            </button>

          </div>
        </div>
      )}

      {/* Delete Single Attendance Log Confirmation Modal */}
      {recordToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-rose)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)', fontWeight: 800, fontSize: '1.1rem' }}>
                <Trash2 size={22} />
                <span>Delete Attendance Log</span>
              </div>
              <button onClick={() => setRecordToDelete(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to delete this specific attendance log for <strong>{recordToDelete.employeeName || 'Employee'}</strong> recorded on <strong>{formatDateDDMMYYYY(recordToDelete.date)}</strong> at <strong>{recordToDelete.clockInTime}</strong>?
            </p>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--accent-rose)', fontWeight: 600, marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-rose)' }}>
              ℹ️ Note: This will only remove this single attendance entry. The employee's account, profile details, and other records will remain untouched.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendanceRecord(recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="btn-danger"
                style={{
                  padding: '0.55rem 1.25rem',
                  background: 'var(--accent-rose)',
                  borderColor: 'var(--accent-rose)',
                  color: '#FFFFFF',
                  fontWeight: 700
                }}
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
