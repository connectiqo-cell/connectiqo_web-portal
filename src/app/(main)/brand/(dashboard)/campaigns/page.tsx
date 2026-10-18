"use client";

import {
  CalendarClock,
  ChevronRight,
  IndianRupee,
  type LucideIcon,
  Megaphone,
  Pencil,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { deadlineLabel, getCategoryStyle, isCampaignClosed } from "@/components/collabhub/campaignDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type Campaign } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

// What the brand actually needs to know, rather than the raw DB status: a
// "published" campaign past its application deadline is no longer collecting
// applicants — it's in review.
type DisplayStatus = "live" | "reviewing" | "draft" | "ended";

const STATUS_META: Record<DisplayStatus, { label: string; className: string; dot: string }> = {
  live: { label: "Live", className: "bg-accent-success/10 text-accent-success", dot: "bg-accent-success" },
  reviewing: { label: "Reviewing", className: "bg-accent-warning/10 text-accent-warning", dot: "bg-accent-warning" },
  draft: { label: "Draft", className: "bg-surface-chip text-text-muted", dot: "bg-text-muted" },
  ended: { label: "Ended", className: "bg-accent-link/10 text-accent-link", dot: "bg-accent-link" },
};

const RAW_STATUS_LABEL: Partial<Record<Campaign["status"], string>> = {
  closed: "Closed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function displayStatus(c: Campaign): DisplayStatus {
  if (c.status === "draft") return "draft";
  if (c.status === "published") return isCampaignClosed(c) ? "reviewing" : "live";
  return "ended";
}

const TABS: { key: "all" | DisplayStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "reviewing", label: "Reviewing" },
  { key: "draft", label: "Drafts" },
  { key: "ended", label: "Ended" },
];

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "brand" | "success";
}) {
  const toneClass = tone === "success" ? "bg-accent-success/10 text-accent-success" : "bg-accent-soft text-accent-link";
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="truncate text-2xl font-bold tracking-tight text-text-primary">{value}</p>
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const status = displayStatus(campaign);
  const statusMeta = STATUS_META[status];
  const statusLabel = status === "ended" ? RAW_STATUS_LABEL[campaign.status] || statusMeta.label : statusMeta.label;
  const style = getCategoryStyle(campaign.category);
  const CategoryIcon = style.icon;
  const deadline = status === "live" ? deadlineLabel(campaign.application_deadline) : null;
  const applicants = campaign.application_count || 0;

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-3 transition-all hover:-translate-y-0.5 hover:border-accent-link/30 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-surface-chip ring-1 ring-border-light sm:aspect-[16/10] sm:w-36">
        {campaign.cover_image_url ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${campaign.cover_image_url})` }}
            role="img"
            aria-label={campaign.title}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundImage: style.gradient }}>
            <CategoryIcon size={26} className="text-white/85" strokeWidth={1.5} />
          </div>
        )}
        <span
          className={`absolute left-2 top-2 flex items-center gap-1 rounded-full bg-surface-panel/90 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm sm:hidden ${statusMeta.className}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
          {statusLabel}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          {/* Stretched link: the whole card opens the campaign; the Edit button sits above it. */}
          <Link
            href={ROUTES.brandCampaign(campaign.id)}
            className="line-clamp-2 text-base font-semibold leading-snug text-text-primary after:absolute after:inset-0 after:rounded-2xl group-hover:text-accent-link"
          >
            {campaign.title}
          </Link>
          <span className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:flex ${statusMeta.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {campaign.category ? (
            <span className="flex items-center gap-1 rounded-full bg-surface-chip px-2 py-0.5 font-medium text-text-secondary">
              <CategoryIcon size={11} />
              {campaign.category}
            </span>
          ) : null}
          <span className="flex items-center gap-0.5 rounded-full bg-accent-success/10 px-2 py-0.5 font-semibold text-accent-success">
            <IndianRupee size={11} strokeWidth={2.5} />
            {campaign.budget_per_winner.toLocaleString("en-IN")} × {campaign.winner_count} winner
            {campaign.winner_count === 1 ? "" : "s"}
          </span>
          {deadline ? (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                deadline.urgent ? "bg-accent-error/10 text-accent-error" : "bg-surface-chip text-text-secondary"
              }`}
            >
              <CalendarClock size={11} />
              {deadline.text}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border-light pt-3 sm:border-0 sm:pt-0">
        <span
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
            applicants ? "bg-accent-soft text-accent-link" : "bg-surface-chip text-text-muted"
          }`}
        >
          <Users size={14} />
          {applicants}
          <span className="font-medium">applicant{applicants === 1 ? "" : "s"}</span>
        </span>
        <Link
          href={ROUTES.brandCampaignEdit(campaign.id)}
          aria-label="Edit campaign"
          title="Edit campaign"
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-text-secondary transition-colors hover:bg-surface-chip hover:text-text-primary"
        >
          <Pencil size={14} />
        </Link>
        <ChevronRight
          size={18}
          className="ml-auto text-text-muted transition-transform group-hover:translate-x-0.5 sm:ml-0"
        />
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function BrandCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [tab, setTab] = useState<"all" | DisplayStatus>("all");

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

  const counts: Record<"all" | DisplayStatus, number> = { all: campaigns.length, live: 0, reviewing: 0, draft: 0, ended: 0 };
  for (const c of campaigns) counts[displayStatus(c)] += 1;
  const totalApplicants = campaigns.reduce((sum, c) => sum + (c.application_count || 0), 0);
  // Rewards on offer across campaigns creators can still win (live or in review).
  const activeRewards = campaigns
    .filter((c) => c.status === "published")
    .reduce((sum, c) => sum + c.budget_per_winner * c.winner_count, 0);

  const filtered = tab === "all" ? campaigns : campaigns.filter((c) => displayStatus(c) === tab);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Megaphone} label="Campaigns" value={String(campaigns.length)} />
        <StatCard icon={Sparkles} label="Live now" value={String(counts.live)} tone="success" />
        <StatCard icon={Users} label="Applicants" value={String(totalApplicants)} />
        <StatCard icon={Wallet} label="Active rewards" value={`₹${activeRewards.toLocaleString("en-IN")}`} tone="success" />
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-chip" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-link/10 text-accent-link">
            <Megaphone size={24} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-text-primary">Launch your first campaign</p>
            <p className="text-sm text-text-muted">Post a brief, get pitches from creators, and pay only for the video you pick.</p>
          </div>
          <Link
            href={ROUTES.brandCampaignNew}
            className="mt-1 flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-text-on-accent"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <Plus size={15} />
            New Campaign
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div role="tablist" aria-label="Filter campaigns" className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(key);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-transparent bg-accent-primary text-text-on-accent"
                      : "border-border-light bg-surface-panel text-text-secondary hover:border-border-default hover:text-text-primary"
                  }`}
                >
                  {label}
                  <span
                    className={`min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold ${
                      active ? "bg-white/20 text-text-on-accent" : "bg-surface-chip text-text-muted"
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border-light py-10 text-center text-sm text-text-muted">
              No campaigns here.
            </p>
          ) : (
            filtered.slice(0, visibleCount).map((c) => <CampaignRow key={c.id} campaign={c} />)
          )}

          {visibleCount < filtered.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="rounded-xl border border-border-light py-2.5 text-sm font-semibold text-accent-link hover:bg-surface-chip"
            >
              Load more
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
