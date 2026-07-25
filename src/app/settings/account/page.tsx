"use client";

import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/authApi";
import { ROUTES } from "@/lib/routes";

const CONFIRM_PHRASE = "DELETE";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  const handleDelete = async () => {
    setError("");
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      router.push(ROUTES.home);
    } catch (err) {
      setError((err as Error)?.message || "Could not delete your account. Please try again.");
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Account</h1>
        <p className="mt-1 text-sm text-text-secondary">{profile?.email ?? user.email}</p>
      </div>

      <button
        type="button"
        onClick={() => signOut().then(() => router.push(ROUTES.login))}
        className="flex w-fit items-center gap-2 rounded-full border border-border-light bg-surface-chip px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <LogOut size={16} />
        Sign out
      </button>

      <div className="flex flex-col gap-4 rounded-2xl border border-accent-error/35 bg-accent-error/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-accent-error" />
          <div>
            <h2 className="font-semibold text-text-primary">Delete account</h2>
            <p className="mt-1 text-sm text-text-secondary">
              This permanently deletes your profile, mentor and learner data, uploaded photos,
              and sign-in credentials. Bookings and earnings history tied to your account are
              not recoverable. This cannot be undone.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex w-fit items-center gap-2 rounded-full border border-accent-error/50 px-4 py-2 text-sm font-semibold text-accent-error hover:bg-accent-error/10"
          >
            <Trash2 size={16} />
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            {error ? <p className="text-sm text-accent-error">{error}</p> : null}
            <label className="text-sm text-text-secondary">
              Type <span className="font-mono font-semibold text-text-primary">{CONFIRM_PHRASE}</span> to
              confirm.
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={deleting}
              className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
              autoComplete="off"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                  setError("");
                }}
                disabled={deleting}
                className="rounded-full border border-border-light px-4 py-2 text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== CONFIRM_PHRASE || deleting}
                className="rounded-full bg-accent-error px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Permanently delete account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
