import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { formatDateDDMMYYYY, formatWorkDurationHHMM } from '../utils/geoUtils';
import {
  BarChart3, Clock, Calendar, CheckCircle, AlertCircle, Laptop, Building2,
  BookOpen, ShieldCheck, User, Search, Award, TrendingUp, Filter
} from 'lucide-react';

export default function EmployeeAnalyticsModule() {
  const { employees, records, leaves, workDiaries } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to format milliseconds into HH:MM (Hours:Minutes)
  const formatMsToHHMM = (totalMs) => {
    if (!totalMs || totalMs <= 0) return '00:00';
    const totalMins = Math.floor(totalMs / (1000 * 60));
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Calculate comprehensive analytics per employee
  const employeeAnalytics = employees.map(emp => {
    // 1. Attendance records for employee
    const empRecords = records.filter(r => r.employeeId === emp.id);

    // 2. Weekday Working Hours (EXCLUDING Saturday & Sunday)
    let totalWeekdayMs = 0;
    let weekdayShiftCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let remoteCount = 0;
    let officeCount = 0;
    let selfieVerifiedCount = 0;

    empRecords.forEach(r => {
      if (!r.date) return;
      const dateObj = new Date(r.date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Track shift metrics
      if (r.workMode === 'Remote') remoteCount++;
      else officeCount++;

      if (r.capturedPhoto) selfieVerifiedCount++;
      if (r.latenessStatus === 'LATE') lateCount++;
      else onTimeCount++;

      // Calculate working hours (Excluding Sat & Sun)
      if (!isWeekend && r.clockInIso) {
        weekdayShiftCount++;
        const startTime = new Date(r.clockInIso);
        const endTime = r.clockOutIso ? new Date(r.clockOutIso) : new Date();
        const durationMs = Math.max(0, endTime - startTime);
        totalWeekdayMs += durationMs;
      }
    });

    const totalWeekdayHHMM = formatMsToHHMM(totalWeekdayMs);
    const avgDailyShiftHHMM = weekdayShiftCount > 0 ? formatMsToHHMM(totalWeekdayMs / weekdayShiftCount) : '00:00';

    // 3. Approved Leaves Taken
    const empLeaves = leaves.filter(l => l.employeeId === emp.id && l.status === 'APPROVED');
    const totalLeavesTaken = empLeaves.reduce((sum, l) => sum + (l.days || 1), 0);

    // 4. Work Diary Compliance
    const empDiaries = workDiaries.filter(d => d.employeeId === emp.id);
    const diaryCompliancePercent = empRecords.length > 0 
      ? Math.min(100, Math.round((empDiaries.length / empRecords.length) * 100))
      : 0;

    // 5. Punctuality Rate (%)
    const totalShifts = empRecords.length;
    const punctualityRate = totalShifts > 0 ? Math.round((onTimeCount / totalShifts) * 100) : 100;

    return {
      employee: emp,
      totalWeekdayMs,
      totalWeekdayHHMM,
      weekdayShiftCount,
      avgDailyShiftHHMM,
      totalLeavesTaken,
      punctualityRate,
      onTimeCount,
      lateCount,
      remoteCount,
      officeCount,
      diaryCompliancePercent,
      selfieVerifiedCount,
      totalShifts
    };
  });

  // Total organization weekday working milliseconds
  const totalOrgWeekdayMs = employeeAnalytics.reduce((acc, curr) => acc + curr.totalWeekdayMs, 0);
  const totalOrgWeekdayHHMM = formatMsToHHMM(totalOrgWeekdayMs);

  // Filtered employees by search term
  const filteredAnalytics = employeeAnalytics.filter(item =>
    item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.employee.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.employee.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
            <span>Employee Analytics Dashboard</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Monitor weekday working hours in HH:MM format, leave balances, punctuality indices, WFH ratios & work diary compliance.
          </p>
        </div>

        {/* Search Filter */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search employee or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.55rem 1rem 0.55rem 2.4rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              outline: 'none',
              width: '240px'
            }}
          />
        </div>
      </div>

      {/* Organization Level Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mon-Fri Working Hrs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {totalOrgWeekdayHHMM} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'inherit' }}>hrs</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Approved Leaves</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {employeeAnalytics.reduce((acc, curr) => acc + curr.totalLeavesTaken, 0)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Punctuality</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {Math.round(employeeAnalytics.reduce((acc, curr) => acc + curr.punctualityRate, 0) / (employeeAnalytics.length || 1))}%
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Diary Submission</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {Math.round(employeeAnalytics.reduce((acc, curr) => acc + curr.diaryCompliancePercent, 0) / (employeeAnalytics.length || 1))}%
            </div>
          </div>
        </div>

      </div>

      {/* Individual Employee Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filteredAnalytics.map(item => (
          <div key={item.employee.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Employee Header Info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  {(item.employee.name || 'E').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {item.employee.name}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {item.employee.role} • {item.employee.department || 'General'}
                  </p>
                </div>
              </div>

              <span className={`status-badge ${item.employee.status === 'Active' ? 'online' : 'remote'}`}>
                {item.employee.status || 'Active'}
              </span>
            </div>

            {/* Core Required Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              
              {/* Working Hours (Excluding Sat & Sun) */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} style={{ color: 'var(--primary)' }} />
                  <span>Mon-Fri Work Hours</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {item.totalWeekdayHHMM} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'inherit' }}>hrs</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                  (Excludes Sat & Sun)
                </div>
              </div>

              {/* Leaves Taken */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} style={{ color: 'var(--accent-amber)' }} />
                  <span>Approved Leaves</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                  {item.totalLeavesTaken} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                  Leaves consumed
                </div>
              </div>

            </div>

            {/* 5 Additional Executive Audit Parameters */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                Executive Monitoring Parameters
              </div>

              {/* Parameter 1: Punctuality Index */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} style={{ color: 'var(--accent-emerald)' }} />
                  <span>1. Punctuality Index:</span>
                </span>
                <span style={{ fontWeight: 800, color: item.punctualityRate >= 80 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {item.punctualityRate}% On Time ({item.onTimeCount}/{item.totalShifts})
                </span>
              </div>

              {/* Parameter 2: Remote vs Office Work Breakdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Laptop size={14} style={{ color: 'var(--primary)' }} />
                  <span>2. WFH vs Office Ratio:</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.remoteCount} Remote / {item.officeCount} Office
                </span>
              </div>

              {/* Parameter 3: Daily Work Diary Compliance */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>3. Work Diary Submission:</span>
                </span>
                <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {item.diaryCompliancePercent}% Submitted
                </span>
              </div>

              {/* Parameter 4: Average Shift Duration */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--accent-purple)' }} />
                  <span>4. Avg Daily Shift Length:</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {item.avgDailyShiftHHMM} hrs / day
                </span>
              </div>

              {/* Parameter 5: Geotag & Selfie Audit Verification */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)' }} />
                  <span>5. Camera Check-In Verified:</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {item.selfieVerifiedCount} Photos Audited
                </span>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
