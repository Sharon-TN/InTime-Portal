import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Folder, Upload, File, Trash2, Eye, Download, CheckCircle, Shield } from 'lucide-react';

export default function DocumentsModule() {
  const { currentUser, documents, uploadDocument, deleteDocument } = useAttendance();

  const isAdmin = currentUser?.roleType === 'ADMIN';

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Identity Proof');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);

  // Filter documents: Admin sees all; Employee sees only their own
  const visibleDocs = isAdmin
    ? documents
    : documents.filter(d => d.employeeId === currentUser.id);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!title || (!selectedFile && !fileData)) return;

    uploadDocument({
      title,
      category,
      fileName: selectedFile ? selectedFile.name : `${title}.pdf`,
      fileType: selectedFile ? selectedFile.type : 'application/pdf',
      fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '150 KB',
      fileData: fileData || 'data:text/plain;base64,U2FtcGxlIERvY3VtZW50IENvbnRlbnQ='
    });

    setTitle('');
    setSelectedFile(null);
    setFileData(null);
    setShowUploadModal(false);
  };

  const handleDownloadFile = (doc) => {
    const link = document.createElement('a');
    link.href = doc.fileData || '#';
    link.download = doc.fileName || `${doc.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Folder size={24} style={{ color: 'var(--accent-purple)' }} />
            <span>Employee Document Vault & Verification</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {isAdmin ? "Review & audit uploaded employee compliance documents" : "Upload your ID proof, tax documents, and certificates"}
          </p>
        </div>

        {!isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setShowUploadModal(true)}
            style={{ background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
          >
            <Upload size={18} />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Documents Grid */}
      {visibleDocs.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <Folder size={48} style={{ color: 'var(--text-subtle)', marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Documents Uploaded Yet</h4>
          <p style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>
            {!isAdmin ? "Click 'Upload Document' above to store your official files securely." : "Employees have not uploaded any compliance documents yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {visibleDocs.map((doc) => (
            <div key={doc.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-purple)', background: 'rgba(168, 85, 247, 0.12)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    {doc.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                    <CheckCircle size={14} /> Verified
                  </span>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{doc.title}</h4>
                {isAdmin && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>Employee: {doc.employeeName}</div>}

                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <File size={20} style={{ color: 'var(--accent-cyan)' }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      {doc.fileSize} • Uploaded {doc.uploadDate}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleDownloadFile(doc)}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
                >
                  <Download size={15} />
                  <span>Download File</span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteDocument(doc.id)}
                  style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  title="Remove Document"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              Upload Employee Document
            </h3>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Document Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="E.g., Passport Copy, Aadhaar, PAN Card..."
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                  required
                />
              </div>



              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select File *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
                  Upload Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
