import React, { useRef, useState, useEffect } from 'react';
import { Camera, MapPin, Check, RefreshCw, X, AlertCircle } from 'lucide-react';
import { getUserCoordinates, getAddressFromCoords } from '../utils/geoUtils';

export default function ClockInCameraModal({ onConfirm, onClose, workMode }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState('Fetching live GPS coordinates...');
  const [cameraError, setCameraError] = useState('');
  const [loadingGeo, setLoadingGeo] = useState(true);

  // Initialize camera stream & location on modal load
  useEffect(() => {
    let activeStream = null;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable:", err);
        setCameraError("Camera access permission was denied or unavailable. Standard avatar will be attached.");
      }
    }

    async function initLocation() {
      try {
        setLoadingGeo(true);
        const geo = await getUserCoordinates();
        setCoords({ lat: geo.lat, lng: geo.lng });
        const addrName = await getAddressFromCoords(geo.lat, geo.lng);
        setAddress(addrName);
      } catch (err) {
        setAddress("Location permissions fallback used (Bengaluru, Karnataka)");
        setCoords({ lat: 12.9716, lng: 77.5946 });
      } finally {
        setLoadingGeo(false);
      }
    }

    initCamera();
    initLocation();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhoto(dataUrl);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  const handleFinalSubmit = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onConfirm(photo, coords);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={22} style={{ color: 'var(--primary)' }} />
              <span>Camera & Geotag Verification</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Selfie & live GPS coordinates required for Clock In
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Camera Feed or Captured Photo */}
        <div style={{ position: 'relative', width: '100%', height: '280px', background: '#000000', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
          {cameraError ? (
            <div style={{ color: 'var(--accent-rose)', padding: '1.5rem', textAlign: 'center', fontSize: '0.88rem' }}>
              <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
              <p>{cameraError}</p>
            </div>
          ) : !photo ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={capturePhoto}
                className="btn-primary"
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  borderRadius: '9999px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                }}
              >
                <Camera size={18} />
                <span>Capture Selfie</span>
              </button>
            </>
          ) : (
            <>
              <img src={photo} alt="Captured Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={retakePhoto}
                className="btn-secondary"
                style={{
                  position: 'absolute',
                  bottom: '15px',
                  borderRadius: '9999px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.85rem',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#FFFFFF'
                }}
              >
                <RefreshCw size={16} />
                <span>Retake Photo</span>
              </button>
            </>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Live GPS Geotag Info */}
        <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <MapPin size={20} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Captured Geotag Location ({workMode})
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {loadingGeo ? "Fetching exact GPS street address..." : address}
            </div>
          </div>
        </div>

        {/* Confirmation Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="btn-primary"
            disabled={!photo && !cameraError}
            style={{ flex: 1.5, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
          >
            <Check size={18} />
            <span>Confirm & Clock In</span>
          </button>
        </div>

      </div>
    </div>
  );
}
