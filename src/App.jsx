import React from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import Header from './components/Header';
import AuthView from './components/AuthView';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';

function MainContent() {
  const { currentUser } = useAttendance();

  // 1. If not authenticated, show Login & Registration Portal
  if (!currentUser) {
    return <AuthView />;
  }

  // 2. If logged in as Admin, show Admin Dashboard
  if (currentUser.roleType === 'ADMIN') {
    return (
      <main className="main-container">
        <AdminDashboard />
      </main>
    );
  }

  // 3. If logged in as Employee (Prakash, Sambhavi, etc.), show Employee Dashboard
  return (
    <main className="main-container">
      <EmployeeDashboard />
    </main>
  );
}

export default function App() {
  return (
    <AttendanceProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <MainContent />
      </div>
    </AttendanceProvider>
  );
}
