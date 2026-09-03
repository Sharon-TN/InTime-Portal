import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import LiveClock from './LiveClock';
import { Clock, LogOut, Sun, Moon } from 'lucide-react';

export default function Header() {
  const { currentUser, logout, theme, toggleTheme, setShowProfileModal } = useAttendance();

  const isAdmin = currentUser?.roleType === 'ADMIN';

  return (
    <header className="app-header">
      {/* Brand & Logo */}
      <div className="brand-container">
        <div className="brand-logo">
          <Clock size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">InTime</div>
          <div className="brand-subtitle">Smart Attendance & Location Tracker</div>
        </div>
      </div>

      {/* Actions: Live Clock, Theme Switcher & User Profile Badge */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
        <LiveClock />

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logged in User Badge (Clickable for Employee Profile) */}
        {currentUser && (
          <div
            onClick={() => {
              if (!isAdmin) {
                setShowProfileModal(true);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'var(--bg-input)',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              cursor: !isAdmin ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
            title={!isAdmin ? "Click to view full Employee Profile" : "Logged in as Admin Manager"}
          >
            {!isAdmin && currentUser.avatar && (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--text-main)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: isAdmin ? 'var(--accent-purple)' : 'var(--accent-cyan)', fontWeight: 600 }}>
                {isAdmin ? 'Admin Manager' : 'Employee Profile'}
              </div>
            </div>
          </div>
        )}

        {/* Log Out Button */}
        {currentUser && (
          <button
            className="btn-secondary"
            onClick={logout}
            title="Sign out of your account"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}
