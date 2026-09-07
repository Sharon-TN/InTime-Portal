// Clean initial employee roster - new accounts registered by employees
export const INITIAL_EMPLOYEES = [];

// Admin Credentials for Manager access
export const ADMIN_USER = {
  id: "ADM-001",
  name: "Admin Manager",
  role: "Engineering Manager",
  email: import.meta.env?.VITE_ADMIN_EMAIL || "admin@intime.tech",
  password: import.meta.env?.VITE_ADMIN_PASSWORD || "Aven@2026int",
  roleType: "ADMIN"
};

export const DEFAULT_SHIFT_POLICY = {
  startTime: "09:00",
  graceMinutes: 15,
  endTime: "18:00",
  workHoursTarget: 8
};

// Clean empty initial attendance records
export function generateInitialRecords() {
  return [];
}
