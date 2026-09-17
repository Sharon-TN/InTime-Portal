import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Target, FileText, LogOut, X } from 'lucide-react';

export default function WorkDiaryModal({
  onConfirm,
  onClose,
  isEarly = false,
  isStandalone = false,
  initialData = null,
  titleOverride = null,
  subtitleOverride = null
}) {
  const [completedTasks, setCompletedTasks] = useState(initialData?.completedTasks || '');
  const [keyAccomplishments, setKeyAccomplishments] = useState(initialData?.keyAccomplishments || '');
  const [tomorrowObjectives, setTomorrowObjectives] = useState(initialData?.tomorrowObjectives || '');
  const [shiftNotes, setShiftNotes] = useState(initialData?.shiftNotes || '');
  const [errorMsg, setErrorMsg] = useState('');

  // Update fields if initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.completedTasks) setCompletedTasks(initialData.completedTasks);
      if (initialData.keyAccomplishments) setKeyAccomplishments(initialData.keyAccomplishments);
      if (initialData.tomorrowObjectives) setTomorrowObjectives(initialData.tomorrowObjectives);
      if (initialData.shiftNotes) setShiftNotes(initialData.shiftNotes);
    }
  }, [initialData]);

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
              <BookOpen size={22} style={{ color: isEarly ? 'var(--accent-rose)' : isStandalone ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }} />
              <span>
                {titleOverride || (isEarly ? 'Early Clock-Out & Daily Work Diary' : isStandalone ? 'Daily Work Diary & Shift Summary' : 'Daily Work Diary & Shift Summary')}
              </span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {subtitleOverride || (isEarly
                ? 'Recording early departure. Please update your action items and accomplishments before logging out.'
                : isStandalone
                ? 'Record your daily completed tasks, accomplishments, and plans. Your shift session remains active.'
                : 'Please update your action items and accomplishments before clocking out.')}
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
              className={isStandalone ? "btn-primary" : "btn-danger"}
              style={{
                flex: 1.5,
                padding: '0.75rem',
                background: isStandalone
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : isEarly
                  ? 'var(--accent-rose)'
                  : undefined,
                borderColor: isStandalone
                  ? '#10b981'
                  : isEarly
                  ? 'var(--accent-rose)'
                  : undefined,
                color: '#ffffff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isStandalone ? (
                <>
                  <CheckCircle size={18} />
                  <span>Save & Submit Work Diary</span>
                </>
              ) : isEarly ? (
                <>
                  <LogOut size={18} />
                  <span>Submit Diary & Early Log Out</span>
                </>
              ) : (
                <>
                  <LogOut size={18} />
                  <span>Submit Diary & Clock Out</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
