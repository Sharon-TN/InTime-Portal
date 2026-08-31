/**
 * Geolocation & Time Utilities for InTime Smart Attendance
 */

// Request browser high-accuracy geolocation coordinates
export const getUserCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

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
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
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
      
      const specificSpot = addr.amenity || addr.building || addr.road || "";
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || "";
      const city = addr.city || addr.town || addr.municipality || addr.district || addr.county || addr.village || "";
      const state = addr.state || addr.state_district || "";
      const pincode = addr.postcode ? ` (${addr.postcode})` : "";

      const locationParts = [specificSpot, area, city, state].filter(Boolean);
      const uniqueParts = [...new Set(locationParts)];

      if (uniqueParts.length > 0) {
        return `${uniqueParts.join(", ")}${pincode}`;
      }

      return data.display_name;
    }
    return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
  } catch (err) {
    console.warn("Reverse geocoding error:", err);
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
