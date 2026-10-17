"use client";

import { CheckCircle2, ClipboardList, Clock, IndianRupee, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type CampaignApplication } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

const STATUS_META: Record<CampaignApplication["status"], { icon: typeof Clock; className: string }> = {
  pending: { icon: Clock, className: "bg-surface-chip text-text-muted" },
  shortlisted: { icon: Clock, className: "bg-accent-link/10 text-accent-link" },
  accepted: { icon: CheckCircle2, className: "bg-accent-success/10 text-accent-success" },
  rejected: { icon: XCircle, className: "bg-accent-error/10 text-accent-error" },
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const rows = await collabHubApi.getMyApplications(user.id).catch(() => []);
      if (!cancelled) setApplications(rows);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Live updates — a brand accepting/rejecting an application shows up here
  // immediately instead of needing a manual reload.
  const instanceId = useId();
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`collabhub-my-applications-${user.id}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_applications", filter: `creator_id=eq.${user.id}` },
        () => {
          collabHubApi.getMyApplications(user.id).then(setApplications).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, instanceId]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">My Applications</h1>
        <p className="mt-1 text-sm text-text-secondary">Track your Collab Hub campaign applications</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-chip" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-light py-16 text-center">
          <ClipboardList size={28} className="text-text-muted" />
          <p className="text-sm text-text-muted">
            No applications yet.{" "}
            <Link href={ROUTES.collabHub} className="font-semibold text-accent-link">
              Browse campaigns
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {applications.map((app) => {
            const meta = STATUS_META[app.status];
            const StatusIcon = meta.icon;
            return (
              <Link
                key={app.id}
                href={ROUTES.collabHubApplicationDetail(app.id)}
                className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 transition-colors hover:bg-surface-chip"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                  <StatusIcon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{app.campaign?.title || "Campaign"}</p>
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    <IndianRupee size={11} />
                    {app.campaign?.budget_per_winner ?? 0} · Applied {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${meta.className}`}>
                  {app.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
