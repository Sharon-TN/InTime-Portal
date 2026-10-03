import React, { useMemo, useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { formatDateDDMMYYYY, sortDiariesDescending } from '../utils/geoUtils';
import { BookOpen, CheckCircle, Target, FileText, User, Calendar, Download, Users, X } from 'lucide-react';

export default function WorkDiaryReviewModule() {
  const { workDiaries, currentUser } = useAttendance();
  const isAdmin = currentUser?.roleType === 'ADMIN';

  const [showEmployeeExportModal, setShowEmployeeExportModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Filter and sort diaries: Admin sees all; Employee sees only their own
  // Strictly sorted: latest date & submission time on top, followed by older ones below
  const visibleDiaries = useMemo(() => {
    const filtered = isAdmin
      ? (workDiaries || [])
      : (workDiaries || []).filter(d => d.employeeId === currentUser?.id);
    return sortDiariesDescending(filtered);
  }, [workDiaries, isAdmin, currentUser?.id]);

  // Group diaries by employee for individual export
  const employeeGroups = useMemo(() => {
    const map = new Map();
    (visibleDiaries || []).forEach(d => {
      const id = d.employeeId || d.employeeName || 'unknown';
      if (!map.has(id)) {
        map.set(id, {
          id: d.employeeId || d.employeeName,
          name: d.employeeName || 'Unknown Employee',
          diaries: []
        });
      }
      map.get(id).diaries.push(d);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleDiaries]);

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

  // Download formatted Excel Spreadsheet for a specific individual employee
  const exportSingleEmployeeExcel = (employeeGroup) => {
    if (!employeeGroup || !employeeGroup.diaries || employeeGroup.diaries.length === 0) {
      alert('No work diary entries available for this employee.');
      return;
    }

    try {
      const empName = employeeGroup.name;
      const sorted = sortDiariesDescending(employeeGroup.diaries);

      const excelHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${empName.replace(/[:\\/?*\[\]]/g, '').slice(0, 31)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; table-layout: fixed; width: 100%; }
            th, td { border: 1px solid #C0C0C0; padding: 8px 12px; vertical-align: top; text-align: left; }
            .row-yellow { background-color: #FFFF00; font-weight: bold; text-align: center; font-size: 11pt; color: #000000; }
            .row-green { background-color: #336600; color: #FFFFFF; font-weight: bold; font-size: 10pt; }
            .data-cell { font-size: 10pt; mso-number-format:"\\@"; white-space: normal; word-wrap: break-word; }
            .col-date { width: 140px; }
            .col-time { width: 150px; }
            .col-tasks { width: 500px; }
            .col-accomplish { width: 400px; }
            .col-objectives { width: 400px; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col class="col-date" />
              <col class="col-time" />
              <col class="col-tasks" />
              <col class="col-accomplish" />
              <col class="col-objectives" />
            </colgroup>
            <thead>
              <tr class="row-yellow">
                <th colSpan="5">Daily Work Diaries & Activity Log — ${empName}</th>
              </tr>
              <tr class="row-green">
                <th class="col-date">Date</th>
                <th class="col-time">Submission Time</th>
                <th class="col-tasks">Completed Tasks & Action Items</th>
                <th class="col-accomplish">Key Accomplishments</th>
                <th class="col-objectives">Tomorrow Objectives</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map(d => {
                const dateFormatted = formatDateDDMMYYYY(d.date) || d.date || '';
                return `
                  <tr class="data-cell">
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
      const cleanEmpName = empName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `InTime_Work_Diary_${cleanEmpName}_${new Date().toISOString().split('T')[0]}.xls`;
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

        {/* Excel Export Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={exportToExcelFormatted}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.08)', cursor: 'pointer' }}
            title="Download formatted Excel spreadsheet with all employees' work diaries"
          >
            <Download size={16} />
            <span>Export to Excel (.XLS)</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                if (employeeGroups.length === 0) {
                  alert('No employee work diaries available to export.');
                  return;
                }
                setSelectedEmployeeId(employeeGroups[0]?.id || '');
                setShowEmployeeExportModal(true);
              }}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.08)', cursor: 'pointer' }}
              title="Download separate Excel spreadsheet for each individual employee"
            >
              <Users size={16} />
              <span>Export by Employee (.XLS)</span>
            </button>
          )}
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

      {/* Individual Employee Export Modal */}
      {showEmployeeExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="brand-logo" style={{ width: '36px', height: '36px' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Export Individual Employee Diary
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Download a dedicated spreadsheet containing only the selected employee's work diaries
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeExportModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Dropdown Selector */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Select Employee:
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  {employeeGroups.map(grp => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name} ({grp.diaries.length} {grp.diaries.length === 1 ? 'entry' : 'entries'})
                    </option>
                  ))}
                </select>

                <button
                  className="btn-primary"
                  onClick={() => {
                    const grp = employeeGroups.find(g => g.id === selectedEmployeeId);
                    if (grp) {
                      exportSingleEmployeeExcel(grp);
                    }
                  }}
                  style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={15} />
                  <span>Download .XLS</span>
                </button>
              </div>
            </div>

            {/* Employee Quick List */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Or 1-Click Download Per Employee:
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
                {employeeGroups.map(grp => (
                  <div
                    key={grp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {grp.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {grp.diaries.length} {grp.diaries.length === 1 ? 'work diary submission' : 'work diary submissions'}
                      </div>
                    </div>
                    <button
                      onClick={() => exportSingleEmployeeExcel(grp)}
                      className="btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        borderColor: 'var(--accent-emerald)',
                        color: 'var(--accent-emerald)',
                        background: 'rgba(16, 185, 129, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={13} />
                      <span>Download .XLS</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowEmployeeExportModal(false)}
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
