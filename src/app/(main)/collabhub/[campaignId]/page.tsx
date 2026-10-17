"use client";

import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  IndianRupee,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { collabHubApi, type Campaign, type CampaignApplication } from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";

function DetailRow({ icon: Icon, label, value }: { icon: typeof Target; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border-light bg-surface-sheet p-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-link/10 text-accent-link">
        <Icon size={14} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
        <span className="text-sm leading-snug text-text-secondary">{value}</span>
      </div>
    </div>
  );
}

const APPLICATION_STATUS: Record<
  CampaignApplication["status"],
  { icon: typeof Clock; label: string; className: string }
> = {
  pending: { icon: Clock, label: "Application pending review", className: "border-border-light bg-surface-chip text-text-secondary" },
  shortlisted: { icon: Clock, label: "You've been shortlisted — you can submit your video", className: "border-accent-link/25 bg-accent-link/5 text-accent-link" },
  accepted: { icon: CheckCircle2, label: "You're accepted — submit your video", className: "border-accent-success/25 bg-accent-success/10 text-accent-success" },
  rejected: { icon: XCircle, label: "Not selected this time", className: "border-accent-error/25 bg-accent-error/10 text-accent-error" },
};

function formatDeadline(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-56 animate-pulse rounded-2xl bg-surface-chip" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface-chip" />
      </main>
    );
  }
  if (!campaign) return <p className="py-16 text-center text-sm text-accent-error">Campaign not found.</p>;

  const deadline = formatDeadline(campaign.application_deadline);
  const platforms = campaign.platforms?.filter(Boolean) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.collabHub} className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
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

      <div className="overflow-hidden rounded-2xl border border-border-light bg-surface-panel shadow-sm">
        {campaign.cover_image_url ? (
          <div
            className="h-40 w-full bg-surface-chip bg-cover bg-center sm:h-52"
            style={{ backgroundImage: `url(${campaign.cover_image_url})` }}
            role="img"
            aria-label={campaign.title}
          />
        ) : null}
        <div className="flex items-start gap-3 px-5 pb-6 pt-5" style={{ backgroundImage: "var(--gradient-button-primary)" }}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90 ring-2 ring-white/40">
            {campaign.brand?.avatar_url ? (
              <OptimizedImage
                src={campaign.brand.avatar_url}
                alt={campaign.brand?.name || "Brand"}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <Sparkles size={18} className="text-accent-link" />
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{campaign.brand?.name || "Brand"}</p>
            <h1 className="text-xl font-bold leading-tight text-white">{campaign.title}</h1>
            {deadline ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-white/85">
                <CalendarClock size={12} />
                Apply by {deadline}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <p
              className={`whitespace-pre-line text-sm leading-relaxed text-text-secondary ${
                descExpanded ? "" : "line-clamp-4"
              }`}
            >
              {campaign.description}
            </p>
            {campaign.description && campaign.description.length > 220 ? (
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="flex w-fit items-center gap-1 text-xs font-semibold text-accent-link"
              >
                {descExpanded ? "Show less" : "Read more"}
                <ChevronDown size={13} className={`transition-transform ${descExpanded ? "rotate-180" : ""}`} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-success/20 bg-accent-success/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-success/15 text-accent-success">
                <IndianRupee size={16} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Earn per winner</p>
                <p className="text-lg font-bold text-accent-success">₹{campaign.budget_per_winner}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Winners</p>
              <p className="text-lg font-bold text-text-primary">{campaign.winner_count}</p>
            </div>
          </div>

          {campaign.category || campaign.video_duration_seconds || platforms.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {campaign.category ? (
                <span className="rounded-full bg-accent-link/10 px-3 py-1.5 text-xs font-semibold text-accent-link">
                  {campaign.category}
                </span>
              ) : null}
              {campaign.video_duration_seconds ? (
                <span className="flex items-center gap-1.5 rounded-full border border-border-light bg-surface-sheet px-3 py-1.5 text-xs font-medium text-text-secondary">
                  <Clock size={12} className="text-accent-link" />
                  {campaign.video_duration_seconds}s video
                </span>
              ) : null}
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-accent-link/20 bg-accent-link/5 px-3 py-1.5 text-xs font-medium text-accent-link"
                >
                  {platform}
                </span>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2.5 border-t border-border-light pt-4 sm:grid-cols-2">
            <DetailRow icon={Target} label="Objectives" value={campaign.objectives} />
            <DetailRow icon={Video} label="Content Type" value={campaign.content_type} />
            <DetailRow icon={Users} label="Target Audience" value={campaign.target_audience} />
            <DetailRow icon={ShieldCheck} label="Eligibility" value={campaign.eligibility_criteria} />
            <DetailRow icon={FileText} label="Content Usage Rights" value={campaign.content_usage_rights} />
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-accent-error/25 bg-accent-error/10 px-4 py-2.5 text-sm text-accent-error">{error}</p>
      ) : null}

      {application ? (
        (() => {
          const statusInfo = APPLICATION_STATUS[application.status];
          const StatusIcon = statusInfo.icon;
          return (
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm ${statusInfo.className}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60">
                <StatusIcon size={18} />
              </span>
              <p className="text-sm font-semibold">{statusInfo.label}</p>
              {application.status === "accepted" || application.status === "shortlisted" ? (
                <Link
                  href={ROUTES.collabHubApplicationDetail(application.id)}
                  className="ml-auto shrink-0 rounded-full bg-accent-success px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
                >
                  Submit Video
                </Link>
              ) : null}
            </div>
          );
        })()
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5 shadow-sm">
          <p className="text-sm font-bold text-text-primary">Ready to apply?</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Your pitch</span>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Why are you a good fit for this campaign?"
              className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-link/30"
            />
            <span className="self-end text-[11px] text-text-muted">{pitch.length}/500</span>
          </label>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-text-on-accent shadow-sm transition-transform disabled:opacity-60 enabled:hover:scale-[1.01] sm:w-fit sm:px-8"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {applying ? "Applying…" : "Apply to this campaign"}
          </button>
        </div>
      )}
    </main>
  );
}
