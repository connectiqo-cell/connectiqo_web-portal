"use client";

import { useEffect, useState } from "react";

import { collabHubApi, type Campaign } from "@/lib/api/collabHubApi";

const STATUS_STYLES: Record<Campaign["status"], string> = {
  draft: "bg-surface-chip text-text-muted",
  published: "bg-accent-success/10 text-accent-success",
  closed: "bg-accent-link/10 text-accent-link",
  completed: "bg-accent-link/10 text-accent-link",
  cancelled: "bg-accent-error/10 text-accent-error",
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const rows = await collabHubApi.getAllCampaignsForAdmin();
      setCampaigns(rows);
    } catch (err) {
      setError((err as Error)?.message || "Could not load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Deferred by a microtask so load()'s setState calls aren't synchronous
    // within the effect's own call stack (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      void load();
    });
  }, []);

  const handleCancel = async (campaignId: string) => {
    setBusyId(campaignId);
    try {
      await collabHubApi.setCampaignStatus({ campaignId, status: "cancelled" });
      await load();
    } catch (err) {
      setError((err as Error)?.message || "Could not cancel campaign");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="py-8 text-center text-sm text-text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-2 pt-4">
      {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      {campaigns.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No campaigns yet.</p>
      ) : (
        campaigns.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{c.title}</p>
              <p className="text-xs text-text-muted">
                {c.brand?.name || "Unknown brand"} · ₹{c.budget_per_winner}/winner
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[c.status]}`}>
              {c.status}
            </span>
            {c.status !== "cancelled" ? (
              <button
                type="button"
                onClick={() => handleCancel(c.id)}
                disabled={busyId === c.id}
                className="h-8 shrink-0 rounded-full bg-accent-error/10 px-3 text-xs font-semibold text-accent-error disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
