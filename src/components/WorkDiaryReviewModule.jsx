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

  // Download formatted Excel Spreadsheet matching Aventiq template with auto-expanded spacious columns
  const exportToExcelFormatted = () => {
    if (visibleDiaries.length === 0) {
      alert('No work diary entries available to export.');
      return;
    }

    try {
      const excelHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Work Diaries</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; table-layout: fixed; width: 100%; }
            th, td { border: 1px solid #C0C0C0; padding: 8px 12px; vertical-align: top; text-align: left; }
            .row-yellow { background-color: #FFFF00; font-weight: bold; text-align: center; font-size: 11pt; color: #000000; }
            .row-green { background-color: #336600; color: #FFFFFF; font-weight: bold; font-size: 10pt; }
            .data-cell { font-size: 10pt; mso-number-format:"\\@"; white-space: normal; word-wrap: break-word; }
            .col-name { width: 220px; }
            .col-date { width: 130px; }
            .col-time { width: 140px; }
            .col-tasks { width: 450px; }
            .col-accomplish { width: 350px; }
            .col-objectives { width: 350px; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col class="col-name" />
              <col class="col-date" />
              <col class="col-time" />
              <col class="col-tasks" />
              <col class="col-accomplish" />
              <col class="col-objectives" />
            </colgroup>
            <thead>
              <tr class="row-yellow">
                <th colSpan="6">Daily Work Diaries & Activity Log</th>
              </tr>
              <tr class="row-green">
                <th class="col-name">Employee Name</th>
                <th class="col-date">Date</th>
                <th class="col-time">Submission Time</th>
                <th class="col-tasks">Completed Tasks & Action Items</th>
                <th class="col-accomplish">Key Accomplishments</th>
                <th class="col-objectives">Tomorrow Objectives</th>
              </tr>
            </thead>
            <tbody>
              ${visibleDiaries.map(d => {
                const dateFormatted = formatDateDDMMYYYY(d.date) || d.date || '';
                return `
                  <tr class="data-cell">
                    <td style="mso-number-format:'\\@';">${d.employeeName || ''}</td>
                    <td style="mso-number-format:'\\@';">${dateFormatted}</td>
                    <td style="mso-number-format:'\\@';">${d.submittedAt || ''}</td>
                    <td style="mso-number-format:'\\@'; white-space: normal; word-wrap: break-word;">${d.completedTasks || ''}</td>
                    <td style="mso-number-format:'\\@'; white-space: normal; word-wrap: break-word;">${d.keyAccomplishments || ''}</td>
                    <td style="mso-number-format:'\\@'; white-space: normal; word-wrap: break-word;">${d.tomorrowObjectives || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
      const fileName = `InTime_Work_Diaries_${new Date().toISOString().split('T')[0]}.xls`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
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
            onClick={exportToExcelFormatted}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.08)', cursor: 'pointer' }}
            title="Download formatted Excel spreadsheet with spacious, auto-wrapping columns"
          >
            <Download size={16} />
            <span>Export to Excel (.XLS)</span>
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
