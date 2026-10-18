"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Clapperboard,
  Clock,
  IndianRupee,
  type LucideIcon,
  MapPin,
  Send,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { deadlineLabel, formatFollowers, getCategoryStyle } from "@/components/collabhub/campaignDisplay";
import OptimizedImage from "@/components/OptimizedImage";
import { collabHubApi, type Campaign } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

const HOW_IT_WORKS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Send, title: "Apply", text: "Pitch yourself to the brand" },
  { icon: UserCheck, title: "Get accepted", text: "The brand picks its creators" },
  { icon: Clapperboard, title: "Create video", text: "Submit your content" },
  { icon: BadgeCheck, title: "Get selected", text: "Brand approves the winner" },
  { icon: Wallet, title: "Get paid", text: "Straight to your wallet" },
];

function BrandAvatar({ campaign, size }: { campaign: Campaign; size: number }) {
  const name = campaign.brand?.name || "Brand";
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-panel text-xs font-bold text-text-primary ring-2 ring-surface-panel"
      style={{ width: size, height: size }}
    >
      {campaign.brand?.avatar_url ? (
        <OptimizedImage
          src={campaign.brand.avatar_url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const style = getCategoryStyle(campaign.category);
  const CategoryIcon = style.icon;
  const deadline = deadlineLabel(campaign.application_deadline);

  const meta: { icon: LucideIcon; text: string }[] = [];
  if (campaign.video_duration_seconds) meta.push({ icon: Clock, text: `${campaign.video_duration_seconds}s video` });
  if (campaign.min_followers) meta.push({ icon: Users, text: `${formatFollowers(campaign.min_followers)} followers` });
  if (campaign.location) meta.push({ icon: MapPin, text: campaign.location });

  return (
    <Link
      href={ROUTES.collabHubCampaign(campaign.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-panel transition-all hover:-translate-y-0.5 hover:border-accent-link/40 hover:shadow-lg"
    >
      <div className="relative">
        {/* Clipping lives on this inner box so the brand avatar can overhang the image edge. */}
        <div className="aspect-[16/10] overflow-hidden">
          {campaign.cover_image_url ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${campaign.cover_image_url})` }}
              role="img"
              aria-label={campaign.title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundImage: style.gradient }}>
              <CategoryIcon size={32} className="text-white/85" strokeWidth={1.5} />
            </div>
          )}
        </div>
        {campaign.category ? (
          <span className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1 truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <CategoryIcon size={10} className="shrink-0" />
            <span className="truncate">{campaign.category}</span>
          </span>
        ) : null}
        <div className="absolute -bottom-4 left-3">
          <BrandAvatar campaign={campaign} size={32} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-6">
        <div className="flex flex-col gap-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-accent-link">
            {campaign.brand?.name || "Brand"}
          </p>
          <p className="line-clamp-2 text-sm font-bold leading-snug text-text-primary group-hover:text-accent-link">
            {campaign.title}
          </p>
        </div>

        {meta.length || deadline ? (
          <div className="flex flex-wrap gap-1">
            {deadline ? (
              <span
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  deadline.urgent ? "bg-accent-error/10 text-accent-error" : "bg-surface-chip text-text-secondary"
                }`}
              >
                <CalendarClock size={10} />
                {deadline.text}
              </span>
            ) : null}
            {meta.map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1 rounded-full bg-surface-chip px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
              >
                <Icon size={10} />
                {text}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-light pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">Earn per winner</span>
            <span className="flex items-center text-base font-bold text-accent-success">
              <IndianRupee size={14} strokeWidth={2.5} />
              {campaign.budget_per_winner.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
              <Users size={11} />
              {campaign.winner_count} winner{campaign.winner_count === 1 ? "" : "s"}
            </span>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-on-accent transition-transform group-hover:translate-x-0.5"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const PAGE_SIZE = 12;

export default function CollabHubPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-border-light bg-surface-panel p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        />
        <div className="relative flex max-w-xl flex-col gap-4">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent-link/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-link">
            <Sparkles size={12} />
            Collab Hub
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-text-primary sm:text-4xl">
            Turn your content into{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-button-primary)" }}>
              paid collabs
            </span>
          </h1>
          <p className="text-sm text-text-secondary sm:text-base">
            Apply to campaigns from real brands, create the video, and get paid straight into your Connectiqo wallet.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#campaigns"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent shadow-sm"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              Explore campaigns
              <ArrowRight size={15} />
            </a>
            <Link
              href={ROUTES.collabHubApplications}
              className="flex items-center gap-2 rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-chip"
            >
              My applications
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">How it works</h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl border border-border-light bg-surface-panel p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-link/10 text-accent-link">
                <Icon size={17} />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-text-primary">
                  {i + 1}. {title}
                </span>
                <span className="text-xs text-text-muted">{text}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="campaigns" className="flex scroll-mt-24 flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-text-primary">Open campaigns</h2>
          {!loading && campaigns.length ? (
            <span className="text-sm text-text-muted">
              {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-chip" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-light py-16 text-center">
            <Sparkles size={28} className="text-text-muted" />
            <p className="text-sm text-text-muted">No active campaigns right now — check back soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {campaigns.slice(0, visibleCount).map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
            {visibleCount < campaigns.length ? (
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
      </section>
    </main>
  );
}
