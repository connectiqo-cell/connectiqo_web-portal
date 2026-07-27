"use client";

import { Circle } from "lucide-react";

export function RecordingConsentModal({
  requesterName,
  onAgree,
  onDecline,
}: {
  requesterName: string;
  onAgree: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-surface-panel p-6 text-center shadow-xl">
        <Circle size={28} className="text-accent-error" fill="currentColor" />
        <h2 className="text-lg font-bold text-text-primary">Recording request</h2>
        <p className="text-sm text-text-secondary">
          {requesterName} wants to record this session. Do you agree?
        </p>
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-full border border-border-light px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-text-on-accent"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}
