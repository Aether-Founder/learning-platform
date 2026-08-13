'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Signal to the initial HTML loader that React is ready
    if (typeof window !== 'undefined' && (window as any).hideInitialLoader) {
      (window as any).hideInitialLoader();
    }
    
    // Hide loading screen when page is fully loaded
    const handleLoad = () => {
      const loader = document.getElementById('app-loader');
      if (loader && loader.parentNode) {
        loader.style.opacity = '0';
        setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
          setIsLoading(false);
        }, 500);
      } else {
        setIsLoading(false);
      }
    };

    // Check if already loaded
    if (document.readyState === 'complete') {
      // Small delay to ensure React has mounted
      setTimeout(handleLoad, 500);
    } else {
      window.addEventListener('load', () => {
        setTimeout(handleLoad, 500);
      });
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (!mounted || !isLoading) return null;

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
            WebkitMaskImage: 'url(/aether-logo.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: 'url(/aether-logo.png)',
            maskSize: 'contain',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
              background: 'linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 60%)',
              backgroundSize: '100% 100%',
              animation: 'reflection 3s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      <style jsx global>{`
        @keyframes reflection {
          0% {
            transform: translate(-100%, -100%);
          }
          100% {
            transform: translate(100%, 100%);
          }
        }
      `}</style>
    </div>
  );
}
