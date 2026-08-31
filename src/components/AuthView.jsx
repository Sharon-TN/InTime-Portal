import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Clock, ShieldCheck, UserCheck, UserPlus, LogIn, Mail, Lock, Check, Camera, Upload, User } from 'lucide-react';

export default function AuthView() {
  const { login, registerEmployee } = useAttendance();
  const [tab, setTab] = useState('EMPLOYEE_LOGIN'); // EMPLOYEE_LOGIN | ADMIN_LOGIN | REGISTER

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regCity, setRegCity] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null); // No pre-set image, employee uploads manually

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle local image file upload & convert to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetRole = tab === 'ADMIN_LOGIN' ? 'ADMIN' : 'EMPLOYEE';
    const res = login(email, password, targetRole);

    if (!res.success) {
      setErrorMsg(res.error);
    }
  };

  // Handle Registration Submit (Direct Navigation to Employee Dashboard)
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = registerEmployee({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      defaultCity: regCity,
      avatar: avatarPreview
    });

    if (!res.success) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-logo" style={{ width: '52px', height: '52px', margin: '0 auto 0.75rem auto', borderRadius: 'var(--radius-md)' }}>
            <Clock size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>InTime Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            Smart Attendance & Live Location Authentication
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: 'var(--radius-sm)', gap: '4px', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setTab('EMPLOYEE_LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              background: tab === 'EMPLOYEE_LOGIN' ? 'var(--primary)' : 'transparent',
              color: tab === 'EMPLOYEE_LOGIN' ? '#FFF' : 'var(--text-muted)',
              border: 'none',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <UserCheck size={14} />
            <span>Employee</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('ADMIN_LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              background: tab === 'ADMIN_LOGIN' ? 'var(--accent-purple)' : 'transparent',
              color: tab === 'ADMIN_LOGIN' ? '#FFF' : 'var(--text-muted)',
              border: 'none',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('REGISTER'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              background: tab === 'REGISTER' ? 'var(--accent-cyan)' : 'transparent',
              color: tab === 'REGISTER' ? '#FFF' : 'var(--text-muted)',
              border: 'none',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <UserPlus size={14} />
            <span>Register</span>
          </button>
        </div>

        {/* Error / Success Messages */}
        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. EMPLOYEE & ADMIN LOGIN FORM */}
        {(tab === 'EMPLOYEE_LOGIN' || tab === 'ADMIN_LOGIN') && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {tab === 'ADMIN_LOGIN' ? 'Admin Manager Email' : 'Employee Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="email"
                  placeholder={tab === 'ADMIN_LOGIN' ? 'admin@intime.tech' : 'employee@intime.tech'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                marginTop: '0.5rem',
                background: tab === 'ADMIN_LOGIN' ? 'linear-gradient(135deg, var(--accent-purple) 0%, var(--primary) 100%)' : undefined
              }}
            >
              <LogIn size={18} />
              <span>Sign In as {tab === 'ADMIN_LOGIN' ? 'Admin Manager' : 'Employee'}</span>
            </button>
          </form>
        )}

        {/* 2. EMPLOYEE REGISTRATION FORM WITH MANUAL PROFILE IMAGE UPLOAD */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Manual Profile Image Upload Area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '0.5rem' }}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--accent-cyan)',
                      boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--bg-input)',
                    border: '2px dashed var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-subtle)'
                  }}>
                    <User size={34} />
                  </div>
                )}
                
                <label
                  htmlFor="profile-upload"
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    background: 'var(--primary)',
                    color: '#FFF',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid var(--bg-card)'
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={14} />
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <label
                htmlFor="profile-upload"
                style={{
                  fontSize: '0.78rem',
                  color: avatarPreview ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Upload size={12} />
                <span>{avatarPreview ? "Change Profile Photo" : "Upload Profile Photo"}</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@intime.tech"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Create password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Job Role
              </label>
              <input
                type="text"
                placeholder="e.g. Fullstack Engineer"
                value={regRole}
                onChange={e => setRegRole(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Current City and State
              </label>
              <input
                type="text"
                placeholder="e.g. Visakhapatnam, Andhra Pradesh"
                value={regCity}
                onChange={e => setRegCity(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', outline: 'none' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--primary) 100%)' }}
            >
              <UserPlus size={18} />
              <span>Create Employee Account</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
