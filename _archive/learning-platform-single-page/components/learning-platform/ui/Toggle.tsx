"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 py-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 rounded-full border border-border transition-colors duration-200",
          checked ? "bg-foreground" : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-sm transform transition-transform duration-200 mt-0.5",
            checked ? "translate-x-[22px] ml-0.5" : "translate-x-1"
          )}
        />
      </button>
    </label>
  );
}
