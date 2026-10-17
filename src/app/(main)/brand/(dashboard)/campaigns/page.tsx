"use client";

import { IndianRupee, Megaphone, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type Campaign } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

const STATUS_STYLES: Record<Campaign["status"], string> = {
  draft: "bg-surface-chip text-text-muted",
  published: "bg-accent-success/10 text-accent-success",
  closed: "bg-accent-link/10 text-accent-link",
  completed: "bg-accent-link/10 text-accent-link",
  cancelled: "bg-accent-error/10 text-accent-error",
};

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number; accent?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-link/10 ${accent || "text-accent-link"}`}>
        <Icon size={17} />
      </span>
      <div>
        <p className="text-lg font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function BrandCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await collabHubApi.getCampaignsByBrand(user.id);
        if (!cancelled) setCampaigns(rows);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load campaigns");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Keeps a live-lookup set of this brand's own campaign ids, so the
  // realtime handler below can ignore events for other brands' campaigns
  // without needing a per-campaign subscription (campaign_applications has
  // no brand_id column directly — see the migration comment).
  const campaignIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    campaignIdsRef.current = new Set(campaigns.map((c) => c.id));
  }, [campaigns]);

  // Live-updates the applicant counts without a manual reload.
  const instanceId = useId();
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`brand-campaigns-${user.id}-${instanceId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "campaign_applications" }, (payload) => {
        const row = payload.new as { campaign_id?: string };
        if (row?.campaign_id && campaignIdsRef.current.has(row.campaign_id)) {
          collabHubApi.getCampaignsByBrand(user.id).then(setCampaigns).catch(() => {});
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, instanceId]);

  const publishedCount = campaigns.filter((c) => c.status === "published").length;
  const totalApplicants = campaigns.reduce((sum, c) => sum + (c.application_count || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-3 gap-2.5 sm:max-w-md">
          <StatCard icon={Megaphone} label="Campaigns" value={campaigns.length} />
          <StatCard icon={Sparkles} label="Live" value={publishedCount} accent="text-accent-success" />
          <StatCard icon={Users} label="Applicants" value={totalApplicants} />
        </div>
        <Link
          href={ROUTES.brandCampaignNew}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-text-on-accent transition-transform hover:scale-[1.02]"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          <Plus size={16} />
          New Campaign
        </Link>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-chip" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-light py-16 text-center">
          <Users size={28} className="text-text-muted" />
          <p className="text-sm text-text-muted">No campaigns yet. Create one to start finding creators.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={ROUTES.brandCampaign(c.id)}
              className="group flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-accent-link/30 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-link/10 text-accent-link">
                <Megaphone size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary group-hover:text-accent-link">{c.title}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <IndianRupee size={11} />
                    {c.budget_per_winner}/winner
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {c.application_count || 0} applicant{c.application_count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[c.status]}`}>
                {c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
