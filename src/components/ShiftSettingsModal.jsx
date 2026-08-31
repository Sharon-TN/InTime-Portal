import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Settings, X, Save, Clock, Check } from 'lucide-react';

export default function ShiftSettingsModal({ isOpen, onClose }) {
  const { shiftPolicy, setShiftPolicy } = useAttendance();

  const [form, setForm] = useState({
    startTime: shiftPolicy.startTime || '09:00',
    graceMinutes: shiftPolicy.graceMinutes || 15,
    endTime: shiftPolicy.endTime || '18:00',
    workHoursTarget: shiftPolicy.workHoursTarget || 8
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setShiftPolicy({
      startTime: form.startTime,
      graceMinutes: Number(form.graceMinutes),
      endTime: form.endTime,
      workHoursTarget: Number(form.workHoursTarget)
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-logo" style={{ width: '34px', height: '34px' }}>
              <Settings size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Shift & Policy Settings</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Official Work Start Time
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Grace Period (Minutes before marking Late)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={form.graceMinutes}
              onChange={e => setForm({ ...form, graceMinutes: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem', display: 'block' }}>
              Clock-ins after {form.startTime} + {form.graceMinutes}m will be flagged as <strong>LATE</strong>.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Official End Time
            </label>
            <input
              type="time"
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {savedSuccess ? <Check size={18} /> : <Save size={18} />}
              <span>{savedSuccess ? "Saved!" : "Save Policy"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
