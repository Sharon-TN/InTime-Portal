/**
 * Geolocation & Time Utilities for InTime Smart Attendance
 */

// Request browser high-accuracy geolocation coordinates with fallback
export const getUserCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    // High accuracy option with generous timeout
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp
        });
      },
      (error) => {
        // Fallback retry with enableHighAccuracy: false if hardware GPS times out
        navigator.geolocation.getCurrentPosition(
          (posFallback) => {
            resolve({
              lat: posFallback.coords.latitude,
              lng: posFallback.coords.longitude,
              accuracy: Math.round(posFallback.coords.accuracy),
              timestamp: posFallback.timestamp
            });
          },
          (errFallback) => {
            let msg = "Unable to retrieve your location.";
            if (error.code === error.PERMISSION_DENIED) {
              msg = "Location access was denied. Please enable location permissions in your browser.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              msg = "High-accuracy location is currently unavailable.";
            } else if (error.code === error.TIMEOUT) {
              msg = "Location request timed out.";
            }
            reject(new Error(msg));
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      options
    );
  });
};

// Fetch exact street/area-level address from OpenStreetMap Nominatim (Zoom 18)
export const getAddressFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en"
        }
      }
    );
    if (!response.ok) throw new Error("Failed to fetch address");
    
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      
      const buildingOrSpot = addr.building || addr.amenity || addr.office || addr.shop || addr.house_number ? `No. ${addr.house_number}` : "";
      const road = addr.road || addr.pedestrian || addr.street || "";
      const colonyOrSuburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || "";
      const city = addr.city || addr.town || addr.municipality || addr.district || addr.county || addr.village || "";
      const state = addr.state || addr.state_district || "";
      const pincode = addr.postcode ? `(${addr.postcode})` : "";

      const spotRoad = [buildingOrSpot, road].filter(Boolean).join(" ");
      const locationParts = [spotRoad, colonyOrSuburb, city, state].filter(Boolean);
      const uniqueParts = [...new Set(locationParts)];

      if (uniqueParts.length > 0) {
        return `${uniqueParts.join(", ")} ${pincode}`.trim();
      }

      return data.display_name;
    }
    return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
  } catch (err) {
    console.warn("Reverse geocoding notice:", err);
    return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
  }
};

// Direct Google Maps URL helper
export const getGoogleMapsUrl = (lat, lng) => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Format date into DD-MM-YYYY format
export const formatDateDDMMYYYY = (isoOrDateStr) => {
  if (!isoOrDateStr) return '';
  const datePart = isoOrDateStr.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
  }
  return isoOrDateStr;
};

// Format 24-hour time string (e.g. "09:00", "18:00") into 12-hour AM/PM format (e.g. "09:00 AM", "06:00 PM")
export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${strHours}:${minutes} ${ampm}`;
};

// Get current time breakdown in Indian Standard Time (IST)
export const getISTTime = () => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
  const totalMinutes = hour * 60 + minute;
  return {
    hour,
    minute,
    second,
    totalMinutes,
    isAfter6PM: totalMinutes >= 18 * 60, // 18:00 IST (06:00 PM)
    isAfter605PM: totalMinutes >= (18 * 60 + 5) // 18:05 IST (06:05 PM)
  };
};

// Get current date formatted as YYYY-MM-DD in Indian Standard Time (IST)
export const getISTDateString = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

// Calculate and format shift work duration into HH:MM (Hours:Minutes) format
export const formatWorkDurationHHMM = (clockInIso, clockOutIso, date = null, clockInTime = null, clockOutTime = null) => {
  let startMs = clockInIso ? new Date(clockInIso).getTime() : 0;
  let endMs = clockOutIso ? new Date(clockOutIso).getTime() : 0;

  // Robust fallback: if ISO is missing/invalid, parse from 12-hour/24-hour time strings
  if ((!startMs || isNaN(startMs)) && clockInTime) {
    const startSec = parseTimeToSeconds(clockInTime);
    if (startSec >= 0) {
      startMs = startSec * 1000;
      if ((!endMs || isNaN(endMs)) && clockOutTime) {
        const endSec = parseTimeToSeconds(clockOutTime);
        if (endSec >= 0) {
          endMs = endSec * 1000;
        }
      }
    }
  }

  if (!startMs || isNaN(startMs)) return '00:00 hrs';

  const end = (endMs && !isNaN(endMs)) ? endMs : (clockOutIso ? new Date(clockOutIso).getTime() : Date.now());
  const diffMs = end - startMs;
  if (diffMs <= 0) return '00:00 hrs';

  let totalMinutes = Math.floor(diffMs / (1000 * 60));

  // Cap unclosed / stale active shifts at 9 hours max to prevent runaway 43+ hr counters
  if (!clockOutIso && !clockOutTime && totalMinutes > 9 * 60) {
    totalMinutes = 9 * 60; // 09:00 hrs cap
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const strHours = String(hours).padStart(2, '0');
  const strMins = String(minutes).padStart(2, '0');

  return `${strHours}:${strMins} hrs`;
};

// Evaluate whether clock-in time is ON_TIME or LATE
export const checkLateness = (clockInDate, shiftStartTimeStr = "09:00", graceMinutes = 15) => {
  let targetHour = 9;
  let targetMin = 0;
  
  if (shiftStartTimeStr) {
    const cleanStr = shiftStartTimeStr.replace(/(AM|PM)/i, '').trim();
    const parts = cleanStr.split(':').map(Number);
    targetHour = parts[0] || 9;
    targetMin = parts[1] || 0;

    if (shiftStartTimeStr.toUpperCase().includes('PM') && targetHour < 12) {
      targetHour += 12;
    }
    if (shiftStartTimeStr.toUpperCase().includes('AM') && targetHour === 12) {
      targetHour = 0;
    }
  }

  const expectedTime = new Date(clockInDate);
  expectedTime.setHours(targetHour, targetMin + graceMinutes, 0, 0);

  return clockInDate > expectedTime ? "LATE" : "ON_TIME";
};

// Format seconds into HH:MM:SS
export const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds < 0) return "00h 00m 00s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

// Normalize date string into comparable YYYY-MM-DD format
export const toComparableDate = (dateStr) => {
  if (!dateStr) return '';
  const clean = String(dateStr).split('T')[0].trim();
  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return clean;
};

// Parse 12-hour or 24-hour time string into total seconds of the day for strict comparison
export const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return -1;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4] ? match[4].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds;
};

// Sort diary entries strictly descending: latest date on top, then latest submission time, followed by older ones below
export const sortDiariesDescending = (diaries) => {
  if (!Array.isArray(diaries)) return [];
  return [...diaries].sort((a, b) => {
    // 1. Compare dates (YYYY-MM-DD format)
    const dateA = toComparableDate(a.date);
    const dateB = toComparableDate(b.date);
    if (dateA && dateB && dateA !== dateB) {
      return dateB.localeCompare(dateA); // Latest date first
    }

    // 2. Compare submission times if within same date
    const timeSecA = parseTimeToSeconds(a.submittedAt);
    const timeSecB = parseTimeToSeconds(b.submittedAt);
    if (timeSecA >= 0 && timeSecB >= 0 && timeSecA !== timeSecB) {
      return timeSecB - timeSecA; // Latest submission time first
    }

    // 3. Compare createdAt / created_at timestamp if present
    const isoA = a.createdAt || a.created_at ? new Date(a.createdAt || a.created_at).getTime() : 0;
    const isoB = b.createdAt || b.created_at ? new Date(b.createdAt || b.created_at).getTime() : 0;
    if (isoA && isoB && !isNaN(isoA) && !isNaN(isoB) && isoA !== isoB) {
      return isoB - isoA;
    }

    // 4. Compare ID timestamp if format is WDIARY-<timestamp>
    const idNumA = a.id && typeof a.id === 'string' && a.id.startsWith('WDIARY-')
      ? parseInt(a.id.replace('WDIARY-', ''), 10)
      : 0;
    const idNumB = b.id && typeof b.id === 'string' && b.id.startsWith('WDIARY-')
      ? parseInt(b.id.replace('WDIARY-', ''), 10)
      : 0;
    if (idNumA && idNumB && !isNaN(idNumA) && !isNaN(idNumB) && idNumA !== idNumB) {
      return idNumB - idNumA;
    }

    // 5. Fallback ID comparison
    return (b.id || '').localeCompare(a.id || '');
  });
};

