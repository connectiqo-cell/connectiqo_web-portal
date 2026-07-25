"use client";

import type { ButtonHTMLAttributes } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function AuthButton({
  loading,
  disabled,
  children,
  className,
  ...buttonProps
}: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-text-on-accent transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      style={{ backgroundImage: "var(--gradient-button-primary)" }}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
