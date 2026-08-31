import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { LogIn, LogOut, Navigation, MapPin, Laptop, Building2, Clock, ShieldAlert, ExternalLink } from 'lucide-react';
import AttendanceLogTable from './AttendanceLogTable';
import { formatDuration, getGoogleMapsUrl, formatTime12Hour } from '../utils/geoUtils';

export default function EmployeeDashboard() {
  const {
    currentUser,
    records,
    currentUserTodayRecord,
    clockIn,
    clockOut,
    shiftPolicy,
    employees
  } = useAttendance();

  const [workMode, setWorkMode] = useState(currentUser.workMode || 'Remote');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Timer for active clock-in session
  useEffect(() => {
    let interval = null;
    if (currentUserTodayRecord && currentUserTodayRecord.clockInIso) {
      const calculateElapsed = () => {
        const start = new Date(currentUserTodayRecord.clockInIso).getTime();
        const now = new Date().getTime();
        const seconds = Math.floor((now - start) / 1000);
        setElapsedSeconds(seconds > 0 ? seconds : 0);
      };
      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUserTodayRecord]);

  // Handle Clock In
  const handleClockIn = async () => {
    setLoading(true);
    setErrorMessage('');
    const res = await clockIn(workMode);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to clock in.");
    }
  };

  // Handle Clock Out (Direct & Instant)
  const handleClockOut = async () => {
    setLoading(true);
    setErrorMessage('');
    const res = await clockOut();
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || "Failed to clock out.");
    }
  };

  // Filter records for current logged-in employee ONLY
  const myRecords = records.filter(r => r.employeeId === currentUser.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Employee Greeting Header */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--primary)', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>Welcome back, {currentUser.name}!</h2>
              <span className={`status-badge ${currentUserTodayRecord ? 'online' : 'offline'}`}>
                {currentUserTodayRecord ? 'Clocked In' : 'Not Clocked In'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              {currentUser.role} • {currentUser.defaultCity}
            </p>
          </div>
        </div>

        {/* Expected shift info (12-Hour Format) */}
        <div style={{ display: 'flex', gap: '1.5rem', background: 'var(--bg-input)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Official Shift</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
              {formatTime12Hour(shiftPolicy.startTime)} - {formatTime12Hour(shiftPolicy.endTime)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Grace Period</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', color: 'var(--accent-amber)' }}>
              +{shiftPolicy.graceMinutes} mins
            </div>
          </div>
        </div>
      </div>

      {/* Main Clock Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card 1: Clock In / Clock Out Controls */}
        <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Shift Terminal
              </span>
              <Clock size={20} style={{ color: 'var(--primary)' }} />
            </div>

            {/* Mode Selection */}
            {!currentUserTodayRecord && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Select Today's Work Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setWorkMode('Remote')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: workMode === 'Remote' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      background: workMode === 'Remote' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)',
                      color: workMode === 'Remote' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Laptop size={16} />
                    <span>Remote WFH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkMode('Office')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: workMode === 'Office' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      background: workMode === 'Office' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-input)',
                      color: workMode === 'Office' ? 'var(--accent-purple)' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Building2 size={16} />
                    <span>In Office</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Shift Timer */}
            {currentUserTodayRecord && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Shift Duration
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
                  {formatDuration(elapsedSeconds)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.3rem' }}>
                  Logged in at {currentUserTodayRecord.clockInTime}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div>
            {!currentUserTodayRecord ? (
              <button
                className="btn-primary"
                onClick={handleClockIn}
                disabled={loading}
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
              >
                <LogIn size={20} />
                <span>{loading ? "Capturing Precise Location..." : "Clock In Now"}</span>
              </button>
            ) : (
              <button
                className="btn-danger"
                onClick={handleClockOut}
                disabled={loading}
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
              >
                <LogOut size={20} />
                <span>{loading ? "Clocking Out..." : "Clock Out"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Current Location & Status Info */}
        <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live GPS Location Verification
            </span>
            <Navigation size={20} style={{ color: 'var(--accent-cyan)' }} />
          </div>

          {currentUserTodayRecord ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>EXACT CAPTURED ADDRESS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={18} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{currentUserTodayRecord.locationName}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GPS COORDINATES</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>
                    {currentUserTodayRecord.coordinates?.lat?.toFixed(5)}°, {currentUserTodayRecord.coordinates?.lng?.toFixed(5)}°
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OPEN IN MAPS</div>
                  <a
                    href={getGoogleMapsUrl(currentUserTodayRecord.coordinates?.lat, currentUserTodayRecord.coordinates?.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      marginTop: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>View in Google Maps</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <MapPin size={40} style={{ color: 'var(--text-subtle)', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.92rem' }}>Exact street & area location captured upon Clock In.</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
                Uses high-accuracy GPS + street reverse geocoding.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Personal Attendance Logs */}
      <AttendanceLogTable
        records={myRecords}
        employees={employees}
        title={`My Personal Attendance History (${currentUser.name})`}
      />
    </div>
  );
}
