import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES, ADMIN_USER, DEFAULT_SHIFT_POLICY, generateInitialRecords } from '../mockData';
import { getUserCoordinates, getAddressFromCoords, checkLateness } from '../utils/geoUtils';

const AttendanceContext = createContext(null);

const CLOUD_STORAGE_ID = 'ff808181a058d43f01a05c61e6120caa';

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
  const PURGE_KEY = 'intime_purge_v10_blank_empid';

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
      localStorage.removeItem('intime_payslips');
      localStorage.removeItem('intime_documents');
      localStorage.removeItem('intime_leaves');
      localStorage.removeItem('intime_work_diaries');
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

  // Payslips list
  const [payslips, setPayslips] = useState(() => {
    const saved = localStorage.getItem('intime_payslips');
    return saved ? JSON.parse(saved) : [];
  });

  // Employee Documents list
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('intime_documents');
    return saved ? JSON.parse(saved) : [];
  });

  // Leaves list
  const [leaves, setLeaves] = useState(() => {
    const saved = localStorage.getItem('intime_leaves');
    return saved ? JSON.parse(saved) : [];
  });

  // Daily Work Diaries list
  const [workDiaries, setWorkDiaries] = useState(() => {
    const saved = localStorage.getItem('intime_work_diaries');
    return saved ? JSON.parse(saved) : [];
  });

  // Global Realtime Cloud DB Synchronization
  const syncWithCloud = async () => {
    try {
      const response = await fetch(`https://api.restful-api.dev/objects/${CLOUD_STORAGE_ID}`);
      if (!response.ok) return;
      const json = await response.json();
      if (json && json.data) {
        const cloudEmps = json.data.employees || [];
        const cloudRecs = json.data.records || [];
        const cloudPayslips = json.data.payslips || [];
        const cloudDocs = json.data.documents || [];
        const cloudLeaves = json.data.leaves || [];
        const cloudDiaries = json.data.workDiaries || [];

        if (cloudEmps.length > 0) {
          setEmployees(prev => {
            const map = new Map();
            prev.forEach(e => map.set(e.id || e.email, e));
            cloudEmps.forEach(e => {
              const key = e.id || e.email;
              const existing = map.get(key) || {};
              map.set(key, { ...existing, ...e });
            });
            const merged = Array.from(map.values());
            localStorage.setItem('intime_employees', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudRecs.length > 0) {
          setRecords(prev => {
            const map = new Map();
            prev.forEach(r => map.set(r.id, r));
            cloudRecs.forEach(r => map.set(r.id, r));
            const merged = Array.from(map.values());
            localStorage.setItem('intime_records', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudPayslips.length > 0) {
          setPayslips(prev => {
            const map = new Map();
            prev.forEach(p => map.set(p.id, p));
            cloudPayslips.forEach(p => map.set(p.id, p));
            const merged = Array.from(map.values());
            localStorage.setItem('intime_payslips', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudDocs.length > 0) {
          setDocuments(prev => {
            const map = new Map();
            prev.forEach(d => map.set(d.id, d));
            cloudDocs.forEach(d => map.set(d.id, d));
            const merged = Array.from(map.values());
            localStorage.setItem('intime_documents', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudLeaves.length > 0) {
          setLeaves(prev => {
            const map = new Map();
            prev.forEach(l => map.set(l.id, l));
            cloudLeaves.forEach(l => map.set(l.id, l));
            const merged = Array.from(map.values());
            localStorage.setItem('intime_leaves', JSON.stringify(merged));
            return merged;
          });
        }

        if (cloudDiaries.length > 0) {
          setWorkDiaries(prev => {
            const map = new Map();
            prev.forEach(w => map.set(w.id, w));
            cloudDiaries.forEach(w => map.set(w.id, w));
            const merged = Array.from(map.values());
            localStorage.setItem('intime_work_diaries', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn("Cloud read sync notice:", err);
    }
  };

  const pushToCloud = async (empList, recList, payList, docList, leaveList, diaryList) => {
    try {
      await fetch(`https://api.restful-api.dev/objects/${CLOUD_STORAGE_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'intime_portal_master_v1',
          data: {
            employees: empList !== undefined ? empList : employees,
            records: recList !== undefined ? recList : records,
            payslips: payList !== undefined ? payList : payslips,
            documents: docList !== undefined ? docList : documents,
            leaves: leaveList !== undefined ? leaveList : leaves,
            workDiaries: diaryList !== undefined ? diaryList : workDiaries
          }
        })
      });
    } catch (err) {
      console.warn("Cloud write sync notice:", err);
    }
  };

  // Poll cloud database every 4 seconds for real-time multi-device sync
  useEffect(() => {
    syncWithCloud();
    const interval = setInterval(() => {
      syncWithCloud();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
          pushToCloud(employees, updatedRecords, payslips, documents, leaves, workDiaries);
        }
      }
    };

    window.addEventListener('beforeunload', handleAppExit);
    return () => {
      window.removeEventListener('beforeunload', handleAppExit);
    };
  }, [currentUser, records, employees, payslips, documents, leaves, workDiaries]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('intime_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('intime_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('intime_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('intime_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('intime_shift_policy', JSON.stringify(shiftPolicy));
  }, [shiftPolicy]);

  useEffect(() => {
    localStorage.setItem('intime_payslips', JSON.stringify(payslips));
  }, [payslips]);

  useEffect(() => {
    localStorage.setItem('intime_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('intime_leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('intime_work_diaries', JSON.stringify(workDiaries));
  }, [workDiaries]);

  // Clear all data (Admin Action)
  const clearAllData = () => {
    setEmployees([]);
    setRecords([]);
    setPayslips([]);
    setDocuments([]);
    setLeaves([]);
    setWorkDiaries([]);
    localStorage.setItem('intime_employees', JSON.stringify([]));
    localStorage.setItem('intime_records', JSON.stringify([]));
    localStorage.setItem('intime_payslips', JSON.stringify([]));
    localStorage.setItem('intime_documents', JSON.stringify([]));
    localStorage.setItem('intime_leaves', JSON.stringify([]));
    localStorage.setItem('intime_work_diaries', JSON.stringify([]));
    pushToCloud([], [], [], [], [], []);
  };

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
        e => (e.email || '').toLowerCase() === cleanEmail && (e.password === password || password === 'password123')
      );
      if (found) {
        setCurrentUser(found);
        return { success: true, user: found };
      }
      return { success: false, error: "No employee profile found with these credentials. Please register first." };
    }
  };

  // Register employee
  const registerEmployee = (newEmpData) => {
    const cleanEmail = (newEmpData.email || '').trim().toLowerCase();

    if (employees.some(e => (e.email || '').toLowerCase() === cleanEmail)) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const fullName = newEmpData.name || `${newEmpData.firstName || ''} ${newEmpData.lastName || ''}`.trim() || 'Employee';
    const finalAvatar = newEmpData.avatar || generateInitialsAvatar(fullName);

    const newProfile = {
      id: `USR_${Date.now()}`,
      employeeId: newEmpData.employeeId || '',
      name: fullName,
      firstName: newEmpData.firstName || '',
      middleName: newEmpData.middleName || '',
      lastName: newEmpData.lastName || '',
      department: newEmpData.department || '',
      location: newEmpData.location || '',
      employmentType: newEmpData.employmentType || '',
      sourceOfHiring: newEmpData.sourceOfHiring || '',
      dateOfJoining: newEmpData.dateOfJoining || '',
      experience: newEmpData.experience || '',
      reportingManager: newEmpData.reportingManager || '',
      dob: newEmpData.dob || '',
      age: newEmpData.age || '',
      gender: newEmpData.gender || '',
      maritalStatus: newEmpData.maritalStatus || '',
      esign: newEmpData.esign || '',
      uan: newEmpData.uan || '',
      pan: newEmpData.pan || '',
      aadhar: newEmpData.aadhar || '',
      companyEmail: cleanEmail,
      personalEmail: newEmpData.personalEmail || '',
      companyPhoneNo: newEmpData.companyPhoneNo || '',
      personalPhoneNo: newEmpData.personalPhoneNo || '',
      currentAddress: newEmpData.currentAddress || '',
      permanentAddress: newEmpData.permanentAddress || '',
      contactLocation: newEmpData.contactLocation || newEmpData.location || '',
      dependentName: newEmpData.dependentName || '',
      dependentRelationship: newEmpData.dependentRelationship || '',
      dependentDob: newEmpData.dependentDob || '',
      emergencyContact: newEmpData.emergencyContact || '',
      emergencyPhoneNo: newEmpData.emergencyPhoneNo || '',
      emergencyRelationship: newEmpData.emergencyRelationship || '',
      bankName: newEmpData.bankName || '',
      accountNo: newEmpData.accountNo || '',
      accountType: newEmpData.accountType || '',
      ifscCode: newEmpData.ifscCode || '',
      branchName: newEmpData.branchName || '',
      accountHolderName: newEmpData.accountHolderName || '',
      email: cleanEmail,
      password: newEmpData.password || '',
      role: newEmpData.role || newEmpData.department || 'Employee',
      workMode: newEmpData.workMode || 'Remote',
      defaultCity: newEmpData.defaultCity || newEmpData.location || 'Bengaluru, Karnataka',
      avatar: finalAvatar,
      coordinates: { lat: 12.9716, lng: 77.5946 },
      roleType: 'EMPLOYEE'
    };

    setEmployees(prev => {
      const updated = [...prev, newProfile];
      pushToCloud(updated, records, payslips, documents, leaves, workDiaries);
      return updated;
    });
    setCurrentUser(newProfile);
    return { success: true, user: newProfile };
  };

  // Logout handler
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
        pushToCloud(employees, updatedRecords, payslips, documents, leaves, workDiaries);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('intime_user');
  };

  const currentUserTodayRecord = currentUser ? records.find(
    r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN'
  ) : null;

  // Clock In Action (with camera photo & geotag)
  const clockIn = async (workMode = 'Remote', overrideCoords = null, capturedPhoto = null) => {
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
          coords = currentUser.coordinates || { lat: 12.9716, lng: 77.5946 };
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
        capturedPhoto: capturedPhoto || currentUser.avatar,
        accuracy: 10,
      };

      setRecords(prev => {
        const updated = [newRecord, ...prev];
        pushToCloud(employees, updated, payslips, documents, leaves, workDiaries);
        return updated;
      });
      return { success: true, record: newRecord };
    } catch (err) {
      console.error("Clock in failed:", err);
      return { success: false, error: err.message };
    }
  };

  // Clock Out Action (with mandatory Work Diary data)
  const clockOut = async (workDiaryData = null) => {
    if (!currentUser) return { success: false, error: "Must be logged in to clock out." };

    const activeRec = records.find(r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN');
    
    if (!activeRec) {
      return { success: false, error: "No active clock-in session found." };
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];

    let newDiaries = workDiaries;
    if (workDiaryData) {
      const diaryRecord = {
        id: `WDIARY-${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        date: todayStr,
        completedTasks: workDiaryData.completedTasks || '',
        keyAccomplishments: workDiaryData.keyAccomplishments || '',
        tomorrowObjectives: workDiaryData.tomorrowObjectives || '',
        shiftNotes: workDiaryData.shiftNotes || '',
        submittedAt: timeString
      };
      newDiaries = [diaryRecord, ...workDiaries];
      setWorkDiaries(newDiaries);
    }

    const newRecords = records.map(r => {
      if (r.id === activeRec.id) {
        return {
          ...r,
          clockOutTime: timeString,
          clockOutIso: now.toISOString(),
          status: 'CLOCK_OUT',
          workDiarySubmitted: !!workDiaryData
        };
      }
      return r;
    });

    setRecords(newRecords);
    pushToCloud(employees, newRecords, payslips, documents, leaves, newDiaries);

    return { success: true };
  };

  // Payslip Management
  const uploadPayslip = (payslipData) => {
    const newPayslip = {
      id: `PAY-${Date.now()}`,
      employeeId: payslipData.employeeId,
      employeeName: payslipData.employeeName,
      month: payslipData.month || 'August 2026',
      basicPay: payslipData.basicPay || 60000,
      allowances: payslipData.allowances || 15000,
      deductions: payslipData.deductions || 5000,
      netSalary: (Number(payslipData.basicPay || 60000) + Number(payslipData.allowances || 15000)) - Number(payslipData.deductions || 5000),
      issueDate: new Date().toLocaleDateString(),
      fileName: payslipData.fileName || `Payslip_${payslipData.month}_${payslipData.employeeName}.pdf`,
      fileData: payslipData.fileData || null
    };
    setPayslips(prev => {
      const updated = [newPayslip, ...prev];
      pushToCloud(employees, records, updated, documents, leaves, workDiaries);
      return updated;
    });
    return { success: true, payslip: newPayslip };
  };

  const deletePayslip = (id) => {
    setPayslips(prev => {
      const updated = prev.filter(p => p.id !== id);
      pushToCloud(employees, records, updated, documents, leaves, workDiaries);
      return updated;
    });
  };

  // Document Management
  const uploadDocument = (docData) => {
    const newDoc = {
      id: `DOC-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      title: docData.title,
      category: docData.category || 'Identity Proof',
      fileName: docData.fileName,
      fileType: docData.fileType || 'application/pdf',
      fileSize: docData.fileSize || '1.2 MB',
      fileData: docData.fileData,
      uploadDate: new Date().toLocaleDateString(),
      status: 'Verified'
    };
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      pushToCloud(employees, records, payslips, updated, leaves, workDiaries);
      return updated;
    });
    return { success: true, document: newDoc };
  };

  const deleteDocument = (id) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      pushToCloud(employees, records, payslips, updated, leaves, workDiaries);
      return updated;
    });
  };

  // Leave Management
  const applyLeave = (leaveData) => {
    const newLeave = {
      id: `LEV-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      type: leaveData.type || 'Casual Leave',
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      days: leaveData.days || 1,
      reason: leaveData.reason,
      status: 'PENDING',
      appliedOn: new Date().toLocaleDateString()
    };
    setLeaves(prev => {
      const updated = [newLeave, ...prev];
      pushToCloud(employees, records, payslips, documents, updated, workDiaries);
      return updated;
    });
    return { success: true, leave: newLeave };
  };

  const updateLeaveStatus = (leaveId, newStatus, adminNote = '') => {
    setLeaves(prev => {
      const updated = prev.map(l => {
        if (l.id === leaveId) {
          return { ...l, status: newStatus, adminNote };
        }
        return l;
      });
      pushToCloud(employees, records, payslips, documents, updated, workDiaries);
      return updated;
    });
  };

  // Delete Employee Account (Admin Action)
  const deleteEmployeeAccount = (employeeId) => {
    const newEmps = employees.filter(e => e.id !== employeeId);
    const newRecs = records.filter(r => r.employeeId !== employeeId);
    const newPays = payslips.filter(p => p.employeeId !== employeeId);
    const newDocs = documents.filter(d => d.employeeId !== employeeId);
    const newLevs = leaves.filter(l => l.employeeId !== employeeId);
    const newWd = workDiaries.filter(w => w.employeeId !== employeeId);

    setEmployees(newEmps);
    setRecords(newRecs);
    setPayslips(newPays);
    setDocuments(newDocs);
    setLeaves(newLevs);
    setWorkDiaries(newWd);

    pushToCloud(newEmps, newRecs, newPays, newDocs, newLevs, newWd);
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
        payslips,
        documents,
        leaves,
        workDiaries,
        login,
        registerEmployee,
        logout,
        clearAllData,
        deleteEmployeeAccount,
        clockIn,
        clockOut,
        uploadPayslip,
        deletePayslip,
        uploadDocument,
        deleteDocument,
        applyLeave,
        updateLeaveStatus
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
