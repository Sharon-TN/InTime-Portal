import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Clock, ShieldCheck, UserCheck, UserPlus, LogIn, Mail, Lock, Check, Camera, Upload, User, ArrowRight, ArrowLeft, FileCheck } from 'lucide-react';

export default function AuthView() {
  const { login, registerEmployee } = useAttendance();
  const [tab, setTab] = useState('EMPLOYEE_LOGIN'); // EMPLOYEE_LOGIN | ADMIN_LOGIN | REGISTER

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Multi-step Registration state
  const [regStep, setRegStep] = useState(1); // Steps 1 to 5

  // Form Fields - Basic & Work Details
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [sourceOfHiring, setSourceOfHiring] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [experience, setExperience] = useState('');

  // Form Fields - Personal & Identity Details
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [esign, setEsign] = useState(''); // Base64 signature image
  const [esignPreview, setEsignPreview] = useState(null);
  const [uan, setUan] = useState('');
  const [pan, setPan] = useState('');
  const [aadhar, setAadhar] = useState('');

  // Form Fields - Contact Details
  const [companyEmail, setCompanyEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [companyPhoneNo, setCompanyPhoneNo] = useState('');
  const [personalPhoneNo, setPersonalPhoneNo] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  // Form Fields - Dependent & Emergency Info
  const [dependentName, setDependentName] = useState('');
  const [dependentRelationship, setDependentRelationship] = useState('');
  const [dependentDob, setDependentDob] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhoneNo, setEmergencyPhoneNo] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');

  // Form Fields - Bank Details
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountType, setAccountType] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  // Credentials & Avatar
  const [regPassword, setRegPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto calculate age when DOB changes
  const handleDobChange = (val) => {
    setDob(val);
    if (val) {
      const birthDate = new Date(val);
      const diffMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(diffMs);
      setAge(Math.abs(ageDate.getUTCFullYear() - 1970).toString());
    } else {
      setAge('');
    }
  };

  // Handle local profile image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Profile picture size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle E-Sign digital signature image upload
  const handleEsignUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Digital signature image size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEsign(reader.result);
        setEsignPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle current address change with automatic copying to permanent address if checkbox is enabled
  const handleCurrentAddressChange = (val) => {
    setCurrentAddress(val);
    if (sameAsCurrentAddress) {
      setPermanentAddress(val);
    }
  };

  // Toggle Permanent address same as Current address
  const handleSameAddressToggle = (e) => {
    const checked = e.target.checked;
    setSameAsCurrentAddress(checked);
    if (checked) {
      setPermanentAddress(currentAddress);
    }
  };

  // Step Validation logic for wizard navigation
  const validateAndNextStep = () => {
    setErrorMsg('');
    
    if (regStep === 1) {
      if (!firstName.trim() || !lastName.trim() || !department.trim() || !location.trim() || !employmentType.trim() || !sourceOfHiring.trim() || !dateOfJoining.trim() || !experience.trim()) {
        setErrorMsg("Please fill in all mandatory fields in Step 1 (First Name, Last Name, Department, Work Location, Employment Type, Hiring Source, Date of Joining, Experience).");
        return;
      }
    } else if (regStep === 2) {
      if (!dob.trim() || !gender.trim() || !maritalStatus.trim() || !esign || !pan.trim() || !aadhar.trim()) {
        setErrorMsg("Please fill in all mandatory fields in Step 2 (Date of Birth, Gender, Marital Status, Digital Sign Upload, PAN Number, Aadhar Number).");
        return;
      }
    } else if (regStep === 3) {
      if (!companyEmail.trim() || !personalEmail.trim() || !companyPhoneNo.trim() || !personalPhoneNo.trim() || !currentAddress.trim() || !permanentAddress.trim()) {
        setErrorMsg("Please fill in all mandatory fields in Step 3 (Company Email, Personal Email, Company Phone, Personal Phone, Current Address, Permanent Address).");
        return;
      }
    } else if (regStep === 4) {
      if (!dependentName.trim() || !dependentRelationship.trim() || !emergencyContact.trim() || !emergencyPhoneNo.trim() || !bankName.trim() || !accountNo.trim() || !accountType.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
        setErrorMsg("Please fill in all mandatory fields in Step 4 (Dependent Name & Relation, Emergency Contact & Phone, Bank Name, Account Number, Account Type, IFSC Code, Account Holder Name).");
        return;
      }
    }

    setRegStep(prev => prev + 1);
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

  // Handle Full Registration Submit
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regPassword.trim()) {
      setErrorMsg("Please enter an account password to complete registration.");
      return;
    }

    const fullName = `${firstName.trim()} ${middleName.trim() ? middleName.trim() + ' ' : ''}${lastName.trim()}`;

    const res = registerEmployee({
      employeeId: '', // Remains blank for admin assignment
      name: fullName,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      department: department.trim(),
      location: location.trim(),
      employmentType: employmentType.trim(),
      sourceOfHiring: sourceOfHiring.trim(),
      dateOfJoining: dateOfJoining.trim(),
      experience: experience.trim(),
      reportingManager: '', // Remains blank for admin assignment
      dob: dob.trim(),
      age: age.trim(),
      gender: gender.trim(),
      maritalStatus: maritalStatus.trim(),
      esign: esign,
      uan: uan.trim(),
      pan: pan.trim(),
      aadhar: aadhar.trim(),
      email: companyEmail.trim(),
      personalEmail: personalEmail.trim(),
      companyPhoneNo: companyPhoneNo.trim(),
      personalPhoneNo: personalPhoneNo.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: permanentAddress.trim(),
      contactLocation: location.trim(),
      dependentName: dependentName.trim(),
      dependentRelationship: dependentRelationship.trim(),
      dependentDob: dependentDob.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhoneNo: emergencyPhoneNo.trim(),
      emergencyRelationship: emergencyRelationship.trim(),
      bankName: bankName.trim(),
      accountNo: accountNo.trim(),
      accountType: accountType.trim(),
      ifscCode: ifscCode.trim(),
      branchName: branchName.trim(),
      accountHolderName: accountHolderName.trim(),
      password: regPassword,
      role: department.trim(),
      defaultCity: location.trim(),
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
      <div className="glass-card" style={{ width: '100%', maxWidth: tab === 'REGISTER' ? '680px' : '480px', padding: '2.5rem', borderRadius: 'var(--radius-xl)', transition: 'max-width 0.3s ease' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="brand-logo" style={{ width: '52px', height: '52px', margin: '0 auto 0.75rem auto', borderRadius: 'var(--radius-md)' }}>
            <Clock size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>InTime Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            Smart Corporate HR & Attendance Management
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
              padding: '0.55rem',
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
              padding: '0.55rem',
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
              padding: '0.55rem',
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

        {/* 2. COMPREHENSIVE MULTI-STEP REGISTRATION FORM */}
        {tab === 'REGISTER' && (
          <div>
            
            {/* Registration Progress Wizard */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Step {regStep} of 5: {
                  regStep === 1 ? 'Work & Basic Details' :
                  regStep === 2 ? 'Personal & Identity Details' :
                  regStep === 3 ? 'Contact & Address Information' :
                  regStep === 4 ? 'Dependent & Bank Details' : 'Account Credentials'
                }
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    style={{
                      width: '24px',
                      height: '6px',
                      borderRadius: '3px',
                      background: step === regStep ? 'var(--accent-cyan)' : step < regStep ? 'var(--accent-emerald)' : 'var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit}>

              {/* STEP 1: WORK & BASIC DETAILS */}
              {regStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>First Name *</label>
                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Middle Name (Optional)</label>
                    <input type="text" placeholder="Middle Name" value={middleName} onChange={e => setMiddleName(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Last Name *</label>
                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Department *</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required>
                      <option value="">-- Select Department --</option>
                      <option value="Admin">Admin</option>
                      <option value="Product Development">Product Development</option>
                      <option value="Project Management">Project Management</option>
                      <option value="Business Development">Business Development</option>
                      <option value="Finance">Finance</option>
                      <option value="Accounts">Accounts</option>
                      <option value="Operations">Operations</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Work Location *</label>
                    <input type="text" placeholder="e.g. Bengaluru, Karnataka" value={location} onChange={e => setLocation(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Employment Type *</label>
                    <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required>
                      <option value="">-- Select Type --</option>
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Source of Hiring *</label>
                    <input type="text" placeholder="Direct / Referral / Campus" value={sourceOfHiring} onChange={e => setSourceOfHiring(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date of Joining *</label>
                    <input type="date" value={dateOfJoining} onChange={e => setDateOfJoining(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Experience *</label>
                    <input type="text" placeholder="e.g. 2.5 Years" value={experience} onChange={e => setExperience(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                </div>
              )}

              {/* STEP 2: PERSONAL & IDENTITY DETAILS */}
              {regStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date of Birth (DOB) *</label>
                    <input type="date" value={dob} onChange={e => handleDobChange(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Age *</label>
                    <input type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Gender *</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required>
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Marital Status *</label>
                    <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required>
                      <option value="">-- Select Status --</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  
                  {/* Digital Sign Image Upload */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.25rem' }}>
                      E-sign (Upload Digital Signature Image) *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEsignUpload}
                        style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}
                        required={!esign}
                      />
                      {esignPreview && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontSize: '0.78rem', fontWeight: 700 }}>
                          <FileCheck size={16} />
                          <span>Signature Uploaded</span>
                          <img src={esignPreview} alt="Signature Preview" style={{ height: '24px', borderRadius: '2px', marginLeft: '6px', border: '1px solid var(--border-color)', background: '#FFF' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>UAN Number (12 Digits) (Optional)</label>
                    <input type="text" placeholder="e.g. 100987654321" value={uan} onChange={e => setUan(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>PAN Card Number *</label>
                    <input type="text" placeholder="e.g. ABCDE1234F" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Aadhar Card Number *</label>
                    <input type="text" placeholder="e.g. 1234 5678 9012" value={aadhar} onChange={e => setAadhar(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & ADDRESSES */}
              {regStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Company E-mail (Used for Sign In) *</label>
                    <input type="email" placeholder="name@company.com" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Personal E-mail *</label>
                    <input type="email" placeholder="personal@gmail.com" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Company Phone No. *</label>
                    <input type="text" placeholder="+91 9876543210" value={companyPhoneNo} onChange={e => setCompanyPhoneNo(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Personal Phone No. *</label>
                    <input type="text" placeholder="+91 9876543210" value={personalPhoneNo} onChange={e => setPersonalPhoneNo(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Current Address *</label>
                    <input type="text" placeholder="Full residential current address" value={currentAddress} onChange={e => handleCurrentAddressChange(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  
                  {/* Address Copy Checkbox */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0' }}>
                    <input
                      type="checkbox"
                      id="same-address-check"
                      checked={sameAsCurrentAddress}
                      onChange={handleSameAddressToggle}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="same-address-check" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                      Permanent address same as Current address
                    </label>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Permanent Address *</label>
                    <input type="text" placeholder="Full permanent address as per identity proofs" value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                </div>
              )}

              {/* STEP 4: DEPENDENT, EMERGENCY & BANK DETAILS */}
              {regStep === 4 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  {/* Dependent Info */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Dependent Name *</label>
                    <input type="text" placeholder="Dependent Full Name" value={dependentName} onChange={e => setDependentName(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>Dependent Relationship *</label>
                    <input type="text" placeholder="Spouse / Child / Parent" value={dependentRelationship} onChange={e => setDependentRelationship(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>

                  {/* Emergency Info */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.25rem' }}>Emergency Contact Name *</label>
                    <input type="text" placeholder="Emergency Person Name" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.25rem' }}>Emergency Phone No. *</label>
                    <input type="text" placeholder="+91 9876543210" value={emergencyPhoneNo} onChange={e => setEmergencyPhoneNo(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>

                  {/* Bank Info */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>Bank Name *</label>
                    <input type="text" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>Account Number *</label>
                    <input type="text" placeholder="e.g. 50100234567890" value={accountNo} onChange={e => setAccountNo(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>A/C Type *</label>
                    <select value={accountType} onChange={e => setAccountType(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required>
                      <option value="">-- Select Type --</option>
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>IFSC Code *</label>
                    <input type="text" placeholder="e.g. HDFC0001234" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>A/C Holder Name (As per bank records) *</label>
                    <input type="text" placeholder="Full name registered with bank" value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', outline: 'none' }} required />
                  </div>
                </div>
              )}

              {/* STEP 5: PHOTO & PASSWORD */}
              {regStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Photo Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '84px', height: '84px', marginBottom: '0.5rem' }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-cyan)' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-input)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
                          <User size={36} />
                        </div>
                      )}
                      <label htmlFor="reg-profile-upload" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-card)' }}>
                        <Camera size={14} />
                      </label>
                      <input id="reg-profile-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{avatarPreview ? 'Photo Uploaded' : 'Upload Profile Picture (Optional)'}</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Set Account Password *</label>
                    <input type="password" placeholder="Create password" value={regPassword} onChange={e => setRegPassword(e.target.value)} style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none' }} required />
                  </div>

                </div>
              )}

              {/* Navigation Buttons for Multi-step Wizard */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {regStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(''); setRegStep(prev => prev - 1); }}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ArrowLeft size={16} />
                    <span>Previous</span>
                  </button>
                ) : <div />}

                {regStep < 5 ? (
                  <button
                    type="button"
                    onClick={validateAndNextStep}
                    className="btn-primary"
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--primary) 100%)' }}
                  >
                    <span>Next Step</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--primary) 100%)' }}
                  >
                    <UserPlus size={18} />
                    <span>Complete Registration</span>
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
