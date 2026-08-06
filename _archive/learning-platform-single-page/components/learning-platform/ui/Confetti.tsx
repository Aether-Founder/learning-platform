"use client";

import { useEffect, useState } from "react";

export function Confetti({ active, durationMs = 2800 }: { active: boolean; durationMs?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), durationMs);
    return () => clearTimeout(t);
  }, [active, durationMs]);

  if (!show) return null;

  const pieces = Array.from({ length: 48 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute block w-2 h-3 rounded-sm animate-confetti-fall"
          style={{
            left: `${(i * 17) % 100}%`,
            top: "-10px",
            backgroundColor: ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ef4444"][i % 5],
            animationDelay: `${(i % 10) * 0.08}s`,
            animationDuration: `${1.2 + (i % 5) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
