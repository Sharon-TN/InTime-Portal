import React, { useState } from 'react';
import { BookOpen, CheckCircle, Target, FileText, LogOut, X } from 'lucide-react';

export default function WorkDiaryModal({ onConfirm, onClose }) {
  const [completedTasks, setCompletedTasks] = useState('');
  const [keyAccomplishments, setKeyAccomplishments] = useState('');
  const [tomorrowObjectives, setTomorrowObjectives] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!completedTasks.trim()) {
      setErrorMsg('Please detail at least one completed task or action item for today.');
      return;
    }

    onConfirm({
      completedTasks,
      keyAccomplishments,
      tomorrowObjectives,
      shiftNotes
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={22} style={{ color: 'var(--accent-cyan)' }} />
              <span>Daily Work Diary & Shift Summary</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Please update your action items and accomplishments before clocking out.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Completed Tasks */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              <CheckCircle size={16} style={{ color: 'var(--accent-emerald)' }} />
              <span>Completed Action Items / Tasks Today *</span>
            </label>
            <textarea
              value={completedTasks}
              onChange={e => setCompletedTasks(e.target.value)}
              placeholder="E.g., Completed API integration, resolved bug #104, code review for PR..."
              rows={3}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
              required
            />
          </div>

          {/* Key Accomplishments */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              <Target size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>Key Accomplishments & Milestones</span>
            </label>
            <input
              type="text"
              value={keyAccomplishments}
              onChange={e => setKeyAccomplishments(e.target.value)}
              placeholder="E.g., Delivered v1.2 release, passed client QA testing..."
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          {/* Objectives for Tomorrow */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              <span>Tomorrow's Planned Objectives</span>
            </label>
            <input
              type="text"
              value={tomorrowObjectives}
              onChange={e => setTomorrowObjectives(e.target.value)}
              placeholder="E.g., Start database migration sprint, client sync at 10 AM..."
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              style={{ flex: 1.5, padding: '0.75rem' }}
            >
              <LogOut size={18} />
              <span>Submit Diary & Clock Out</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
