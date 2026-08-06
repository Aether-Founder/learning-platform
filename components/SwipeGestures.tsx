"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = "",
}: SwipeGesturesProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      touchStartRef.current = null;
      return;
    }

    if (absDeltaX > absDeltaY) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    touchStartRef.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftActionLabel?: string;
  rightActionLabel?: string;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionLabel = "Archiveer",
  rightActionLabel = "Verwijder",
  className = "",
}: SwipeableCardProps) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const cardTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!cardTouchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - cardTouchStartRef.current.x;

    if (Math.abs(deltaX) > 10) {
      setSwipeDirection(deltaX > 0 ? "right" : "left");
      setSwipeProgress(Math.min(Math.abs(deltaX) / 100, 1));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeProgress > 0.5) {
      if (swipeDirection === "left" && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeDirection === "right" && onSwipeRight) {
        onSwipeRight();
      }
    }
    setSwipeProgress(0);
    setSwipeDirection(null);
    cardTouchStartRef.current = null;
  }, [swipeProgress, swipeDirection, onSwipeLeft, onSwipeRight]);

  return (
    <SwipeGestures
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      threshold={100}
      className={`relative ${className}`}
    >
      <div className="relative overflow-hidden">
        {swipeDirection === "left" && (
          <div
            className="absolute inset-0 bg-red-500 flex items-center justify-center transition-opacity"
            style={{ opacity: swipeProgress * 0.3 }}
          >
            <span className="text-white font-semibold">{leftActionLabel}</span>
          </div>
        )}
        {swipeDirection === "right" && (
          <div
            className="absolute inset-0 bg-green-500 flex items-center justify-center transition-opacity"
            style={{ opacity: swipeProgress * 0.3 }}
          >
            <span className="text-white font-semibold">{rightActionLabel}</span>
          </div>
        )}
        <div
          className="relative transition-transform"
          style={{
            transform: swipeDirection
              ? `translateX(${swipeDirection === "left" ? -swipeProgress * 100 : swipeProgress * 100}%)`
              : "translateX(0)",
          }}
        >
          {children}
        </div>
      </div>
    </SwipeGestures>
  );
}
