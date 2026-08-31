import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Users, Clock, AlertTriangle, ShieldCheck, MapPin, Settings, Trash2 } from 'lucide-react';
import AttendanceLogTable from './AttendanceLogTable';
import LiveMap from './LiveMap';
import ShiftPolicyModal from './ShiftPolicyModal';
import { formatTime12Hour } from '../utils/geoUtils';

export default function AdminDashboard() {
  const { records, employees, shiftPolicy, clearAllData } = useAttendance();
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Compute metrics
  const activeRecords = records.filter(r => r.status === 'CLOCK_IN');
  const lateCount = records.filter(r => r.latenessStatus === 'LATE').length;
  const totalEmployeesCount = employees.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Bar with Title & Config Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <ShieldCheck size={26} style={{ color: 'var(--accent-purple)' }} />
            <span>Admin Management Dashboard</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Workforce attendance tracking & live location intelligence
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowPolicyModal(true)}
          >
            <Settings size={16} />
            <span>Configure Shift Policy</span>
          </button>

          {records.length > 0 && (
            <button
              className="btn-danger"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all attendance logs and employee accounts?")) {
                  clearAllData();
                }
              }}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}
              title="Clear all stored logs and reset roster"
            >
              <Trash2 size={15} />
              <span>Clear All System Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Metric 1: Total Employees */}
        <div className="glass-card metric-card">
          <div className="metric-icon purple">
            <Users size={22} />
          </div>
          <div>
            <div className="metric-value">{totalEmployeesCount}</div>
            <div className="metric-label">Registered Workforce</div>
          </div>
        </div>

        {/* Metric 2: Currently Active/Clocked-In */}
        <div className="glass-card metric-card">
          <div className="metric-icon emerald">
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-value">{activeRecords.length}</div>
            <div className="metric-label">Currently Clocked In</div>
          </div>
        </div>

        {/* Metric 3: Late Arrivals */}
        <div className="glass-card metric-card">
          <div className="metric-icon rose">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="metric-value">{lateCount}</div>
            <div className="metric-label">Late Arrivals Today</div>
          </div>
        </div>

        {/* Metric 4: Shift Time Policy (12-Hour AM/PM Format) */}
        <div className="glass-card metric-card">
          <div className="metric-icon cyan">
            <MapPin size={22} />
          </div>
          <div>
            <div className="metric-value" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
              {formatTime12Hour(shiftPolicy.startTime)}
            </div>
            <div className="metric-label">Shift Start (+{shiftPolicy.graceMinutes}m Grace)</div>
          </div>
        </div>
      </div>

      {/* 1. All Employees Attendance Log Table */}
      <AttendanceLogTable
        records={records}
        employees={employees}
        title="Company-Wide Workforce Attendance Logs"
      />

      {/* 2. Interactive Live Map Overview */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Live Workforce Geolocation Map</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Real-time GPS tracking pins across India
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            ● {activeRecords.length} Active GPS Pins
          </span>
        </div>

        <LiveMap activeRecords={activeRecords} employees={employees} />
      </div>

      {/* Shift Policy Modal */}
      {showPolicyModal && (
        <ShiftPolicyModal onClose={() => setShowPolicyModal(false)} />
      )}

    </div>
  );
}
