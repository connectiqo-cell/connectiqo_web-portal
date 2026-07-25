"use client";

import { Flag, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  reportApi,
  USER_REPORT_REASONS,
  type ReportContextType,
  type ReportReason,
} from "@/lib/api/reportApi";

export function ReportUserModal({
  reportedUserId,
  contextType = "profile",
  contextId,
}: {
  reportedUserId: string;
  contextType?: ReportContextType;
  contextId?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!user || user.id === reportedUserId) return null;

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setReason("");
      setDetails("");
      setError("");
      setSubmitted(false);
    }, 200);
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError("Choose a reason.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await reportApi.submitUserReport({
        reportedUserId,
        reason,
        details,
        contextType,
        contextId: contextId ?? null,
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as Error)?.message || "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent-error"
      >
        <Flag size={12} />
        Report
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-border-light bg-surface-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">Report user</h2>
              <button type="button" onClick={close} aria-label="Close">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-text-secondary">
                  Thanks — our team will review this report.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="self-end rounded-full bg-accent-link/15 px-4 py-2 text-xs font-semibold text-accent-link"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {USER_REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-chip"
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Additional details (optional)"
                  className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />

                {error ? <p className="text-xs text-accent-error">{error}</p> : null}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full bg-accent-error px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit report"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
