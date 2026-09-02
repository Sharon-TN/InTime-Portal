import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { FileSpreadsheet, Search, Users } from 'lucide-react';

export default function AventiqEmployeeDetailsModule() {
  const { employees } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Download formatted Excel Spreadsheet matching Aventiq template
  const exportToExcelFormatted = () => {
    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Aventiq Employee Details</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
          th, td { border: 1px solid #C0C0C0; padding: 6px 10px; text-align: left; }
          .row-yellow { background-color: #FFFF00; font-weight: bold; text-align: center; font-size: 11pt; color: #000000; }
          .row-green { background-color: #336600; color: #FFFFFF; font-weight: bold; font-size: 10pt; }
          .data-cell { font-size: 10pt; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr class="row-yellow">
              <th colSpan="4">Employee Details</th>
              <th colSpan="6">Work Details</th>
              <th>Reporting Manager</th>
              <th colSpan="4">Personal Details</th>
              <th colSpan="4">Identity Information</th>
              <th colSpan="4">Contact Details</th>
              <th colSpan="3">Dependent Details</th>
              <th colSpan="3">Emergency Information</th>
              <th colSpan="6">Bank Details</th>
            </tr>
            <tr class="row-green">
              <th>Employee ID</th>
              <th>First Name</th>
              <th>Middle Name</th>
              <th>Last Name</th>
              <th>Department</th>
              <th>Location</th>
              <th>Employment Type</th>
              <th>Source of Hiring</th>
              <th>Date of Joining</th>
              <th>Experience</th>
              <th>Reporting Manager</th>
              <th>DOB</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Marital Status</th>
              <th>E-sign</th>
              <th>UAN</th>
              <th>PAN</th>
              <th>Aadhar</th>
              <th>Company E-mail</th>
              <th>Personal E-mail</th>
              <th>Company Phone No.</th>
              <th>Personal Phone No.</th>
              <th>Current Address</th>
              <th>Permanent Address</th>
              <th>Location</th>
              <th>Name</th>
              <th>Relationship</th>
              <th>DOB</th>
              <th>Emergency Contact</th>
              <th>Phone No.</th>
              <th>Relationship</th>
              <th>Bank Name</th>
              <th>Account No</th>
              <th>A/C Type (savings/current)</th>
              <th>IFSC Code</th>
              <th>Branch Name</th>
              <th>A/C Holder Name (As per bank records)</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(emp => `
              <tr class="data-cell">
                <td style="mso-number-format:'\\@';">${emp.employeeId || (emp.id && !emp.id.startsWith('USR_') && !emp.id.startsWith('EMP-') ? emp.id : '')}</td>
                <td>${emp.firstName || (emp.name ? emp.name.split(' ')[0] : '')}</td>
                <td>${emp.middleName || ''}</td>
                <td>${emp.lastName || (emp.name ? emp.name.split(' ').slice(1).join(' ') : '')}</td>
                <td>${emp.department || ''}</td>
                <td>${emp.location || emp.defaultCity || ''}</td>
                <td>${emp.employmentType || ''}</td>
                <td>${emp.sourceOfHiring || ''}</td>
                <td>${emp.dateOfJoining || ''}</td>
                <td>${emp.experience || ''}</td>
                <td>${emp.reportingManager || ''}</td>
                <td>${emp.dob || ''}</td>
                <td>${emp.age || ''}</td>
                <td>${emp.gender || ''}</td>
                <td>${emp.maritalStatus || ''}</td>
                <td>${emp.esign && emp.esign.startsWith('data:') ? 'Signature Uploaded' : (emp.esign || '')}</td>
                <td style="mso-number-format:'\\@';">${emp.uan && String(emp.uan).trim() ? String(emp.uan).trim() : ''}</td>
                <td style="mso-number-format:'\\@';">${emp.pan ? String(emp.pan).trim() : ''}</td>
                <td style="mso-number-format:'\\@';">${emp.aadhar ? String(emp.aadhar).trim() : ''}</td>
                <td>${emp.companyEmail || emp.email || ''}</td>
                <td>${emp.personalEmail || ''}</td>
                <td style="mso-number-format:'\\@';">${emp.companyPhoneNo ? String(emp.companyPhoneNo).trim() : ''}</td>
                <td style="mso-number-format:'\\@';">${emp.personalPhoneNo ? String(emp.personalPhoneNo).trim() : ''}</td>
                <td>${emp.currentAddress || ''}</td>
                <td>${emp.permanentAddress || ''}</td>
                <td>${emp.contactLocation || emp.location || ''}</td>
                <td>${emp.dependentName || ''}</td>
                <td>${emp.dependentRelationship || ''}</td>
                <td>${emp.dependentDob || ''}</td>
                <td>${emp.emergencyContact || ''}</td>
                <td style="mso-number-format:'\\@';">${emp.emergencyPhoneNo ? String(emp.emergencyPhoneNo).trim() : ''}</td>
                <td>${emp.emergencyRelationship || ''}</td>
                <td>${emp.bankName || ''}</td>
                <td style="mso-number-format:'\\@';">${emp.accountNo ? String(emp.accountNo).trim() : ''}</td>
                <td>${emp.accountType || ''}</td>
                <td style="mso-number-format:'\\@';">${emp.ifscCode ? String(emp.ifscCode).trim() : ''}</td>
                <td>${emp.branchName || ''}</td>
                <td>${emp.accountHolderName || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Aventiq_Employee_Details.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = employees.filter(emp =>
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.companyEmail || emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Module Header */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
              <FileSpreadsheet size={24} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Aventiq Employee Details
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Master corporate database containing work details, personal records, identity cards, emergency contacts & bank details.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                outline: 'none',
                width: '260px'
              }}
            />
          </div>

          {/* EXPORT TO EXCEL BUTTON */}
          <button
            onClick={exportToExcelFormatted}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={18} />
            <span>Export to Excel</span>
          </button>

        </div>
      </div>

      {/* Main Employee Details Data Table */}
      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <span>Company Employee Directory ({filtered.length} Staff)</span>
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Includes Work, Identity, Contact, Dependent & Bank Details
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ color: 'var(--text-subtle)', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.95rem' }}>No employee profiles matched your search criteria.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Employee ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Full Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Department & Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1rem' }}>Employment</th>
                <th style={{ padding: '0.85rem 1rem' }}>Manager</th>
                <th style={{ padding: '0.85rem 1rem' }}>Contact Email</th>
                <th style={{ padding: '0.85rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.85rem 1rem' }}>UAN / PAN</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bank Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr
                  key={emp.id}
                  style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                >
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {emp.employeeId || (emp.id && !emp.id.startsWith('USR_') && !emp.id.startsWith('EMP-') ? emp.id : '-')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    <div>{emp.department || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{emp.employmentType || '-'}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {emp.location || emp.defaultCity || '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {emp.employmentType || '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {emp.reportingManager || '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {emp.companyEmail || emp.email || '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {emp.companyPhoneNo || emp.personalPhoneNo || '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    <div>UAN: {emp.uan || '-'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>PAN: {emp.pan || '-'}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>
                    {emp.bankName || '-'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); }}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <span>View Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* Full Profile View Modal */}
      {selectedEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '750px', padding: '2rem', borderRadius: 'var(--radius-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                  {(selectedEmp.name || 'E').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedEmp.name || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {selectedEmp.employeeId || (selectedEmp.id && !selectedEmp.id.startsWith('USR_') && !selectedEmp.id.startsWith('EMP-') ? `ID: ${selectedEmp.employeeId}` : '')} {selectedEmp.department ? `${selectedEmp.department}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="btn-secondary">Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              {/* Work Details */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  💼 Work Details
                </h5>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Department:</strong> {selectedEmp.department || '-'}</div>
                  <div><strong>Location:</strong> {selectedEmp.location || selectedEmp.defaultCity || '-'}</div>
                  <div><strong>Employment Type:</strong> {selectedEmp.employmentType || '-'}</div>
                  <div><strong>Source of Hiring:</strong> {selectedEmp.sourceOfHiring || '-'}</div>
                  <div><strong>Date of Joining:</strong> {selectedEmp.dateOfJoining || '-'}</div>
                  <div><strong>Experience:</strong> {selectedEmp.experience || '-'}</div>
                  <div><strong>Reporting Manager:</strong> {selectedEmp.reportingManager || '-'}</div>
                </div>
              </div>

              {/* Personal & Identity Details */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  👤 Personal & Identity
                </h5>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>DOB:</strong> {selectedEmp.dob || '-'} {selectedEmp.age ? `(Age: ${selectedEmp.age})` : ''}</div>
                  <div><strong>Gender:</strong> {selectedEmp.gender || '-'}</div>
                  <div><strong>Marital Status:</strong> {selectedEmp.maritalStatus || '-'}</div>
                  <div>
                    <strong>E-sign:</strong>{' '}
                    {selectedEmp.esign && selectedEmp.esign.startsWith('data:') ? (
                      <img src={selectedEmp.esign} alt="Digital Signature" style={{ height: '28px', verticalAlign: 'middle', marginLeft: '6px', background: '#FFF', padding: '2px', borderRadius: '3px', border: '1px solid var(--border-color)' }} />
                    ) : (selectedEmp.esign || '-')}
                  </div>
                  <div><strong>UAN:</strong> {selectedEmp.uan || '-'}</div>
                  <div><strong>PAN:</strong> {selectedEmp.pan || '-'}</div>
                  <div><strong>Aadhar:</strong> {selectedEmp.aadhar || '-'}</div>
                </div>
              </div>

              {/* Contact Details */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  📞 Contact Details
                </h5>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Company Email:</strong> {selectedEmp.companyEmail || selectedEmp.email || '-'}</div>
                  <div><strong>Personal Email:</strong> {selectedEmp.personalEmail || '-'}</div>
                  <div><strong>Company Phone:</strong> {selectedEmp.companyPhoneNo || '-'}</div>
                  <div><strong>Personal Phone:</strong> {selectedEmp.personalPhoneNo || '-'}</div>
                  <div><strong>Current Address:</strong> {selectedEmp.currentAddress || '-'}</div>
                  <div><strong>Permanent Address:</strong> {selectedEmp.permanentAddress || '-'}</div>
                </div>
              </div>

              {/* Dependent, Emergency & Bank Details */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  🏦 Bank & Emergency Details
                </h5>
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Emergency Contact:</strong> {selectedEmp.emergencyContact || '-'} {selectedEmp.emergencyPhoneNo ? `(${selectedEmp.emergencyPhoneNo})` : ''}</div>
                  <div><strong>Emergency Relation:</strong> {selectedEmp.emergencyRelationship || '-'}</div>
                  <div><strong>Bank Name:</strong> {selectedEmp.bankName || '-'}</div>
                  <div><strong>Account Number:</strong> {selectedEmp.accountNo || '-'}</div>
                  <div><strong>A/C Type:</strong> {selectedEmp.accountType || '-'}</div>
                  <div><strong>IFSC Code:</strong> {selectedEmp.ifscCode || '-'}</div>
                  <div><strong>A/C Holder Name:</strong> {selectedEmp.accountHolderName || '-'}</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
