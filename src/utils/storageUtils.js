/**
 * Storage Utilities for InTime Smart Attendance
 * Handles upload & deletion of media, documents, and payslips to Supabase Storage with graceful fallback.
 */

import { supabase, STORAGE_BUCKET } from '../lib/supabase';

// Convert base64 data URL to a binary Blob
export const base64ToBlob = (base64DataUrl) => {
  try {
    const arr = base64DataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn("Error converting base64 to Blob:", err);
    return null;
  }
};

/**
 * Uploads a file (File, Blob, or base64 string) to Supabase Storage bucket 'intime-media'.
 * Falls back gracefully to original data if bucket is not configured or fails.
 * 
 * @param {File|Blob|string} fileInput - The file, blob, or base64 data string
 * @param {string} folder - Subfolder in bucket (e.g., 'payslips', 'documents', 'selfies')
 * @param {string} preferredName - Desired filename
 * @returns {Promise<string>} Public CDN URL or original base64/fallback
 */
export const uploadFileToStorage = async (fileInput, folder = 'uploads', preferredName = '') => {
  if (!fileInput) return '';

  // If it's already a hosted URL (http/https), no need to re-upload
  if (typeof fileInput === 'string' && (fileInput.startsWith('http://') || fileInput.startsWith('https://'))) {
    return fileInput;
  }

  try {
    if (!supabase || !supabase.storage) {
      return fileInput;
    }

    let fileBody = fileInput;
    let contentType = 'application/octet-stream';
    let ext = 'bin';

    if (typeof fileInput === 'string' && fileInput.startsWith('data:')) {
      const mimeMatch = fileInput.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*?,/);
      if (mimeMatch) {
        contentType = mimeMatch[1];
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('pdf')) ext = 'pdf';
      }
      fileBody = base64ToBlob(fileInput);
      if (!fileBody) return fileInput;
    } else if (fileInput instanceof Blob || fileInput instanceof File) {
      contentType = fileInput.type || 'application/octet-stream';
      if (fileInput.name) {
        const parts = fileInput.name.split('.');
        if (parts.length > 1) ext = parts.pop();
      }
    }

    const cleanBaseName = preferredName
      ? preferredName.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `file_${Date.now()}`;
    const finalFileName = cleanBaseName.endsWith(`.${ext}`) ? cleanBaseName : `${cleanBaseName}.${ext}`;
    const filePath = `${folder}/${Date.now()}_${finalFileName}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBody, {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType
      });

    if (error) {
      console.warn(`Supabase Storage notice (${folder}):`, error.message);
      // Fallback: Return original input so flow continues without error
      return fileInput;
    }

    // Retrieve public CDN URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (publicUrlData && publicUrlData.publicUrl) {
      return publicUrlData.publicUrl;
    }

    return fileInput;
  } catch (err) {
    console.warn("Storage upload exception caught, using safe fallback:", err);
    return fileInput;
  }
};

/**
 * Deletes a file from Supabase Storage bucket by its public URL.
 * 
 * @param {string} fileUrl 
 */
export const deleteFileFromStorage = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  if (!supabase || !supabase.storage) return;

  try {
    // Only attempt deletion if it's hosted in our STORAGE_BUCKET
    if (fileUrl.includes(`/${STORAGE_BUCKET}/`)) {
      const parts = fileUrl.split(`/${STORAGE_BUCKET}/`);
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1].split('?')[0]);
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      }
    }
  } catch (err) {
    console.warn("Delete file from storage notice:", err);
  }
};
