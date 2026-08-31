import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="live-clock-badge">
      <span className="pulse-dot" title="Live Clock Sync Active"></span>
      <Clock size={16} style={{ color: 'var(--text-muted)' }} />
      <span>{timeString}</span>
      <span style={{ color: 'var(--text-subtle)', margin: '0 2px' }}>•</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{dateString}</span>
    </div>
  );
}
