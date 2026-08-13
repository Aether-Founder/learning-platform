'use client';

import { useEffect, useState } from 'react';

export function InitialLoader() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Hide initial loader after client component mounts
    const hide = () => {
      setHidden(true);
      setTimeout(() => {
        setRemoved(true);
      }, 500);
    };

    // Attach to window global for compatibility
    (window as any).hideInitialLoader = hide;

    // Small timeout to allow initial render paint before fading
    const timer = setTimeout(hide, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      id="initial-loader"
      className={hidden ? 'hidden' : ''}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1d2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.5s ease-out',
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      suppressHydrationWarning
    >
      <div className="logo-wrapper">
        <img src="/aether-logo.png" alt="Aether Logo" className="logo-image" />
        <div className="reflection-overlay">
          <div className="reflection-line"></div>
        </div>
      </div>
    </div>
  );
}
