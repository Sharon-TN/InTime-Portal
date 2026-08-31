import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { formatDateDDMMYYYY } from '../utils/geoUtils';
import { BookOpen, CheckCircle, Target, FileText, User, Calendar, Download } from 'lucide-react';

export default function WorkDiaryReviewModule() {
  const { workDiaries, currentUser } = useAttendance();
  const isAdmin = currentUser?.roleType === 'ADMIN';

  // Filter diaries: Admin sees all; Employee sees only their own
  const visibleDiaries = isAdmin
    ? workDiaries
    : workDiaries.filter(d => d.employeeId === currentUser.id);

  // Helper to sanitize multi-line text into clean single-line string for CSV
  const cleanCellText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/[\r\n]+/g, ' ')
      .replace(/"/g, '""')
      .trim();
  };

  // 100% Reliable Excel CSV Export with Text-Formatted Dates & Safe Async Download
  const exportToExcelCSV = () => {
    if (visibleDiaries.length === 0) {
      alert('No work diary entries available to export.');
      return;
    }

    try {
      const headers = [
        'Employee Name',
        'Date',
        'Submission Time',
        'Completed Tasks & Action Items',
        'Key Accomplishments',
        'Tomorrow Objectives'
      ];

      const rows = visibleDiaries.map(d => {
        const dateFormatted = formatDateDDMMYYYY(d.date) || d.date || '';
        return [
          `"${cleanCellText(d.employeeName)}"`,
          `="${dateFormatted}"`, // Excel formula string syntax forcing literal text rendering to prevent ########
          `"${cleanCellText(d.submittedAt)}"`,
          `"${cleanCellText(d.completedTasks)}"`,
          `"${cleanCellText(d.keyAccomplishments)}"`,
          `"${cleanCellText(d.tomorrowObjectives)}"`
        ];
      });

      // Include UTF-8 Byte Order Mark (\uFEFF) for Excel text encoding recognition
      const csvString = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const fileName = `InTime_Work_Diaries_${new Date().toISOString().split('T')[0]}.csv`;

      // Trigger browser file download safely
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Delay revocation so browser finishes writing file without network errors
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (err) {
      console.error("Export error:", err);
      alert("Unable to generate Excel file: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={24} style={{ color: 'var(--accent-cyan)' }} />
            <span>Daily Work Diaries & Activity History</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {isAdmin ? "Audit action items, accomplishments, and tomorrow objectives submitted by employees prior to clocking out" : "Review your daily shift work diaries and action items history"}
          </p>
        </div>

        {/* Excel Export Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={exportToExcelCSV}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.08)', cursor: 'pointer' }}
            title="Download clean CSV file directly readable in Microsoft Excel"
          >
            <Download size={16} />
            <span>Export to Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Work Diaries List */}
      {visibleDiaries.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ color: 'var(--text-subtle)', marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Work Diaries Submitted Yet</h4>
          <p style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>
            Work diaries submitted during shift clock-out will automatically accumulate here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {visibleDiaries.map((diary) => (
            <div key={diary.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              
              {/* Diary Entry Header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <User size={18} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{diary.employeeName}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {formatDateDDMMYYYY(diary.date)}
                  </span>
                  <span style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.75rem' }}>
                    Submitted at {diary.submittedAt}
                  </span>
                </div>
              </div>

              {/* Diary Content Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                
                {/* Completed Tasks */}
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    <CheckCircle size={15} />
                    <span>Completed Tasks & Action Items</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {diary.completedTasks || 'None specified'}
                  </div>
                </div>

                {/* Key Accomplishments */}
                {diary.keyAccomplishments && (
                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      <Target size={15} />
                      <span>Key Accomplishments</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {diary.keyAccomplishments}
                    </div>
                  </div>
                )}

                {/* Tomorrow Objectives */}
                {diary.tomorrowObjectives && (
                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      <FileText size={15} />
                      <span>Tomorrow's Objectives</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {diary.tomorrowObjectives}
                    </div>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
