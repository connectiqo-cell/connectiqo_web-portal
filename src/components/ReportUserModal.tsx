"use client";

import { Flag, X } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/contexts/AuthContext";
import {
  reportApi,
  USER_REPORT_REASONS,
  type ReportContextType,
  type ReportReason,
} from "@/lib/api/reportApi";

export function ReportUserModal({
  reportedUserId,
  reportedUserName = "this user",
  contextType = "profile",
  contextId,
  variant = "link",
  onBeforeOpen,
}: {
  reportedUserId: string;
  reportedUserName?: string;
  contextType?: ReportContextType;
  contextId?: string;
  /** "link" = text button (default); "icon" = flag for feed; "menu" = call more-menu row */
  variant?: "link" | "icon" | "menu";
  /** e.g. close the call More menu before opening the sheet */
  onBeforeOpen?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetId = String(reportedUserId || "").trim();
  const myId = user?.id != null ? String(user.id) : "";
  if (!user || !targetId || myId === targetId) return null;
  if (contextType !== "profile" && !contextId) return null;

  const title =
    contextType === "video"
      ? "Report this video"
      : contextType === "call"
        ? `Report ${reportedUserName}`
        : `Report ${reportedUserName}`;

  const subtitle =
    contextType === "video"
      ? `This sends a private report about ${reportedUserName}'s video. They will not see who reported it.`
      : contextType === "call"
        ? "This sends a private report about this call participant. The call continues, and they will not see who reported them."
        : "Your report is private. The person you report will not be told who submitted it.";

  const reasonLabel =
    contextType === "video"
      ? "Why are you reporting this video?"
      : contextType === "call"
        ? "Why are you reporting this participant?"
        : "Why are you reporting this user?";

  const openSheet = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onBeforeOpen?.();
    setOpen(true);
  };

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
    if (contextType !== "profile" && !contextId) {
      setError("Missing details for this report.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await reportApi.submitUserReport({
        reportedUserId: targetId,
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

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={openSheet}
        aria-label="Report video"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
      >
        <Flag size={18} />
      </button>
    ) : variant === "menu" ? (
      <button
        type="button"
        onClick={openSheet}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-text-primary"
      >
        <Flag size={16} className="shrink-0 text-accent-error" />
        Report user
      </button>
    ) : (
      <button
        type="button"
        onClick={openSheet}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent-error"
      >
        <Flag size={12} />
        Report
      </button>
    );

  const dialog =
    open && mounted
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
              aria-labelledby="report-modal-title"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 id="report-modal-title" className="text-sm font-bold text-text-primary">
                    {title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{subtitle}</p>
                </div>
                <button type="button" onClick={close} aria-label="Close" className="shrink-0">
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
                  <p className="text-xs font-semibold text-text-secondary">{reasonLabel}</p>
                  <div className="flex flex-col gap-1.5">
                    {USER_REPORT_REASONS.map((r) => (
                      <label
                        key={r.value}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-chip"
                      >
                        <input
                          type="radio"
                          name={`report-reason-${contextType}-${targetId}`}
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
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {trigger}
      {dialog}
    </>
  );
}
