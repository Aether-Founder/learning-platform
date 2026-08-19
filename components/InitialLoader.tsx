'use client';

import { useEffect, useState } from 'react';

export function InitialLoader() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isMounted) return null;

  return (
    <div id="initial-loader" className="initial-loader" aria-hidden="true">
      <div className="initial-loader__logo">
        <img src="/aether-logo.png" alt="" className="initial-loader__image" />
        <div className="reflection-overlay">
          <div className="reflection-line"></div>
        </div>
      </div>
    </div>
  );
}
