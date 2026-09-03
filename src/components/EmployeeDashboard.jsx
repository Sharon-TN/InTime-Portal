import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import LiveClock from './LiveClock';
import AttendanceLogTable from './AttendanceLogTable';
import ClockInCameraModal from './ClockInCameraModal';
import WorkDiaryModal from './WorkDiaryModal';
import PayslipsModule from './PayslipsModule';
import DocumentsModule from './DocumentsModule';
import LeaveManagementModule from './LeaveManagementModule';
import WorkDiaryReviewModule from './WorkDiaryReviewModule';
import { formatTime12Hour } from '../utils/geoUtils';
import {
  MapPin, LogIn, LogOut, CheckCircle, Clock, Navigation, AlertTriangle, ShieldCheck,
  BookOpen, Calendar, FileText, Folder, Radio, Camera, User, UserMinus, Trash2,
  Mail, Phone, Building, Hash, CreditCard, ShieldAlert, X
} from 'lucide-react';

export default function EmployeeDashboard() {
  const {
    currentUser,
    currentUserTodayRecord,
    records,
    shiftPolicy,
    clockIn,
    clockOut,
    deleteEmployeeAccount,
    logout
  } = useAttendance();

  const [activeTab, setActiveTab] = useState('TERMINAL'); // 'TERMINAL' | 'DIARY' | 'LEAVES' | 'PAYSLIPS' | 'DOCUMENTS' | 'HISTORY'

  const [workMode, setWorkMode] = useState('Remote');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const isClockedIn = !!currentUserTodayRecord;
  const userRecords = records.filter(r => r.employeeId === currentUser?.id);

  // Trigger Clock In camera modal
  const handleStartClockInFlow = () => {
    setError('');
    setShowCameraModal(true);
  };

  // Confirm Clock In from Camera modal with optional custom address override
  const handleConfirmClockIn = async (capturedPhoto, coords, customAddress) => {
    setShowCameraModal(false);
    setLoading(true);
    try {
      const res = await clockIn(workMode, coords, capturedPhoto, customAddress);
      if (!res.success) {
        setError(res.error || 'Failed to clock in');
      }
    } catch (err) {
      setError('An unexpected error occurred during clock in.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Clock Out Work Diary modal
  const handleStartClockOutFlow = () => {
    setError('');
    setShowDiaryModal(true);
  };

  // Confirm Clock Out from Work Diary modal
  const handleConfirmClockOut = async (workDiaryData) => {
    setShowDiaryModal(false);
    setLoading(true);
    try {
      const res = await clockOut(workDiaryData);
      if (!res.success) {
        setError(res.error || 'Failed to clock out');
      } else {
        // Automatically clock out from session & sign out from account for that day
        logout();
      }
    } catch (err) {
      setError('An unexpected error occurred during clock out.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Employee Self-Account Deletion
  const handleConfirmDeleteAccount = async () => {
    if (!currentUser) return;
    setShowDeleteConfirmModal(false);
    setShowProfileModal(false);
    setLoading(true);
    try {
      await deleteEmployeeAccount(currentUser.id || currentUser.employeeId || currentUser.email);
      logout();
    } catch (err) {
      console.error("Account deletion failed:", err);
      setError("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Employee Welcome & Tab Navigation Header */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', marginBottom: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Clickable Profile Avatar */}
            <div
              onClick={() => setShowProfileModal(true)}
              style={{ position: 'relative', cursor: 'pointer' }}
              title="Click to view full employee profile & details"
            >
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                style={{ width: '64px', height: '64px', borderRadius: '9999px', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: 'var(--shadow-glow)' }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '9999px',
                  background: isClockedIn ? 'var(--accent-emerald)' : 'var(--text-subtle)',
                  border: '2px solid var(--bg-card)'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2
                  onClick={() => setShowProfileModal(true)}
                  style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', cursor: 'pointer' }}
                  title="Click to view employee profile"
                >
                  Welcome back, {currentUser?.name}
                </h2>
                <span className={`status-badge ${isClockedIn ? 'status-in' : 'status-out'}`}>
                  {isClockedIn ? 'ACTIVE SHIFT' : 'OFF DUTY'}
                </span>

                {/* Profile View Badge Button */}
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <User size={12} />
                  <span>My Profile</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>{currentUser?.role || 'Software Engineer'}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} />
                  {currentUser?.defaultCity}
                </span>
                <span>•</span>
                <span>Shift: {formatTime12Hour(shiftPolicy.startTime)} - {formatTime12Hour(shiftPolicy.endTime)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <LiveClock />
          </div>

        </div>

        {/* Dashboard Navigation Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          
          <button
            className={`btn-secondary ${activeTab === 'TERMINAL' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('TERMINAL')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'TERMINAL' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'TERMINAL' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'TERMINAL' ? 'var(--primary)' : 'var(--border-color)'
            }}
          >
            <Radio size={16} />
            <span>Shift Terminal</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'DIARY' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('DIARY')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'DIARY' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'DIARY' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'DIARY' ? 'var(--accent-cyan)' : 'var(--border-color)'
            }}
          >
            <BookOpen size={16} />
            <span>Work Diary</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'LEAVES' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('LEAVES')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'LEAVES' ? 'var(--accent-amber)' : 'transparent',
              color: activeTab === 'LEAVES' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'LEAVES' ? 'var(--accent-amber)' : 'var(--border-color)'
            }}
          >
            <Calendar size={16} />
            <span>Leaves & Calendar</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'PAYSLIPS' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('PAYSLIPS')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'PAYSLIPS' ? 'var(--accent-emerald)' : 'transparent',
              color: activeTab === 'PAYSLIPS' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'PAYSLIPS' ? 'var(--accent-emerald)' : 'var(--border-color)'
            }}
          >
            <FileText size={16} />
            <span>Payslips</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'DOCUMENTS' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('DOCUMENTS')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'DOCUMENTS' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'DOCUMENTS' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'DOCUMENTS' ? 'var(--accent-purple)' : 'var(--border-color)'
            }}
          >
            <Folder size={16} />
            <span>Documents Vault</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'HISTORY' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'HISTORY' ? 'var(--text-main)' : 'transparent',
              color: activeTab === 'HISTORY' ? 'var(--bg-main)' : 'var(--text-main)',
              borderColor: activeTab === 'HISTORY' ? 'var(--text-main)' : 'var(--border-color)'
            }}
          >
            <Clock size={16} />
            <span>Attendance History</span>
          </button>

        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: SHIFT TERMINAL */}
      {activeTab === 'TERMINAL' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
          
          {/* Shift Control Action Card */}
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Clock-In Terminal
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Geotag & Camera Secured
                </span>
              </div>

              {!isClockedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Select Work Mode Location
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setWorkMode('Remote')}
                        className={`btn-secondary ${workMode === 'Remote' ? 'active-tab' : ''}`}
                        style={{
                          padding: '0.75rem',
                          justifyContent: 'center',
                          background: workMode === 'Remote' ? 'var(--primary)' : 'var(--bg-input)',
                          color: workMode === 'Remote' ? '#FFFFFF' : 'var(--text-main)',
                          borderColor: workMode === 'Remote' ? 'var(--primary)' : 'var(--border-color)'
                        }}
                      >
                        Remote (Home)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkMode('On-Site')}
                        className={`btn-secondary ${workMode === 'On-Site' ? 'active-tab' : ''}`}
                        style={{
                          padding: '0.75rem',
                          justifyContent: 'center',
                          background: workMode === 'On-Site' ? 'var(--primary)' : 'var(--bg-input)',
                          color: workMode === 'On-Site' ? '#FFFFFF' : 'var(--text-main)',
                          borderColor: workMode === 'On-Site' ? 'var(--primary)' : 'var(--border-color)'
                        }}
                      >
                        On-Site (Office)
                      </button>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>Check-in Protocol:</div>
                    1. Live camera selfie snapshot captured.<br/>
                    2. GPS coordinates & street address bound.<br/>
                    3. Lateness status evaluated against {formatTime12Hour(shiftPolicy.startTime)} shift.
                  </div>

                  <button
                    onClick={handleStartClockInFlow}
                    className="btn-primary"
                    disabled={loading}
                    style={{ padding: '0.9rem', fontSize: '1rem', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', width: '100%', justifyContent: 'center' }}
                  >
                    <Camera size={20} />
                    <span>{loading ? 'Clocking In...' : 'Verify Camera & Clock In'}</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-emerald)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>Current Active Shift</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {currentUserTodayRecord?.clockInTime}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} style={{ color: 'var(--accent-rose)' }} />
                      {currentUserTodayRecord?.locationName}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>Mandatory Clock-Out Protocol:</div>
                    You will be prompted to submit your <strong>Daily Work Diary</strong> (tasks completed & tomorrow objectives) before shift checkout.
                  </div>

                  <button
                    onClick={handleStartClockOutFlow}
                    className="btn-danger"
                    disabled={loading}
                    style={{ padding: '0.9rem', fontSize: '1rem', width: '100%', justifyContent: 'center' }}
                  >
                    <LogOut size={20} />
                    <span>{loading ? 'Processing...' : 'Submit Work Diary & Clock Out'}</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              <span>Location Geotag Status</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>● GPS Ready</span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: WORK DIARIES */}
      {activeTab === 'DIARY' && <WorkDiaryReviewModule />}

      {/* TAB 3: LEAVES & CALENDAR */}
      {activeTab === 'LEAVES' && <LeaveManagementModule />}

      {/* TAB 4: PAYSLIPS */}
      {activeTab === 'PAYSLIPS' && <PayslipsModule />}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && <DocumentsModule />}

      {/* TAB 6: ATTENDANCE HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Your Personal Attendance Records
          </h3>
          <AttendanceLogTable records={userRecords} isAdmin={false} />
        </div>
      )}

      {/* Modals */}
      {showCameraModal && (
        <ClockInCameraModal
          workMode={workMode}
          onConfirm={handleConfirmClockIn}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {showDiaryModal && (
        <WorkDiaryModal
          onConfirm={handleConfirmClockOut}
          onClose={() => setShowDiaryModal(false)}
        />
      )}

      {/* MODAL 3: EMPLOYEE PROFILE DETAILS MODAL */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Profile Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {currentUser?.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {currentUser?.role || 'Software Engineer'} • {currentUser?.department || 'Engineering'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Profile Information List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={13} style={{ color: 'var(--primary)' }} /> Email Address
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                    {currentUser?.email || currentUser?.companyEmail || 'N/A'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={13} style={{ color: 'var(--primary)' }} /> Contact Phone
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {currentUser?.companyPhoneNo || currentUser?.phone || 'Not Provided'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={13} style={{ color: 'var(--primary)' }} /> Department / Location
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {currentUser?.department || 'Engineering'} ({currentUser?.defaultCity || 'Bengaluru'})
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} style={{ color: 'var(--primary)' }} /> Shift Schedule
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {formatTime12Hour(shiftPolicy.startTime)} - {formatTime12Hour(shiftPolicy.endTime)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Hash size={13} style={{ color: 'var(--primary)' }} /> Aadhaar Card No.
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {currentUser?.aadhar || 'Not Provided'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CreditCard size={13} style={{ color: 'var(--primary)' }} /> Bank Account No.
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {currentUser?.bankAccount || currentUser?.bankAccountNo || 'Not Provided'}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Hash size={13} style={{ color: 'var(--primary)' }} /> UAN Number (Optional)
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {currentUser?.uan ? currentUser.uan : 'Not Provided'}
                </div>
              </div>

              {/* Danger Zone: Employee Account Deletion Button */}
              <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-rose)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)', fontWeight: 800, fontSize: '0.95rem' }}>
                  <ShieldAlert size={18} />
                  <span>Account Management & Danger Zone</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                  If you leave the company or wish to remove your account, clicking Delete Account will permanently purge your profile, attendance history, payslips, and work diaries.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(true)}
                  className="btn-danger"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--accent-rose)',
                    borderColor: 'var(--accent-rose)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Account Permanently</span>
                </button>
              </div>

            </div>

            {/* Profile Modal Footer */}
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.5rem' }}
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: SELF-ACCOUNT DELETION CONFIRMATION DIALOG */}
      {showDeleteConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: 'var(--accent-rose)', marginBottom: '0.85rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Confirm Account Deletion?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.6rem 0 1.5rem 0', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete your employee account (<strong style={{ color: 'var(--text-main)' }}>{currentUser?.name}</strong>)? All associated attendance records, payslips, leaves, and work diaries will be removed. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="btn-danger"
                style={{ flex: 1, background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', color: '#FFFFFF', fontWeight: 700 }}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
