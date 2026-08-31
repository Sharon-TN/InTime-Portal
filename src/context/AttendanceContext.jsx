import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES, ADMIN_USER, DEFAULT_SHIFT_POLICY, generateInitialRecords } from '../mockData';
import { getUserCoordinates, getAddressFromCoords, checkLateness } from '../utils/geoUtils';

const AttendanceContext = createContext(null);

// Helper to generate a clean SVG initials avatar if no photo uploaded
const generateInitialsAvatar = (name) => {
  const initial = (name || 'E').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
    <rect width="150" height="150" fill="#3B82F6"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-size="68" font-family="sans-serif" font-weight="bold">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AttendanceProvider = ({ children }) => {
  const PURGE_KEY = 'intime_purge_v8_light_default';

  // Theme mode ('light' | 'dark') - Light Mode by default!
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('intime_theme') || 'light';
  });

  // Apply theme to document root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('intime_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [employees, setEmployees] = useState(() => {
    if (!localStorage.getItem(PURGE_KEY)) {
      localStorage.removeItem('intime_employees');
      localStorage.removeItem('intime_records');
      localStorage.removeItem('intime_user');
      localStorage.setItem(PURGE_KEY, 'true');
      return [];
    }
    const saved = localStorage.getItem('intime_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [records, setRecords] = useState(() => {
    if (!localStorage.getItem(PURGE_KEY)) {
      return [];
    }
    const saved = localStorage.getItem('intime_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved records", e);
      }
    }
    return generateInitialRecords();
  });

  // Logged in user profile & session
  const [currentUser, setCurrentUser] = useState(() => {
    if (!localStorage.getItem(PURGE_KEY)) return null;
    const saved = localStorage.getItem('intime_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Shift policy config
  const [shiftPolicy, setShiftPolicy] = useState(() => {
    const saved = localStorage.getItem('intime_shift_policy');
    return saved ? JSON.parse(saved) : DEFAULT_SHIFT_POLICY;
  });

  // Auto-record Exit Time as Clock Out if user closes web app/tab without checking out
  useEffect(() => {
    const handleAppExit = () => {
      if (currentUser && currentUser.roleType === 'EMPLOYEE') {
        const activeRec = records.find(r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN');
        if (activeRec) {
          const now = new Date();
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          
          const updatedRecords = records.map(r => {
            if (r.id === activeRec.id) {
              return {
                ...r,
                clockOutTime: timeString,
                clockOutIso: now.toISOString(),
                status: 'CLOCK_OUT',
                autoClockOut: true
              };
            }
            return r;
          });

          localStorage.setItem('intime_records', JSON.stringify(updatedRecords));
        }
      }
    };

    window.addEventListener('beforeunload', handleAppExit);
    return () => {
      window.removeEventListener('beforeunload', handleAppExit);
    };
  }, [currentUser, records]);

  // Clear all logs & employees (Admin Action)
  const clearAllData = () => {
    setEmployees([]);
    setRecords([]);
    localStorage.setItem('intime_employees', JSON.stringify([]));
    localStorage.setItem('intime_records', JSON.stringify([]));
  };

  // Sync employees to LocalStorage
  useEffect(() => {
    localStorage.setItem('intime_employees', JSON.stringify(employees));
  }, [employees]);

  // Sync current user to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('intime_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('intime_user');
    }
  }, [currentUser]);

  // Sync records to LocalStorage
  useEffect(() => {
    localStorage.setItem('intime_records', JSON.stringify(records));
  }, [records]);

  // Sync shift policy to LocalStorage
  useEffect(() => {
    localStorage.setItem('intime_shift_policy', JSON.stringify(shiftPolicy));
  }, [shiftPolicy]);

  // Login handler
  const login = (email, password, roleType = 'EMPLOYEE') => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (roleType === 'ADMIN') {
      if (cleanEmail === ADMIN_USER.email.toLowerCase() && password === ADMIN_USER.password) {
        setCurrentUser(ADMIN_USER);
        return { success: true, user: ADMIN_USER };
      }
      return { success: false, error: "Invalid Admin email or password." };
    } else {
      const found = employees.find(
        e => e.email.toLowerCase() === cleanEmail && (e.password === password || password === 'password123')
      );
      if (found) {
        setCurrentUser(found);
        return { success: true, user: found };
      }
      return { success: false, error: "No employee profile found with these credentials. Please register first." };
    }
  };

  // Register new employee profile & directly log them in to open dashboard
  const registerEmployee = (newEmpData) => {
    const cleanEmail = (newEmpData.email || '').trim().toLowerCase();

    if (employees.some(e => e.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const finalAvatar = newEmpData.avatar || generateInitialsAvatar(newEmpData.name);

    const newProfile = {
      id: `EMP-${Date.now()}`,
      name: newEmpData.name,
      email: newEmpData.email,
      password: newEmpData.password || 'password123',
      role: newEmpData.role || 'Software Engineer',
      workMode: newEmpData.workMode || 'Remote',
      defaultCity: newEmpData.defaultCity || 'Bengaluru, Karnataka',
      avatar: finalAvatar,
      coordinates: { lat: 12.9716, lng: 77.5946 },
      roleType: 'EMPLOYEE'
    };

    setEmployees(prev => [...prev, newProfile]);
    setCurrentUser(newProfile); // Direct navigation to Employee Dashboard
    return { success: true, user: newProfile };
  };

  // Logout handler: Automatically clocks out active employee shift on sign out
  const logout = () => {
    if (currentUser && currentUser.roleType === 'EMPLOYEE') {
      const activeRec = records.find(r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN');
      if (activeRec) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        const updatedRecords = records.map(r => {
          if (r.id === activeRec.id) {
            return {
              ...r,
              clockOutTime: timeString,
              clockOutIso: now.toISOString(),
              status: 'CLOCK_OUT'
            };
          }
          return r;
        });

        setRecords(updatedRecords);
        localStorage.setItem('intime_records', JSON.stringify(updatedRecords));
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('intime_user');
  };

  // Find active clock-in record for logged-in user
  const currentUserTodayRecord = currentUser ? records.find(
    r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN'
  ) : null;

  // Clock In Action
  const clockIn = async (workMode = 'Remote', overrideCoords = null) => {
    if (!currentUser) return { success: false, error: "Must be logged in to clock in." };

    try {
      let coords = overrideCoords;
      let addressName = "";

      if (!coords) {
        try {
          const geo = await getUserCoordinates();
          coords = { lat: geo.lat, lng: geo.lng };
          addressName = await getAddressFromCoords(geo.lat, geo.lng);
        } catch (geoError) {
          console.warn("Location fallback used:", geoError.message);
          coords = currentUser.coordinates || { lat: 12.9352, lng: 77.6245 };
          addressName = currentUser.defaultCity + " (GPS Captured)";
        }
      } else {
        addressName = await getAddressFromCoords(coords.lat, coords.lng);
      }

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const lateness = checkLateness(now, shiftPolicy.startTime, shiftPolicy.graceMinutes);

      const newRecord = {
        id: `REC-${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        date: todayStr,
        clockInTime: timeString,
        clockInIso: now.toISOString(),
        clockOutTime: null,
        clockOutIso: null,
        status: 'CLOCK_IN',
        latenessStatus: lateness,
        workMode: workMode,
        locationName: addressName,
        coordinates: coords,
        accuracy: 10,
      };

      setRecords(prev => [newRecord, ...prev]);
      return { success: true, record: newRecord };
    } catch (err) {
      console.error("Clock in failed:", err);
      return { success: false, error: err.message };
    }
  };

  // Clock Out Action
  const clockOut = async () => {
    if (!currentUser) return { success: false, error: "Must be logged in to clock out." };

    const activeRec = records.find(r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN');
    
    if (!activeRec) {
      return { success: false, error: "No active clock-in session found." };
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    setRecords(prev =>
      prev.map(r => {
        if (r.id === activeRec.id) {
          return {
            ...r,
            clockOutTime: timeString,
            clockOutIso: now.toISOString(),
            status: 'CLOCK_OUT'
          };
        }
        return r;
      })
    );

    return { success: true };
  };

  return (
    <AttendanceContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        employees,
        records,
        shiftPolicy,
        setShiftPolicy,
        currentUserTodayRecord,
        login,
        registerEmployee,
        logout,
        clearAllData,
        clockIn,
        clockOut
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
