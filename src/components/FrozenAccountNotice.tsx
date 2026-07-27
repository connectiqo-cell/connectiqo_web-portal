"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

export function FrozenAccountNotice() {
  const router = useRouter();
  const { frozenNotice, clearFrozenNotice } = useAuth();

  if (!frozenNotice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-accent-error/40 bg-surface-panel p-8 text-center">
        <ShieldAlert size={40} className="text-accent-error" />
        <h1 className="text-lg font-bold text-text-primary">Account suspended</h1>
        <p className="text-sm text-text-secondary">
          This account has been frozen by an administrator. Contact support if you believe this is
          a mistake.
        </p>
        <button
          type="button"
          onClick={() => {
            clearFrozenNotice();
            router.replace(ROUTES.login);
          }}
          className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
