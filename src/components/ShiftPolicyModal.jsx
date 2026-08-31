import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { X, Save, Clock, ShieldCheck } from 'lucide-react';

// Custom 12-Hour AM/PM Time Picker Component
const TimePicker12 = ({ value, onChange, label, accentColor = 'var(--primary)' }) => {
  const parse24to12 = (val24) => {
    if (!val24) return { hour: '09', minute: '00', period: 'AM' };
    const [hStr, mStr] = val24.split(':');
    let h = parseInt(hStr || '9', 10);
    const minute = mStr ? mStr.padStart(2, '0') : '00';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hour = h < 10 ? `0${h}` : `${h}`;
    return { hour, minute, period };
  };

  const { hour, minute, period } = parse24to12(value);

  const updateVal = (newH, newM, newP) => {
    let h = parseInt(newH, 10);
    if (newP === 'PM' && h < 12) h += 12;
    if (newP === 'AM' && h === 12) h = 0;
    const h24 = h < 10 ? `0${h}` : `${h}`;
    onChange(`${h24}:${newM}`);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    return num < 10 ? `0${num}` : `${num}`;
  });

  const minutesList = Array.from({ length: 12 }, (_, i) => {
    const num = i * 5;
    return num < 10 ? `0${num}` : `${num}`;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {label}
        </label>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: accentColor, fontFamily: 'var(--font-mono)' }}>
          {hour}:{minute} {period}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-color)',
        padding: '0.4rem 0.6rem',
        borderRadius: 'var(--radius-sm)'
      }}>
        <Clock size={18} style={{ color: 'var(--text-subtle)', marginLeft: '4px', flexShrink: 0 }} />

        {/* 12-Hour Dropdown Picker (01-12) */}
        <select
          value={hour}
          onChange={e => updateVal(e.target.value, minute, period)}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.6rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {hoursList.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>:</span>

        {/* Minute Dropdown Picker (00-55) */}
        <select
          value={minute}
          onChange={e => updateVal(hour, e.target.value, period)}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.6rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {minutesList.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* AM / PM Segmented Toggle Selector */}
        <div style={{ display: 'flex', marginLeft: 'auto', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => updateVal(hour, minute, 'AM')}
            style={{
              background: period === 'AM' ? accentColor : 'transparent',
              color: period === 'AM' ? '#FFFFFF' : 'var(--text-muted)',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => updateVal(hour, minute, 'PM')}
            style={{
              background: period === 'PM' ? accentColor : 'transparent',
              color: period === 'PM' ? '#FFFFFF' : 'var(--text-muted)',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ShiftPolicyModal({ onClose }) {
  const { shiftPolicy, setShiftPolicy } = useAttendance();

  const [startTime, setStartTime] = useState(shiftPolicy.startTime || '09:00');
  const [graceMinutes, setGraceMinutes] = useState(shiftPolicy.graceMinutes || 15);
  const [endTime, setEndTime] = useState(shiftPolicy.endTime || '18:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    setShiftPolicy({
      startTime,
      graceMinutes: Number(graceMinutes),
      endTime,
      workHoursTarget: 8
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={22} style={{ color: 'var(--accent-purple)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Shift Policy Settings</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Shift Start Time Picker */}
          <TimePicker12
            label="Shift Start Time"
            value={startTime}
            onChange={setStartTime}
            accentColor="var(--primary)"
          />

          {/* Grace Period Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Grace Period (Minutes before marked Late)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={graceMinutes}
              onChange={e => setGraceMinutes(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none' }}
              required
            />
          </div>

          {/* Shift End Time Picker */}
          <TimePicker12
            label="Official Shift End Time"
            value={endTime}
            onChange={setEndTime}
            accentColor="var(--accent-purple)"
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
            >
              <Save size={16} />
              <span>Save Policy</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
