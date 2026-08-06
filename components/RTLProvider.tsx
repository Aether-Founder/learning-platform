"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface RTLContextType {
  isRTL: boolean;
  setRTL: (rtl: boolean) => void;
  direction: "ltr" | "rtl";
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

const RTL_LANGUAGES = ["ar", "he", "fa", "ur", "yi"];

export function RTLProvider({ children }: { children: ReactNode }) {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const language = localStorage.getItem("language") || "nl";
    const shouldBeRTL = RTL_LANGUAGES.includes(language);
    setIsRTL(shouldBeRTL);
  }, []);

  useEffect(() => {
    const direction = isRTL ? "rtl" : "ltr";
    document.documentElement.dir = direction;
    document.documentElement.lang = localStorage.getItem("language") || "nl";
  }, [isRTL]);

  const setRTL = (rtl: boolean) => {
    setIsRTL(rtl);
  };

  const value: RTLContextType = {
    isRTL,
    setRTL,
    direction: isRTL ? "rtl" : "ltr",
  };

  return <RTLContext.Provider value={value}>{children}</RTLContext.Provider>;
}

export function useRTL() {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error("useRTL must be used within a RTLProvider");
  }
  return context;
}

export function isLanguageRTL(language: string): boolean {
  return RTL_LANGUAGES.includes(language);
}

export function getRTLStyle(isRTL: boolean) {
  return {
    direction: isRTL ? "rtl" as const : "ltr" as const,
    textAlign: isRTL ? "right" as const : "left" as const,
  };
}
