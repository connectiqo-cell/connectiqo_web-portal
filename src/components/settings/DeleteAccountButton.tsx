"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountButton() {
  const { signOut } = useAuth();
  // No "mounted" gate needed before createPortal below: `open` only ever
  // flips true from the trigger button's onClick, which can't fire before
  // hydration — so document.body is always available by then.
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setTimeout(() => {
      setConfirmText("");
      setError("");
    }, 200);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await profileApi.deleteAccount();
      await signOut();
      window.location.href = ROUTES.home;
    } catch (err) {
      setError((err as Error)?.message || "Could not delete account");
      setDeleting(false);
    }
  };

  const dialog =
    open
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-6"
            onClick={close}
            role="presentation"
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border-light bg-surface-panel p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-error/10 text-accent-error">
                    <AlertTriangle size={16} />
                  </span>
                  <div>
                    <h2 id="delete-account-title" className="text-sm font-bold text-text-primary">
                      Delete your account
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      This signs you out and permanently locks your login. Your profile, bio, and
                      saved details are removed. This can&apos;t be undone.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={close} aria-label="Close" className="shrink-0">
                  <X size={18} className="text-text-muted" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-text-secondary">
                    Type <span className="font-mono font-semibold text-text-primary">{CONFIRM_WORD}</span>{" "}
                    to confirm
                  </span>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={deleting}
                    autoComplete="off"
                    className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary focus:outline-none"
                  />
                </label>

                {error ? <p className="text-xs text-accent-error">{error}</p> : null}

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || confirmText !== CONFIRM_WORD}
                  className="rounded-full bg-accent-error px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Permanently delete my account"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit text-sm font-semibold text-accent-error hover:underline"
      >
        Delete account
      </button>
      {dialog}
    </>
  );
}
