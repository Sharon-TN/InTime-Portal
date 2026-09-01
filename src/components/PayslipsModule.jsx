import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Download, FileText, Upload, Trash2, CheckCircle, File, Eye, Sparkles, UserCheck } from 'lucide-react';

export default function PayslipsModule() {
  const { currentUser, payslips, employees, uploadPayslip, deletePayslip } = useAttendance();

  const isAdmin = currentUser?.roleType === 'ADMIN';

  // State for Bulk Auto-Route Admin PDF Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [month, setMonth] = useState('August 2026');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // State for Manual Direct Employee PDF Upload Modal
  const [showManualUploadModal, setShowManualUploadModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [manualMonth, setManualMonth] = useState('August 2026');
  const [manualFile, setManualFile] = useState(null);

  // Filter payslips: Admin sees all; Employee sees only their own
  const visiblePayslips = isAdmin
    ? payslips
    : payslips.filter(p => p.employeeId === currentUser.id);

  const handleFilesSelection = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Comprehensive In-PDF Text Extraction using Mozilla PDF.js & stream decoding
  const extractPdfText = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Ensure PDF.js engine is dynamically loaded
      if (!window.pdfjsLib) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
            resolve();
          };
          script.onerror = resolve;
          document.head.appendChild(script);
        });
      }

      // 1. Primary PDF.js Text Content Extraction
      if (window.pdfjsLib) {
        try {
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let extractedText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageItems = textContent.items.map(item => item.str).join(' ');
            extractedText += pageItems + ' ';
          }

          if (extractedText.trim().length > 0) {
            return extractedText;
          }
        } catch (pdfErr) {
          console.warn("PDF.js text parse fallback:", pdfErr);
        }
      }

      // 2. Secondary Stream Decoder Fallback
      const decoder = new TextDecoder('latin1');
      return decoder.decode(arrayBuffer);

    } catch (err) {
      console.error("Text extraction failed:", err);
      return '';
    }
  };

  // Smart PDF Text & Filename Parsing Auto-Routing Function
  const processSmartAutoRoutePayslip = async (file) => {
    // Read Data URL for saving file
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    // Extract text from inside the PDF document
    const rawPdfText = await extractPdfText(file);
    const pdfTextLower = rawPdfText.toLowerCase();
    const fileNameLower = file.name.toLowerCase();

    // Match against registered employees list
    const matchedEmp = employees.find(emp => {
      const nameLower = (emp.name || '').toLowerCase();
      const idLower = String(emp.id || '').toLowerCase();
      const emailPrefix = (emp.email || '').split('@')[0].toLowerCase();
      
      // Individual name tokens (e.g. "Sharon", "Rahil")
      const nameTokens = nameLower.split(/\s+/).filter(t => t.length >= 2);

      // Check 1: Match full name in PDF text or filename
      if (nameLower && (pdfTextLower.includes(nameLower) || fileNameLower.includes(nameLower))) {
        return true;
      }

      // Check 2: Match any name token (first/last name) in PDF text or filename
      if (nameTokens.some(token => pdfTextLower.includes(token) || fileNameLower.includes(token))) {
        return true;
      }

      // Check 3: Match Employee ID or numbers in PDF text or filename
      if (idLower && (pdfTextLower.includes(idLower) || fileNameLower.includes(idLower))) {
        return true;
      }

      // Check 4: Match Email handle in PDF text or filename
      if (emailPrefix.length >= 3 && (pdfTextLower.includes(emailPrefix) || fileNameLower.includes(emailPrefix))) {
        return true;
      }

      return false;
    });

    if (!matchedEmp) {
      const textPreview = rawPdfText.replace(/\s+/g, ' ').trim().slice(0, 120);
      return {
        success: false,
        fileName: file.name,
        extractedPreview: textPreview || 'No readable text stream found inside PDF',
        error: `Could not match employee for file "${file.name}".`
      };
    }

    return {
      success: true,
      employeeId: matchedEmp.id,
      employeeName: matchedEmp.name,
      month,
      fileName: file.name,
      fileData: dataUrl
    };
  };

  const handleAdminPdfUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select at least one PDF file to upload.');
      return;
    }

    if (employees.length === 0) {
      alert('⚠️ No registered employees found in the system. Please ensure employees have registered their accounts first.');
      return;
    }

    setIsProcessingBulk(true);

    try {
      const results = await Promise.all(selectedFiles.map(processSmartAutoRoutePayslip));

      // Check for unmapped files
      const failedMatches = results.filter(r => !r.success);

      if (failedMatches.length > 0) {
        const registeredNames = employees.map(e => `"${e.name}"`).join(', ');
        const errorMessages = failedMatches.map(f => 
          `• File: "${f.fileName}"\n  Extracted text preview: "${f.extractedPreview}"`
        ).join('\n\n');

        alert(
          `❌ Upload & Auto-Routing Failed:\n\n` +
          `The employee name was not found inside the PDF text for the following file(s):\n\n` +
          errorMessages +
          `\n\nRegistered Employees in Roster: ${registeredNames || 'None'}\n\n` +
          `Please ensure the PDF contains the exact employee name or ID.`
        );
        setIsProcessingBulk(false);
        return;
      }

      // If all files matched successfully, execute disbursal
      let matchSummary = [];
      results.forEach(res => {
        uploadPayslip({
          employeeId: res.employeeId,
          employeeName: res.employeeName,
          month: res.month,
          fileName: res.fileName,
          fileData: res.fileData
        });
        matchSummary.push(`• ${res.fileName} ➔ ${res.employeeName}`);
      });

      alert(`✅ Success! Auto-routed ${results.length} payslip PDF(s) to employees:\n\n` + matchSummary.join('\n'));

      setSelectedFiles([]);
      setShowUploadModal(false);
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Error processing payslip PDFs: " + err.message);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Direct Employee Manual PDF Upload Handler
  const handleManualPdfUpload = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert('Please select an employee from the list.');
      return;
    }
    if (!manualFile) {
      alert('Please select a PDF file to upload.');
      return;
    }

    const matchedEmp = employees.find(emp => emp.id === selectedEmployeeId);
    if (!matchedEmp) {
      alert('Selected employee not found in company roster.');
      return;
    }

    try {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(manualFile);
      });

      uploadPayslip({
        employeeId: matchedEmp.id,
        employeeName: matchedEmp.name,
        month: manualMonth,
        fileName: manualFile.name,
        fileData: dataUrl
      });

      alert(`✅ Payslip successfully uploaded and sent to ${matchedEmp.name} (${matchedEmp.id})!`);
      setManualFile(null);
      setShowManualUploadModal(false);
    } catch (err) {
      console.error("Manual upload error:", err);
      alert("Failed to upload payslip: " + err.message);
    }
  };

  // Download exact PDF uploaded by Admin
  const handleDownloadPdf = (p) => {
    if (p.fileData) {
      const link = document.createElement('a');
      link.href = p.fileData;
      link.download = p.fileName || `Payslip_${p.month}_${p.employeeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={24} style={{ color: 'var(--accent-emerald)' }} />
            <span>{isAdmin ? "Monthly Payslips & Bulk PDF Auto-Routing" : "Monthly Payslips"}</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {isAdmin ? "Upload single or multiple PDF payslips; system automatically reads in-PDF text content to route each PDF to the right employee" : "View and download official payslip PDFs uploaded by HR"}
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '260px' }}>
            {/* Auto-Route Payslips Button */}
            <button
              className="btn-primary"
              onClick={() => setShowUploadModal(true)}
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              <Sparkles size={18} />
              <span>Upload and Auto-Route Payslips</span>
            </button>

            {/* Manual Upload Payslips Button (Below Auto-Route Button) */}
            <button
              className="btn-secondary"
              onClick={() => {
                if (employees.length > 0 && !selectedEmployeeId) {
                  setSelectedEmployeeId(employees[0].id);
                }
                setShowManualUploadModal(true);
              }}
              style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'var(--primary)', color: 'var(--primary)', gap: '0.5rem', fontWeight: 800, width: '100%', justifyContent: 'center' }}
            >
              <Upload size={18} />
              <span>Upload Payslips</span>
            </button>
          </div>
        )}
      </div>

      {/* Payslips Grid */}
      {visiblePayslips.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ color: 'var(--text-subtle)', marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Payslips Available</h4>
          <p style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>
            {isAdmin ? "Click 'Upload Payslips' or 'Upload and Auto-Route Payslips' above to send official PDF payslips to staff." : "Monthly payslip PDFs uploaded by HR will appear here for download."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {visiblePayslips.map((p) => (
            <div key={p.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase' }}>
                    {p.month}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Issued: {p.issueDate}</span>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.employeeName}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>ID: {p.employeeId}</div>

                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <File size={24} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {p.fileName || `Payslip_${p.month}.pdf`}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleDownloadPdf(p)}
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
                >
                  <Download size={16} />
                  <span>Download Payslip PDF</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => deletePayslip(p.id)}
                    style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    title="Remove Payslip"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Auto-Route PDF Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Sparkles size={22} style={{ color: 'var(--accent-emerald)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Upload and Auto-Route Payslips
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Upload one or multiple PDF payslips at once. The AI parser inspects in-PDF text and filenames to automatically assign each PDF to its corresponding employee.
            </p>

            <form onSubmit={handleAdminPdfUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select PDF Files (Upload 1 or Multiple at once) *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleFilesSelection}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                  required
                />
                {selectedFiles.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '0.4rem' }}>
                    ✓ Selected {selectedFiles.length} PDF file(s) for auto-routing
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Pay Month & Year *</label>
                <input
                  type="text"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  placeholder="E.g., August 2026"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingBulk}
                  className="btn-primary"
                  style={{ flex: 1, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', padding: '0.7rem' }}
                >
                  {isProcessingBulk ? 'Extracting PDF Text & Routing...' : 'Upload and Auto-Route Payslips'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Manual Direct Employee Upload Modal */}
      {showManualUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Upload size={22} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Upload Payslip to Particular Employee
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Select a specific employee from your company roster and attach their PDF payslip to send it directly to their account.
            </p>

            <form onSubmit={handleManualPdfUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select Particular Employee *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', outline: 'none' }}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department || emp.role || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Pay Month & Year *</label>
                <input
                  type="text"
                  value={manualMonth}
                  onChange={e => setManualMonth(e.target.value)}
                  placeholder="E.g., August 2026"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select Employee PDF Payslip *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={e => setManualFile(e.target.files[0])}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                  required
                />
                {manualFile && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.4rem' }}>
                    ✓ Attached PDF: {manualFile.name}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowManualUploadModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, background: 'var(--primary)', borderColor: 'var(--primary)', padding: '0.7rem' }}
                >
                  Send Payslip to Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
