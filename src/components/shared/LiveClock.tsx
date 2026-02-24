'use client';
import { useState, useEffect } from 'react';

export function LiveClock({ className = '' }: { className?: string }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className={`data-mono text-[var(--text-tertiary)] ${className}`}>
      {time}
    </span>
  );
}
