"use client";

import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  IndianRupee,
  type LucideIcon,
  MapPin,
  Share2,
  ShieldCheck,
  Target,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  deadlineLabel,
  formatFollowers,
  formatShortDate,
  getCategoryStyle,
  isCampaignClosed,
  textLines,
} from "@/components/collabhub/campaignDisplay";
import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type Campaign, type CampaignApplication } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

function BriefSection({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  const lines = value ? textLines(value) : [];
  if (!lines.length) return null;
  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-link/10 text-accent-link">
        <Icon size={15} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</h3>
        {lines.length > 1 ? (
          <ul className="flex list-disc flex-col gap-1 pl-4 text-sm leading-relaxed text-text-secondary marker:text-accent-link">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-text-secondary">{lines[0]}</p>
        )}
      </div>
    </div>
  );
}

function FactTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border-light bg-surface-sheet p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-link/10 text-accent-link">
        <Icon size={15} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
        <span className="truncate text-sm font-semibold text-text-primary">{value}</span>
      </div>
    </div>
  );
}

function RewardCard({ campaign }: { campaign: Campaign }) {
  const deadline = deadlineLabel(campaign.application_deadline);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-accent-success/20 bg-accent-success/5 p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Earn per winner</span>
          <span className="flex items-center text-3xl font-extrabold text-accent-success">
            <IndianRupee size={24} strokeWidth={2.5} />
            {campaign.budget_per_winner.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Winners</span>
          <span className="flex items-center gap-1 text-xl font-bold text-text-primary">
            <Users size={16} className="text-text-muted" />
            {campaign.winner_count}
          </span>
        </div>
      </div>
      {deadline ? (
        <span
          className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            deadline.urgent ? "bg-accent-error/10 text-accent-error" : "bg-surface-chip text-text-secondary"
          }`}
        >
          <CalendarClock size={12} />
          {deadline.text}
        </span>
      ) : null}
    </div>
  );
}

const APPLICATION_STATUS: Record<
  CampaignApplication["status"],
  { icon: typeof Clock; label: string; className: string }
> = {
  pending: { icon: Clock, label: "Application pending review", className: "border-border-light bg-surface-chip text-text-secondary" },
  shortlisted: { icon: Clock, label: "You've been shortlisted — waiting on the brand to confirm", className: "border-accent-link/25 bg-accent-link/5 text-accent-link" },
  accepted: { icon: CheckCircle2, label: "You're accepted — submit your video", className: "border-accent-success/25 bg-accent-success/10 text-accent-success" },
  rejected: { icon: XCircle, label: "Not selected this time", className: "border-accent-error/25 bg-accent-error/10 text-accent-error" },
};

export default function CollabHubCampaignDetailPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params.campaignId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [application, setApplication] = useState<CampaignApplication | null>(null);
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await collabHubApi.getCampaign(campaignId);
        if (cancelled) return;
        setCampaign(c);
        if (user) {
          const app = await collabHubApi.getMyApplication({ campaignId, creatorId: user.id });
          if (!cancelled) setApplication(app);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load campaign");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, user]);

  const handleApply = async () => {
    if (!user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.collabHubCampaign(campaignId))}`);
      return;
    }
    if (!pitch.trim()) {
      setError("Tell the brand why you're a good fit.");
      return;
    }
    setApplying(true);
    setError("");
    try {
      await collabHubApi.applyToCampaign({ campaignId, creatorId: user.id, pitch: pitch.trim() });
      const app = await collabHubApi.getMyApplication({ campaignId, creatorId: user.id });
      setApplication(app);
    } catch (err) {
      setError((err as Error)?.message || "Could not submit application");
    } finally {
      setApplying(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-64 animate-pulse rounded-3xl bg-surface-chip" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse rounded-2xl bg-surface-chip" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-chip" />
        </div>
      </main>
    );
  }
  if (!campaign) return <p className="py-16 text-center text-sm text-accent-error">Campaign not found.</p>;

  const categoryStyle = getCategoryStyle(campaign.category);
  const CategoryIcon = categoryStyle.icon;
  const closed = isCampaignClosed(campaign);
  const brandName = campaign.brand?.name || "Brand";

  const facts: { icon: LucideIcon; label: string; value: string }[] = [];
  if (campaign.video_duration_seconds) facts.push({ icon: Clock, label: "Video length", value: `${campaign.video_duration_seconds} sec` });
  if (campaign.min_followers) facts.push({ icon: Users, label: "Min followers", value: formatFollowers(campaign.min_followers) });
  if (campaign.location) facts.push({ icon: MapPin, label: "Location", value: campaign.location });
  if (campaign.submission_deadline) facts.push({ icon: CalendarCheck, label: "Submit video by", value: formatShortDate(campaign.submission_deadline) });
  const platforms = campaign.platforms?.filter(Boolean) ?? [];
  if (platforms.length) facts.push({ icon: Video, label: "Platforms", value: platforms.join(", ") });

  // Rendered in two places (inline on mobile, sticky sidebar on desktop) — only
  // the mobile copy gets the textarea id the "Apply now" bar focuses.
  const renderApplyPanel = (pitchId?: string) =>
    application ? (
    (() => {
      const statusInfo = APPLICATION_STATUS[application.status];
      const StatusIcon = statusInfo.icon;
      return (
        <div className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm ${statusInfo.className}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60">
              <StatusIcon size={18} />
            </span>
            <p className="text-sm font-semibold">{statusInfo.label}</p>
          </div>
          {application.status === "accepted" || application.status === "shortlisted" ? (
            <Link
              href={ROUTES.collabHubApplicationDetail(application.id)}
              className="flex h-10 items-center justify-center rounded-full bg-accent-success px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
            >
              Submit Video
            </Link>
          ) : null}
        </div>
      );
    })()
  ) : closed ? (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-light bg-surface-panel p-5 text-center">
      <CalendarClock size={22} className="text-text-muted" />
      <p className="text-sm font-semibold text-text-primary">Applications are closed</p>
      <p className="text-xs text-text-muted">This campaign is no longer accepting new creators.</p>
    </div>
  ) : (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-bold text-text-primary">Ready to apply?</p>
        <p className="text-xs text-text-muted">Tell {brandName} why you&apos;re the right creator for this.</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Your pitch</span>
        <textarea
          id={pitchId}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          rows={5}
          maxLength={500}
          placeholder="Your niche, audience, and an idea for the video…"
          className="resize-none rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-link/30"
        />
        <span className="self-end text-[11px] text-text-muted">{pitch.length}/500</span>
      </label>
      {error ? (
        <p className="rounded-xl border border-accent-error/25 bg-accent-error/10 px-3 py-2 text-xs text-accent-error">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={handleApply}
        disabled={applying}
        className="flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-text-on-accent shadow-sm transition-transform disabled:opacity-60 enabled:hover:scale-[1.01]"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {applying ? "Applying…" : user ? "Apply to this campaign" : "Log in to apply"}
      </button>
    </div>
  );

  const showMobileApplyBar = !application && !closed;

  return (
    <main
      className={`mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 ${
        showMobileApplyBar ? "pb-28 lg:pb-8" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <Link
          href={ROUTES.collabHub}
          className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back to Collab Hub
        </Link>
        <button
          type="button"
          onClick={() => navigator.share?.({ title: campaign.title, url: window.location.href }).catch(() => {})}
          aria-label="Share"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-text-muted transition-colors hover:bg-surface-chip hover:text-text-primary"
        >
          <Share2 size={15} />
        </button>
      </div>

      <header className="relative h-56 overflow-hidden rounded-3xl border border-border-light sm:h-72">
        {campaign.cover_image_url ? (
          <div
            className="absolute inset-0 bg-surface-chip bg-cover bg-center"
            style={{ backgroundImage: `url(${campaign.cover_image_url})` }}
            role="img"
            aria-label={campaign.title}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundImage: categoryStyle.gradient }}
          >
            <CategoryIcon size={72} className="-translate-y-8 text-white/70" strokeWidth={1.25} />
          </div>
        )}
        {/* Dark scrim keeps the overlaid title readable on any cover image. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        {campaign.category ? (
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <CategoryIcon size={12} />
            {campaign.category}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-gray-900 ring-2 ring-white/50 sm:h-14 sm:w-14">
            {campaign.brand?.avatar_url ? (
              <OptimizedImage
                src={campaign.brand.avatar_url}
                alt={brandName}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              brandName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/80">{brandName}</p>
            <h1 className="line-clamp-2 text-xl font-bold leading-tight text-white sm:text-2xl">{campaign.title}</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="lg:hidden">
            <RewardCard campaign={campaign} />
          </div>

          {campaign.description ? (
            <section className="flex flex-col gap-2 rounded-2xl border border-border-light bg-surface-panel p-5">
              <h2 className="text-base font-bold text-text-primary">About this campaign</h2>
              <p
                className={`whitespace-pre-line text-sm leading-relaxed text-text-secondary ${
                  descExpanded ? "" : "line-clamp-4"
                }`}
              >
                {textLines(campaign.description).join("\n")}
              </p>
              {campaign.description.length > 220 ? (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="flex w-fit items-center gap-1 text-xs font-semibold text-accent-link"
                >
                  {descExpanded ? "Show less" : "Read more"}
                  <ChevronDown size={13} className={`transition-transform ${descExpanded ? "rotate-180" : ""}`} />
                </button>
              ) : null}
            </section>
          ) : null}

          {facts.length ? (
            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {facts.map((f) => (
                <FactTile key={f.label} {...f} />
              ))}
            </section>
          ) : null}

          {campaign.objectives ||
          campaign.content_type ||
          campaign.target_audience ||
          campaign.eligibility_criteria ||
          campaign.content_usage_rights ? (
            <section className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-5">
              <h2 className="text-base font-bold text-text-primary">Campaign brief</h2>
              <div className="flex flex-col divide-y divide-border-light">
                <BriefSection icon={Target} label="Objectives" value={campaign.objectives} />
                <BriefSection icon={Video} label="Content type" value={campaign.content_type} />
                <BriefSection icon={Users} label="Target audience" value={campaign.target_audience} />
                <BriefSection icon={ShieldCheck} label="Eligibility" value={campaign.eligibility_criteria} />
                <BriefSection icon={FileText} label="Content usage rights" value={campaign.content_usage_rights} />
              </div>
            </section>
          ) : null}

          <div id="apply" className="scroll-mt-24 lg:hidden">
            {renderApplyPanel("pitch")}
          </div>
        </div>

        <aside className="hidden flex-col gap-4 lg:sticky lg:top-24 lg:flex">
          <RewardCard campaign={campaign} />
          {renderApplyPanel()}
        </aside>
      </div>

      {showMobileApplyBar ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border-light bg-surface-panel/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Earn per winner</span>
            <span className="flex items-center text-lg font-bold text-accent-success">
              <IndianRupee size={16} strokeWidth={2.5} />
              {campaign.budget_per_winner.toLocaleString("en-IN")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
              document.getElementById("pitch")?.focus({ preventScroll: true });
            }}
            className="flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-text-on-accent shadow-sm"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            Apply now
          </button>
        </div>
      ) : null}
    </main>
  );
}
