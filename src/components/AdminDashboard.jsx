import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import LiveClock from './LiveClock';
import LiveMap from './LiveMap';
import AttendanceLogTable from './AttendanceLogTable';
import ShiftSettingsModal from './ShiftSettingsModal';
import ShiftPolicyModal from './ShiftPolicyModal';
import PayslipsModule from './PayslipsModule';
import DocumentsModule from './DocumentsModule';
import LeaveManagementModule from './LeaveManagementModule';
import WorkDiaryReviewModule from './WorkDiaryReviewModule';
import EmployeeAnalyticsModule from './EmployeeAnalyticsModule';
import { formatTime12Hour } from '../utils/geoUtils';
import {
  Users, CheckCircle, Clock, AlertCircle, Settings, Trash2, Sliders, MapPin,
  BookOpen, Calendar, FileText, Folder, Radio, ShieldCheck, BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    employees,
    records,
    shiftPolicy,
    setShiftPolicy,
    clearAllData
  } = useAttendance();

  const [activeTab, setActiveTab] = useState('WORKFORCE'); // 'WORKFORCE' | 'ANALYTICS' | 'LEAVES' | 'PAYSLIPS' | 'DOCUMENTS' | 'DIARIES'
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Metrics
  const totalEmployees = employees.length;
  const activeClockedIn = records.filter(r => r.status === 'CLOCK_IN').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === todayStr);
  const lateTodayCount = todayRecords.filter(r => r.latenessStatus === 'LATE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Admin Welcome & Header Navigation */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', marginBottom: '1.5rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Executive HR & Operations Portal
              </h2>
              <span className="status-badge status-in" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)' }}>
                ADMIN CONTROL
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
              Real-time Workforce Tracking, Employee Analytics, Payslip Disbursal & Work Diary Audits
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowPolicyModal(true)}
              style={{ fontSize: '0.85rem' }}
            >
              <Sliders size={16} />
              <span>Shift Policy Config</span>
            </button>

            <button
              className="btn-danger"
              onClick={() => setShowClearConfirm(true)}
              style={{ fontSize: '0.85rem' }}
            >
              <Trash2 size={16} />
              <span>Clear Logs</span>
            </button>

            <LiveClock />
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          
          <button
            className={`btn-secondary ${activeTab === 'WORKFORCE' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('WORKFORCE')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'WORKFORCE' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'WORKFORCE' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'WORKFORCE' ? 'var(--primary)' : 'var(--border-color)'
            }}
          >
            <Users size={16} />
            <span>Workforce Logs & Map</span>
          </button>

          {/* NEW TAB: Employee Analytics Dashboard */}
          <button
            className={`btn-secondary ${activeTab === 'ANALYTICS' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('ANALYTICS')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'ANALYTICS' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'ANALYTICS' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'ANALYTICS' ? 'var(--accent-purple)' : 'var(--border-color)'
            }}
          >
            <BarChart3 size={16} />
            <span>Employee Analytics Dashboard</span>
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
            <span>Leave Requests & Calendar</span>
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
            <span>Issue Payslips</span>
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
            <span>Document Audit Vault</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'DIARIES' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('DIARIES')}
            style={{
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: activeTab === 'DIARIES' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'DIARIES' ? '#FFFFFF' : 'var(--text-main)',
              borderColor: activeTab === 'DIARIES' ? 'var(--accent-cyan)' : 'var(--border-color)'
            }}
          >
            <BookOpen size={16} />
            <span>Work Diary Reviews</span>
          </button>

        </div>
      </div>

      {/* Top Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Staff</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalEmployees}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active On Duty</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{activeClockedIn}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late Arrivals</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{lateTodayCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Window</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formatTime12Hour(shiftPolicy.startTime)} - {formatTime12Hour(shiftPolicy.endTime)}
            </div>
          </div>
        </div>

      </div>

      {/* TAB 1: WORKFORCE LOGS & MAP (STACKED VERTICALLY) */}
      {activeTab === 'WORKFORCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              Live Staff Attendance Stream
            </h3>
            <AttendanceLogTable records={records} isAdmin={true} />
          </div>

          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              Live Multi-Employee GPS Map
            </h3>
            <LiveMap activeRecord={null} records={records} defaultCoords={{ lat: 12.9716, lng: 77.5946 }} />
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEE ANALYTICS DASHBOARD */}
      {activeTab === 'ANALYTICS' && <EmployeeAnalyticsModule />}

      {/* TAB 3: LEAVE REQUESTS & CALENDAR */}
      {activeTab === 'LEAVES' && <LeaveManagementModule />}

      {/* TAB 4: PAYSLIPS DISBURSAL */}
      {activeTab === 'PAYSLIPS' && <PayslipsModule />}

      {/* TAB 5: DOCUMENT AUDIT VAULT */}
      {activeTab === 'DOCUMENTS' && <DocumentsModule />}

      {/* TAB 6: WORK DIARY REVIEWS */}
      {activeTab === 'DIARIES' && <WorkDiaryReviewModule />}

      {/* Modals */}
      {showPolicyModal && (
        <ShiftPolicyModal
          currentPolicy={shiftPolicy}
          onSave={(newPol) => {
            setShiftPolicy(newPol);
            setShowPolicyModal(false);
          }}
          onClose={() => setShowPolicyModal(false)}
        />
      )}

      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <Trash2 size={42} style={{ color: 'var(--accent-rose)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Clear All System Logs?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0 1.5rem 0' }}>
              This will erase all registered employee profiles, logs, payslips, and leave records.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                }}
                className="btn-danger"
                style={{ flex: 1 }}
              >
                Yes, Erase All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
