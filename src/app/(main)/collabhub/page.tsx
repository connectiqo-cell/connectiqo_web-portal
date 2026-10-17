"use client";

import { Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { collabHubApi, type Campaign } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const platforms = campaign.platforms || [];
  const shownPlatforms = platforms.slice(0, 3);
  const extraPlatforms = platforms.length - shownPlatforms.length;

  return (
    <Link
      href={ROUTES.collabHubCampaign(campaign.id)}
      className="group flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 transition-all hover:-translate-y-0.5 hover:border-accent-link/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip ring-1 ring-border-light">
            {campaign.brand?.avatar_url ? (
              <OptimizedImage
                src={campaign.brand.avatar_url}
                alt={campaign.brand?.name || "Brand"}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <Sparkles size={14} className="text-text-muted" />
            )}
          </span>
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-accent-link">
            {campaign.brand?.name || "Brand"}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          ₹{campaign.budget_per_winner}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold leading-snug text-text-primary group-hover:text-accent-link">
          {campaign.title}
        </p>
        <p className="line-clamp-2 text-xs text-text-muted">{campaign.description}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-light pt-3">
        <div className="flex flex-wrap gap-1.5">
          {shownPlatforms.map((p) => (
            <span key={p} className="rounded-full bg-surface-chip px-2 py-0.5 text-[10px] font-medium text-text-secondary">
              {p}
            </span>
          ))}
          {extraPlatforms > 0 ? (
            <span className="rounded-full bg-surface-chip px-2 py-0.5 text-[10px] font-medium text-text-muted">
              +{extraPlatforms}
            </span>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-text-muted">
          <Users size={11} />
          {campaign.winner_count} winner{campaign.winner_count === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}

export default function CollabHubPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await collabHubApi.getPublishedCampaigns();
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
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2 rounded-2xl p-5 text-white" style={{ backgroundImage: "var(--gradient-button-primary)" }}>
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
          <Sparkles size={12} />
          Collab Hub
        </span>
        <h1 className="text-xl font-bold sm:text-2xl">Paid campaigns from real brands</h1>
        <p className="text-sm text-white/80">Apply, create content, get paid — straight into your Connectiqo wallet.</p>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface-chip" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-light py-16 text-center">
          <Sparkles size={28} className="text-text-muted" />
          <p className="text-sm text-text-muted">No active campaigns right now — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </main>
  );
}
