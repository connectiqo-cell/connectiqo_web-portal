"use client";

import type { LucideIcon } from "lucide-react";
import { type InputHTMLAttributes, type ReactNode } from "react";

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  error?: string;
  rightSlot?: ReactNode;
}

export function AuthTextField({
  icon: Icon,
  error,
  rightSlot,
  className,
  ...inputProps
}: AuthTextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex items-center gap-2 rounded-xl border bg-surface-sheet px-3.5 py-3 ${
          error ? "border-accent-error" : "border-border-light"
        }`}
      >
        <Icon size={18} className="shrink-0 text-text-secondary" />
        <input
          className={`flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none ${className ?? ""}`}
          {...inputProps}
        />
        {rightSlot}
      </div>
      {error ? <p className="ml-1 text-xs text-accent-error">{error}</p> : null}
    </div>
  );
}
