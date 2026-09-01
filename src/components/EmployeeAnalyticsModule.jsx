import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { formatDateDDMMYYYY, formatWorkDurationHHMM } from '../utils/geoUtils';
import {
  BarChart3, Clock, Calendar, CheckCircle, AlertCircle, Laptop, Building2,
  BookOpen, ShieldCheck, User, Search, Award, TrendingUp, Filter, PieChart as PieChartIcon, LayoutGrid
} from 'lucide-react';

const EMPLOYEE_COLORS = [
  '#3B82F6', // Vibrant Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Bright Amber
  '#8B5CF6', // Deep Purple
  '#EC4899', // Hot Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#6366F1'  // Indigo
];

// Custom Interactive SVG Donut / Pie Chart Component
const SvgPieChart = ({ data, size = 180, centerLabel = '', centerSubtext = '' }) => {
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0);
  let cumulativeAngle = 0;

  if (total === 0 || data.length === 0) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', color: 'var(--text-subtle)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
        <span>No Data Recorded</span>
      </div>
    );
  }

  const radius = 68;
  const strokeWidth = 24;
  const center = 90;

  const validData = data.filter(d => d.value > 0);

  // Single item 100% case
  if (validData.length === 1) {
    const single = validData[0];
    return (
      <svg width={size} height={size} viewBox="0 0 180 180">
        <circle cx={center} cy={center} r={radius} fill="none" stroke={single.color} strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius - strokeWidth / 2 - 2} fill="var(--bg-card)" />
        {centerLabel && (
          <text x={center} y={center + (centerSubtext ? -2 : 4)} textAnchor="middle" fill="var(--text-main)" fontSize="13" fontWeight="800">
            {centerLabel}
          </text>
        )}
        {centerSubtext && (
          <text x={center} y={center + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">
            {centerSubtext}
          </text>
        )}
      </svg>
    );
  }

  const slices = data.map((d, i) => {
    if (!d.value || d.value <= 0) return null;
    const angle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = center + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = center + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = center + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = center + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
    ].join(' ');

    const percent = Math.round((d.value / total) * 100);

    return (
      <path
        key={i}
        d={pathData}
        fill="none"
        stroke={d.color}
        strokeWidth={strokeWidth}
        style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
      >
        <title>{`${d.label}: ${d.displayValue || d.value} (${percent}%)`}</title>
      </path>
    );
  });

  return (
    <svg width={size} height={size} viewBox="0 0 180 180" style={{ overflow: 'visible' }}>
      {slices}
      <circle cx={center} cy={center} r={radius - strokeWidth / 2 - 2} fill="var(--bg-card)" />
      {centerLabel && (
        <text x={center} y={center + (centerSubtext ? -2 : 4)} textAnchor="middle" fill="var(--text-main)" fontSize="13" fontWeight="800">
          {centerLabel}
        </text>
      )}
      {centerSubtext && (
        <text x={center} y={center + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">
          {centerSubtext}
        </text>
      )}
    </svg>
  );
};

export default function EmployeeAnalyticsModule() {
  const { employees, records, leaves, workDiaries } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('PIE_CHARTS'); // 'PIE_CHARTS' | 'CARDS' | 'BOTH'

  // Helper to format milliseconds into HH:MM (Hours:Minutes)
  const formatMsToHHMM = (totalMs) => {
    if (!totalMs || totalMs <= 0) return '00:00';
    const totalMins = Math.floor(totalMs / (1000 * 60));
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Calculate comprehensive analytics per employee
  const employeeAnalytics = employees.map((emp, index) => {
    const color = EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];
    
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
      color,
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
  const totalOrgLeaves = employeeAnalytics.reduce((acc, curr) => acc + curr.totalLeavesTaken, 0);
  const totalOrgShifts = records.length;
  const totalOrgOnTime = employeeAnalytics.reduce((acc, curr) => acc + curr.onTimeCount, 0);
  const totalOrgLate = employeeAnalytics.reduce((acc, curr) => acc + curr.lateCount, 0);
  const totalOrgRemote = employeeAnalytics.reduce((acc, curr) => acc + curr.remoteCount, 0);
  const totalOrgOffice = employeeAnalytics.reduce((acc, curr) => acc + curr.officeCount, 0);
  const totalOrgDiariesSubmitted = workDiaries.length;

  // 1. Data for Working Hours Pie Chart
  const workingHoursPieData = employeeAnalytics.map(item => ({
    label: item.employee.name,
    value: item.totalWeekdayMs,
    displayValue: `${item.totalWeekdayHHMM} hrs`,
    color: item.color
  }));

  // 2. Data for Approved Leaves Pie Chart
  const leavesPieData = employeeAnalytics.map(item => ({
    label: item.employee.name,
    value: item.totalLeavesTaken,
    displayValue: `${item.totalLeavesTaken} days`,
    color: item.color
  }));

  // 3. Data for Punctuality Pie Chart (On-Time vs Late)
  const punctualityPieData = [
    { label: 'On-Time Arrivals', value: totalOrgOnTime, displayValue: `${totalOrgOnTime} Shifts`, color: '#10B981' },
    { label: 'Late Arrivals', value: totalOrgLate, displayValue: `${totalOrgLate} Shifts`, color: '#F43F5E' }
  ];

  // 4. Data for WFH vs Office Work Pie Chart
  const workModePieData = [
    { label: 'Remote (WFH)', value: totalOrgRemote, displayValue: `${totalOrgRemote} Shifts`, color: '#3B82F6' },
    { label: 'In-Office Attendance', value: totalOrgOffice, displayValue: `${totalOrgOffice} Shifts`, color: '#F59E0B' }
  ];

  // 5. Data for Work Diary Submission Compliance Pie Chart
  const diaryPieData = [
    { label: 'Diaries Submitted', value: totalOrgDiariesSubmitted, displayValue: `${totalOrgDiariesSubmitted} Logs`, color: '#06B6D4' },
    { label: 'Pending Diaries', value: Math.max(0, totalOrgShifts - totalOrgDiariesSubmitted), displayValue: `${Math.max(0, totalOrgShifts - totalOrgDiariesSubmitted)} Pending`, color: '#6B7280' }
  ];

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
            Company-wide pie charts and granular parameters comparing weekday working hours (HH:MM), leaves taken, and compliance metrics.
          </p>
        </div>

        {/* View Mode Toggle Buttons & Search Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          <div style={{ background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', gap: '2px' }}>
            <button
              onClick={() => setViewMode('PIE_CHARTS')}
              style={{
                background: viewMode === 'PIE_CHARTS' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'PIE_CHARTS' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <PieChartIcon size={14} />
              <span>Pie Charts View</span>
            </button>

            <button
              onClick={() => setViewMode('CARDS')}
              style={{
                background: viewMode === 'CARDS' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'CARDS' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <LayoutGrid size={14} />
              <span>Employee Cards</span>
            </button>

            <button
              onClick={() => setViewMode('BOTH')}
              style={{
                background: viewMode === 'BOTH' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'BOTH' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Show All
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search employee..."
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
                width: '200px'
              }}
            />
          </div>

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
              {totalOrgLeaves} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
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

      {/* SECTION 1: PIE CHARTS VISUALIZATIONS */}
      {(viewMode === 'PIE_CHARTS' || viewMode === 'BOTH') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-0.5rem' }}>
            <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Company-Wide Parameter Pie Charts
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            
            {/* Pie Chart 1: Mon-Fri Weekday Working Hours Share */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h5 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} style={{ color: 'var(--primary)' }} />
                  <span>1. Mon-Fri Working Hours (HH:MM) Share</span>
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Distribution of logged weekday working hours per employee (Excluding Sat & Sun)
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '1.25rem' }}>
                <SvgPieChart
                  data={workingHoursPieData}
                  centerLabel={totalOrgWeekdayHHMM}
                  centerSubtext="Total Hrs"
                />

                <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {workingHoursPieData.map((d, idx) => {
                    const pct = totalOrgWeekdayMs > 0 ? Math.round((d.value / totalOrgWeekdayMs) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.label}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: d.color, fontFamily: 'var(--font-mono)' }}>
                          {d.displayValue} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pie Chart 2: Approved Leaves Taken Distribution */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h5 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: 'var(--accent-amber)' }} />
                  <span>2. Approved Leaves Consumption</span>
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Proportion of total approved leave days taken per employee across company
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '1.25rem' }}>
                <SvgPieChart
                  data={leavesPieData}
                  centerLabel={`${totalOrgLeaves} Days`}
                  centerSubtext="Leaves Consumed"
                />

                <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {leavesPieData.map((d, idx) => {
                    const pct = totalOrgLeaves > 0 ? Math.round((d.value / totalOrgLeaves) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.label}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: d.color }}>
                          {d.displayValue} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pie Chart 3: Punctuality Index Comparison */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h5 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} style={{ color: 'var(--accent-emerald)' }} />
                  <span>3. Company Punctuality Index</span>
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Overall ratio of On-Time shift clock-ins vs Late arrivals across all staff
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '1.25rem' }}>
                <SvgPieChart
                  data={punctualityPieData}
                  centerLabel={`${totalOrgShifts > 0 ? Math.round((totalOrgOnTime / totalOrgShifts) * 100) : 100}%`}
                  centerSubtext="Punctual Rate"
                />

                <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {punctualityPieData.map((d, idx) => {
                    const pct = totalOrgShifts > 0 ? Math.round((d.value / totalOrgShifts) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.label}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: d.color }}>
                          {d.displayValue} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pie Chart 4: WFH vs Office Work Mode Distribution */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h5 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Laptop size={18} style={{ color: 'var(--primary)' }} />
                  <span>4. WFH vs Office Attendance Ratio</span>
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Breakdown of Remote (Work From Home) shifts vs In-Office attendance
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '1.25rem' }}>
                <SvgPieChart
                  data={workModePieData}
                  centerLabel={`${totalOrgShifts > 0 ? Math.round((totalOrgRemote / totalOrgShifts) * 100) : 0}%`}
                  centerSubtext="Remote Ratio"
                />

                <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {workModePieData.map((d, idx) => {
                    const pct = totalOrgShifts > 0 ? Math.round((d.value / totalOrgShifts) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.label}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: d.color }}>
                          {d.displayValue} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pie Chart 5: Work Diary Submission Compliance */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h5 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span>5. Work Diary Submission Compliance</span>
                </h5>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Percentage of shift clock-outs accompanied by completed daily work diaries
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: '1.25rem' }}>
                <SvgPieChart
                  data={diaryPieData}
                  centerLabel={`${totalOrgShifts > 0 ? Math.round((totalOrgDiariesSubmitted / totalOrgShifts) * 100) : 0}%`}
                  centerSubtext="Compliant"
                />

                <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {diaryPieData.map((d, idx) => {
                    const pct = totalOrgShifts > 0 ? Math.round((d.value / totalOrgShifts) * 100) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.label}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: d.color }}>
                          {d.displayValue} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: INDIVIDUAL EMPLOYEE CARDS */}
      {(viewMode === 'CARDS' || viewMode === 'BOTH') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-0.25rem' }}>
            <LayoutGrid size={20} style={{ color: 'var(--accent-purple)' }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Individual Employee Analytics Cards ({filteredAnalytics.length})
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredAnalytics.map(item => (
              <div key={item.employee.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Employee Header Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: item.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
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
                      <Clock size={13} style={{ color: item.color }} />
                      <span>Mon-Fri Work Hours</span>
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: item.color, marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
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
      )}

    </div>
  );
}
