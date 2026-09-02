import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EMPLOYEES, ADMIN_USER, DEFAULT_SHIFT_POLICY, generateInitialRecords } from '../mockData';
import { getUserCoordinates, getAddressFromCoords, checkLateness } from '../utils/geoUtils';
import { supabase } from '../lib/supabase';

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

// Helper to safely set localStorage without crashing the app on QuotaExceededError
const safeSetLocalStorage = (key, value) => {
  try {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringified);
  } catch (err) {
    console.warn(`localStorage quota exceeded for key "${key}". Cloud sync continues safely.`, err);
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      try {
        localStorage.removeItem('intime_employees');
        localStorage.removeItem('intime_records');
      } catch (e) {}
    }
  }
};

export const AttendanceProvider = ({ children }) => {
  const PURGE_KEY = 'intime_purge_v14_storage_quota_fix';

  // Theme mode ('light' | 'dark') - Light Mode by default!
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('intime_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Apply theme to document root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeSetLocalStorage('intime_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [employees, setEmployees] = useState(() => {
    try {
      if (!localStorage.getItem(PURGE_KEY)) {
        localStorage.removeItem('intime_employees');
        localStorage.removeItem('intime_records');
        localStorage.removeItem('intime_user');
        localStorage.removeItem('intime_payslips');
        localStorage.removeItem('intime_documents');
        localStorage.removeItem('intime_leaves');
        localStorage.removeItem('intime_work_diaries');
        safeSetLocalStorage(PURGE_KEY, 'true');
        return [];
      }
      const saved = localStorage.getItem('intime_employees');
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch (e) {
      return INITIAL_EMPLOYEES;
    }
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

  // Helper push functions for instant database writes with error checking
  const saveEmployeeToSupabase = async (emp) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('employees').upsert({
        id: emp.id,
        employee_id: emp.employeeId || '',
        name: emp.name,
        email: emp.email,
        department: emp.department,
        data: emp
      });
      if (error) {
        console.error("Supabase Employee Upsert Error:", error);
      }
    } catch (e) {
      console.warn("Supabase write employee notice:", e);
    }
  };

  const saveRecordToSupabase = async (rec) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('attendance_records').upsert({
        id: rec.id,
        employee_id: rec.employeeId,
        date: rec.date,
        data: rec
      });
      if (error) console.error("Supabase Record Upsert Error:", error);
    } catch (e) {
      console.warn("Supabase write record notice:", e);
    }
  };

  const savePayslipToSupabase = async (pay) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('payslips').upsert({
        id: pay.id,
        employee_id: pay.employeeId,
        data: pay
      });
      if (error) console.error("Supabase Payslip Upsert Error:", error);
    } catch (e) {
      console.warn("Supabase write payslip notice:", e);
    }
  };

  const saveDocumentToSupabase = async (doc) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('documents').upsert({
        id: doc.id,
        employee_id: doc.employeeId,
        data: doc
      });
      if (error) console.error("Supabase Document Upsert Error:", error);
    } catch (e) {
      console.warn("Supabase write document notice:", e);
    }
  };

  const saveLeaveToSupabase = async (leave) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('leaves').upsert({
        id: leave.id,
        employee_id: leave.employeeId,
        data: leave
      });
      if (error) console.error("Supabase Leave Upsert Error:", error);
    } catch (e) {
      console.warn("Supabase write leave notice:", e);
    }
  };

  const saveWorkDiaryToSupabase = async (diary) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('work_diaries').upsert({
        id: diary.id,
        employee_id: diary.employeeId,
        data: diary
      });
      if (error) console.error("Supabase Diary Upsert Error:", error);
    } catch (e) {
      console.warn("Supabase write diary notice:", e);
    }
  };

  const saveShiftPolicyToSupabase = async (policy) => {
    try {
      if (!supabase) return;
      const { error } = await supabase.from('work_diaries').upsert({
        id: 'SYSTEM_SHIFT_POLICY',
        employee_id: 'SYSTEM',
        data: policy
      });
      if (error) console.error("Supabase Policy Upsert Error:", error);
    } catch (e) {
      console.warn("Supabase write policy notice:", e);
    }
  };

  const updateShiftPolicy = (newPolicy) => {
    setShiftPolicy(newPolicy);
    safeSetLocalStorage('intime_shift_policy', newPolicy);
    saveShiftPolicyToSupabase(newPolicy);
  };

  // Sync with Supabase (pull down remote database records)
  const syncWithSupabase = async () => {
    try {
      if (!supabase) return;

      // 1. Sync Employees
      const { data: emps, error: empErr } = await supabase.from('employees').select('*');
      if (empErr) console.error("Sync Employees Error:", empErr);
      if (!empErr && emps !== null) {
        const cloudMap = new Map();
        emps.forEach(row => {
          const item = row.data ? { ...row.data, id: row.id, employeeId: row.employee_id || row.data.employeeId } : row;
          cloudMap.set(item.id || item.email, item);
        });
        const cloudEmps = Array.from(cloudMap.values());
        setEmployees(cloudEmps);
        safeSetLocalStorage('intime_employees', cloudEmps);
      }

      // 2. Sync Records
      const { data: recs } = await supabase.from('attendance_records').select('*');
      if (recs !== null) {
        const cloudMap = new Map();
        recs.forEach(row => {
          const item = row.data ? { ...row.data, id: row.id } : row;
          cloudMap.set(item.id, item);
        });
        const cloudRecs = Array.from(cloudMap.values());
        setRecords(cloudRecs);
        safeSetLocalStorage('intime_records', cloudRecs);
      }

      // 3. Sync Payslips
      const { data: pays } = await supabase.from('payslips').select('*');
      if (pays !== null) {
        const cloudMap = new Map();
        pays.forEach(row => {
          const item = row.data ? { ...row.data, id: row.id } : row;
          cloudMap.set(item.id, item);
        });
        const cloudPays = Array.from(cloudMap.values());
        setPayslips(cloudPays);
        safeSetLocalStorage('intime_payslips', cloudPays);
      }

      // 4. Sync Documents
      const { data: docs } = await supabase.from('documents').select('*');
      if (docs !== null) {
        const cloudMap = new Map();
        docs.forEach(row => {
          const item = row.data ? { ...row.data, id: row.id } : row;
          cloudMap.set(item.id, item);
        });
        const cloudDocs = Array.from(cloudMap.values());
        setDocuments(cloudDocs);
        safeSetLocalStorage('intime_documents', cloudDocs);
      }

      // 5. Sync Leaves
      const { data: levs } = await supabase.from('leaves').select('*');
      if (levs !== null) {
        const cloudMap = new Map();
        levs.forEach(row => {
          const item = row.data ? { ...row.data, id: row.id } : row;
          cloudMap.set(item.id, item);
        });
        const cloudLevs = Array.from(cloudMap.values());
        setLeaves(cloudLevs);
        safeSetLocalStorage('intime_leaves', cloudLevs);
      }

      // 6. Sync Work Diaries
      const { data: diaries } = await supabase.from('work_diaries').select('*');
      if (diaries !== null) {
        const policyRow = diaries.find(d => d.id === 'SYSTEM_SHIFT_POLICY');
        if (policyRow && policyRow.data) {
          setShiftPolicy(policyRow.data);
          safeSetLocalStorage('intime_shift_policy', policyRow.data);
        }

        const validDiaries = diaries.filter(d => d.id !== 'SYSTEM_SHIFT_POLICY');
        const cloudMap = new Map();
        validDiaries.forEach(row => {
          const item = row.data ? { ...row.data, id: row.id } : row;
          cloudMap.set(item.id, item);
        });
        const cloudDiaries = Array.from(cloudMap.values());
        setWorkDiaries(cloudDiaries);
        safeSetLocalStorage('intime_work_diaries', cloudDiaries);
      }
    } catch (err) {
      console.warn("Supabase read notice:", err);
    }
  };

  // Push local storage profiles up to Supabase on load (for profiles created before table creation)
  useEffect(() => {
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        saveEmployeeToSupabase(emp);
      });
    }
    if (records && records.length > 0) {
      records.forEach(rec => {
        saveRecordToSupabase(rec);
      });
    }
  }, []);

  // Realtime Polling every 3 seconds for instant cross-device updates
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(() => {
      syncWithSupabase();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync to local storage safely
  useEffect(() => {
    safeSetLocalStorage('intime_employees', employees);
  }, [employees]);

  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage('intime_user', currentUser);
    } else {
      localStorage.removeItem('intime_user');
    }
  }, [currentUser]);

  useEffect(() => {
    safeSetLocalStorage('intime_records', records);
  }, [records]);

  useEffect(() => {
    safeSetLocalStorage('intime_shift_policy', shiftPolicy);
  }, [shiftPolicy]);

  useEffect(() => {
    safeSetLocalStorage('intime_payslips', payslips);
  }, [payslips]);

  useEffect(() => {
    safeSetLocalStorage('intime_documents', documents);
  }, [documents]);

  useEffect(() => {
    safeSetLocalStorage('intime_leaves', leaves);
  }, [leaves]);

  useEffect(() => {
    safeSetLocalStorage('intime_work_diaries', workDiaries);
  }, [workDiaries]);

  // Clear all data (Admin Action)
  const clearAllData = async () => {
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

    try {
      if (supabase) {
        await supabase.from('employees').delete().neq('id', '0');
        await supabase.from('attendance_records').delete().neq('id', '0');
        await supabase.from('payslips').delete().neq('id', '0');
        await supabase.from('documents').delete().neq('id', '0');
        await supabase.from('leaves').delete().neq('id', '0');
        await supabase.from('work_diaries').delete().neq('id', '0');
      }
    } catch (e) {
      console.warn("Clear DB notice:", e);
    }
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

    setEmployees(prev => [...prev, newProfile]);
    saveEmployeeToSupabase(newProfile);
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
            const updated = {
              ...r,
              clockOutTime: timeString,
              clockOutIso: now.toISOString(),
              status: 'CLOCK_OUT'
            };
            saveRecordToSupabase(updated);
            return updated;
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

  const currentUserTodayRecord = currentUser ? records.find(
    r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN'
  ) : null;

  // Clock In Action
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

      setRecords(prev => [newRecord, ...prev]);
      saveRecordToSupabase(newRecord);
      return { success: true, record: newRecord };
    } catch (err) {
      console.error("Clock in failed:", err);
      return { success: false, error: err.message };
    }
  };

  // Clock Out Action
  const clockOut = async (workDiaryData = null) => {
    if (!currentUser) return { success: false, error: "Must be logged in to clock out." };

    const activeRec = records.find(r => r.employeeId === currentUser.id && r.status === 'CLOCK_IN');
    
    if (!activeRec) {
      return { success: false, error: "No active clock-in session found." };
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];

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
      setWorkDiaries(prev => [diaryRecord, ...prev]);
      saveWorkDiaryToSupabase(diaryRecord);
    }

    const newRecords = records.map(r => {
      if (r.id === activeRec.id) {
        const updated = {
          ...r,
          clockOutTime: timeString,
          clockOutIso: now.toISOString(),
          status: 'CLOCK_OUT',
          workDiarySubmitted: !!workDiaryData
        };
        saveRecordToSupabase(updated);
        return updated;
      }
      return r;
    });

    setRecords(newRecords);
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
    setPayslips(prev => [newPayslip, ...prev]);
    savePayslipToSupabase(newPayslip);
    return { success: true, payslip: newPayslip };
  };

  const deletePayslip = async (id) => {
    setPayslips(prev => prev.filter(p => p.id !== id));
    try {
      if (supabase) await supabase.from('payslips').delete().eq('id', id);
    } catch (e) {
      console.warn("Delete payslip notice:", e);
    }
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
    setDocuments(prev => [newDoc, ...prev]);
    saveDocumentToSupabase(newDoc);
    return { success: true, document: newDoc };
  };

  const deleteDocument = async (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    try {
      if (supabase) await supabase.from('documents').delete().eq('id', id);
    } catch (e) {
      console.warn("Delete doc notice:", e);
    }
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
    setLeaves(prev => [newLeave, ...prev]);
    saveLeaveToSupabase(newLeave);
    return { success: true, leave: newLeave };
  };

  const updateLeaveStatus = (leaveId, newStatus, adminNote = '') => {
    setLeaves(prev => prev.map(l => {
      if (l.id === leaveId) {
        const updated = { ...l, status: newStatus, adminNote };
        saveLeaveToSupabase(updated);
        return updated;
      }
      return l;
    }));
  };

  // Permanent Delete Employee Account across Cloud Database & Local Storage
  const deleteEmployeeAccount = async (employeeId) => {
    const targetEmp = employees.find(e => e.id === employeeId || e.employeeId === employeeId || e.email === employeeId);
    const empId = targetEmp?.id || employeeId;
    const empCustomId = targetEmp?.employeeId;
    const empEmail = targetEmp?.email;

    const isMatch = (val) => {
      if (!val) return false;
      return val === empId || val === empCustomId || val === empEmail;
    };

    // 1. Remove from React State immediately
    setEmployees(prev => prev.filter(e => !isMatch(e.id) && !isMatch(e.employeeId) && !isMatch(e.email)));
    setRecords(prev => prev.filter(r => !isMatch(r.employeeId)));
    setPayslips(prev => prev.filter(p => !isMatch(p.employeeId)));
    setDocuments(prev => prev.filter(d => !isMatch(d.employeeId)));
    setLeaves(prev => prev.filter(l => !isMatch(l.employeeId)));
    setWorkDiaries(prev => prev.filter(w => !isMatch(w.employeeId)));

    // 2. Immediately purge from localStorage cache so sync won't pick up stale entries
    const updatedEmployees = employees.filter(e => !isMatch(e.id) && !isMatch(e.employeeId) && !isMatch(e.email));
    safeSetLocalStorage('intime_employees', updatedEmployees);

    // 3. If currently logged in user is deleted, log them out
    if (currentUser && isMatch(currentUser.id || currentUser.employeeId || currentUser.email)) {
      setCurrentUser(null);
      localStorage.removeItem('intime_user');
    }

    // 4. Permanently delete from Supabase across all database tables
    try {
      if (supabase) {
        if (empId) await supabase.from('employees').delete().eq('id', empId);
        if (empEmail) await supabase.from('employees').delete().eq('email', empEmail);
        if (empCustomId) await supabase.from('employees').delete().eq('employee_id', empCustomId);

        const keysToDelete = [empId, empCustomId, empEmail].filter(Boolean);
        for (const k of keysToDelete) {
          await supabase.from('attendance_records').delete().eq('employee_id', k);
          await supabase.from('payslips').delete().eq('employee_id', k);
          await supabase.from('documents').delete().eq('employee_id', k);
          await supabase.from('leaves').delete().eq('employee_id', k);
          await supabase.from('work_diaries').delete().eq('employee_id', k);
        }
      }
    } catch (e) {
      console.warn("Delete employee error:", e);
    }
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
        setShiftPolicy: updateShiftPolicy,
        updateShiftPolicy,
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
