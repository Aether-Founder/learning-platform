'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Hide loading screen when page is fully loaded
    const handleLoad = () => {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="app-loader"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#1a1d2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
          }}
        >
          <img
            src="/aether-logo.png"
            alt="Aether Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%, transparent 100%)',
              backgroundSize: '200% 200%',
              animation: 'reflection 2s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '32px',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '0.05em',
            opacity: 0,
            animation: 'fadeIn 1s ease-out 0.5s forwards',
          }}
        >
          Aether Learn
        </div>
      </div>
      <style jsx global>{`
        @keyframes reflection {
          0% {
            background-position: 200% 200%;
          }
          100% {
            background-position: -200% -200%;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
