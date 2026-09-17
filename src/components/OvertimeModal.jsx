import React, { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle2, AlertCircle, ArrowRight, X, Sparkles } from 'lucide-react';

export default function OvertimeModal({
  isOpen,
  onClose,
  onConfirmOvertime,
  onDeclineOvertime,
  initialRange = '',
  promptSlot = 'MANUAL' // '530' | '545' | 'MANUAL'
}) {
  const [willWorkOvertime, setWillWorkOvertime] = useState(true);
  const [overtimeRange, setOvertimeRange] = useState(initialRange || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOvertimeRange(initialRange || '');
      setWillWorkOvertime(true);
      setErrorMsg('');
    }
  }, [isOpen, initialRange]);

  if (!isOpen) return null;

  // Preset suggestions for quick single-click auto-fill (while keeping the text box 100% editable)
  const quickSuggestions = [
    '7PM to 9PM',
    '8PM to 9PM',
    '6PM to 8PM',
    '6:30PM to 8:30PM',
    '8PM to 10PM'
  ];

  const handleConfirm = async (e) => {
    e?.preventDefault();
    if (willWorkOvertime) {
      const trimmed = overtimeRange.trim();
      if (!trimmed) {
        setErrorMsg('Please enter your planned overtime time range (for ex: 8PM to 9PM).');
        return;
      }
      setIsSubmitting(true);
      try {
        await onConfirmOvertime(trimmed);
        onClose();
      } catch (err) {
        setErrorMsg(err?.message || 'Failed to save overtime declaration.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      onDeclineOvertime();
      onClose();
    }
  };

  const getSlotTitle = () => {
    if (promptSlot === '530') return '5:30 PM Shift Notice';
    if (promptSlot === '545') return '5:45 PM Final Shift Notice';
    return 'Shift Extension';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '2.2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Dismiss"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              flexShrink: 0
            }}
          >
            <Zap size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Shift Overtime Notice
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#f59e0b',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}
              >
                {getSlotTitle()}
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Standard shift ends at <strong>06:00 PM IST</strong>.
            </p>
          </div>
        </div>

        {/* Big prominent Question heading */}
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.9rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}>
          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            letterSpacing: '-0.01em'
          }}>
            <Zap size={22} style={{ color: '#f59e0b' }} />
            Do you want to work overtime?
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
            Choose whether to extend your active session past 06:00 PM today.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid var(--accent-rose)',
              color: 'var(--accent-rose)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Choice Selection: YES vs NO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.4rem' }}>
          
          {/* Option: YES */}
          <div
            onClick={() => {
              setWillWorkOvertime(true);
              setErrorMsg('');
            }}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: willWorkOvertime ? '2px solid #f59e0b' : '1px solid var(--border-color)',
              background: willWorkOvertime ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  Yes, Overtime
                </span>
              </div>
              {willWorkOvertime && <CheckCircle2 size={16} style={{ color: '#f59e0b' }} />}
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Session remains active past 6:00 PM
            </p>
          </div>

          {/* Option: NO */}
          <div
            onClick={() => {
              setWillWorkOvertime(false);
              setErrorMsg('');
            }}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: !willWorkOvertime ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              background: !willWorkOvertime ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  No, Ending at 6 PM
                </span>
              </div>
              {!willWorkOvertime && <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />}
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Submit work diary & clock out at 6:00 PM
            </p>
          </div>

        </div>

        {/* Dynamic Section based on Yes / No */}
        {willWorkOvertime ? (
          <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.45rem'
                }}
              >
                Planned Overtime Time Range *
              </label>

              {/* Manual Editable Text Input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={overtimeRange}
                  onChange={(e) => {
                    setOvertimeRange(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="e.g. 8PM to 9PM"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '2px solid rgba(245, 158, 11, 0.5)',
                    color: 'var(--text-main)',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              {/* Helper text explaining manually entered range */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', lineHeight: 1.4 }}>
                💡 Manually enter your expected overtime hours (e.g. <strong>8PM to 9PM</strong> or <strong>6:30PM to 8:30PM</strong>). Your session will remain logged in from that time while you continue to work. Once you finish, you will fill the Daily Work Diary and clock out.
              </p>

              {/* Quick Fill Suggestion Chips */}
              <div style={{ marginTop: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Quick Fill Suggestions (or type your own above):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {quickSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setOvertimeRange(sug);
                        if (errorMsg) setErrorMsg('');
                      }}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '9999px',
                        background: overtimeRange === sug ? '#f59e0b' : 'var(--bg-input)',
                        color: overtimeRange === sug ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !overtimeRange.trim()}
                style={{
                  flex: 1.6,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  borderColor: '#f59e0b',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 700
                }}
              >
                <span>{isSubmitting ? 'Saving Overtime...' : 'Confirm & Continue Work'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '1.1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <span>Standard Shift Ending at 06:00 PM IST</span>
              </div>
              You have chosen not to work overtime today. Please complete your tasks, submit your <strong>Daily Work Diary</strong>, and Clock Out when your shift ends.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeclineOvertime();
                  onClose();
                }}
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.75rem', justifyContent: 'center' }}
              >
                Acknowledge (Standard Shift)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
