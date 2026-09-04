import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { formatDateDDMMYYYY } from '../utils/geoUtils';
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Check, X, AlertCircle } from 'lucide-react';

export default function LeaveManagementModule() {
  const { currentUser, leaves, applyLeave, updateLeaveStatus } = useAttendance();

  const isAdmin = currentUser?.roleType === 'ADMIN';

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Filter leaves: Admin sees all; Employee sees only their own
  const visibleLeaves = isAdmin
    ? leaves
    : leaves.filter(l => l.employeeId === currentUser.id);

  // Calendar grid calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const handleDateClick = (dayNumber) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    setSelectedCalendarDate(dateStr);
    setStartDate(dateStr);
    setEndDate(dateStr);
    if (!isAdmin) {
      setShowApplyModal(true);
    }
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    applyLeave({
      type: leaveType,
      startDate,
      endDate,
      days: diffDays,
      reason
    });

    setReason('');
    setShowApplyModal(false);
  };

  // Helper to check if a calendar date has an active leave
  const getLeaveForDate = (dayNumber) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return visibleLeaves.find(l => {
      return dateStr >= l.startDate && dateStr <= l.endDate;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} style={{ color: 'var(--primary)' }} />
            <span>Interactive Leave Calendar & Roster</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {isAdmin ? "Review leave roster and approve applications" : "Click any date on the calendar grid below to apply for leave"}
          </p>
        </div>

        {!isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus size={18} />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Admin Pending Leave Indicator Banner */}
      {isAdmin && visibleLeaves.filter(l => l.status === 'PENDING').length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid var(--accent-amber)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: 'var(--accent-amber)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Action Required: {visibleLeaves.filter(l => l.status === 'PENDING').length} employee leave application(s) pending approval below.
            </span>
          </div>
        </div>
      )}

      {/* Interactive Month Calendar Grid */}
      <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{monthName} {year}</span>
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* Calendar Dates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {/* Empty cells before 1st of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} style={{ minHeight: '64px', background: 'transparent' }} />
          ))}

          {/* Days 1 to N */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const leave = getLeaveForDate(dayNum);
            
            return (
              <div
                key={dayNum}
                onClick={() => handleDateClick(dayNum)}
                style={{
                  minHeight: '64px',
                  background: leave ? (leave.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)') : 'var(--bg-input)',
                  border: leave ? (leave.status === 'APPROVED' ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-amber)') : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {dayNum}
                </div>
                
                {leave && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: leave.status === 'APPROVED' ? 'var(--accent-emerald)' : 'var(--accent-amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {leave.type.split(' ')[0]} ({leave.status})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
          Submitted Leave Applications
        </h4>

        {visibleLeaves.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No leave applications recorded. Click any date on the calendar above to apply!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>Employee</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem' }}>Days</th>
                  <th style={{ padding: '0.75rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  {isAdmin && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visibleLeaves.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.85rem', fontWeight: 700 }}>{l.employeeName}</td>
                    <td style={{ padding: '0.85rem' }}>
                      <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                        {l.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                      {formatDateDDMMYYYY(l.startDate)} to {formatDateDDMMYYYY(l.endDate)}
                    </td>
                    <td style={{ padding: '0.85rem', fontWeight: 700 }}>{l.days} Day(s)</td>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '220px' }}>{l.reason}</td>
                    <td style={{ padding: '0.85rem' }}>
                      {l.status === 'APPROVED' && (
                        <span style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.12)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={13} /> APPROVED
                        </span>
                      )}
                      {l.status === 'REJECTED' && (
                        <span style={{ color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.12)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={13} /> REJECTED
                        </span>
                      )}
                      {l.status === 'PENDING' && (
                        <span style={{ color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.12)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> PENDING
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                        {l.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => updateLeaveStatus(l.id, 'APPROVED')}
                              style={{ background: 'var(--accent-emerald)', border: 'none', color: '#fff', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => updateLeaveStatus(l.id, 'REJECTED')}
                              style={{ background: 'var(--accent-rose)', border: 'none', color: '#fff', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              Apply for Leave
            </h3>

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Leave Type</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned / Paid Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Reason for Leave *</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Detail your leave reason..."
                  rows={3}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', outline: 'none', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
