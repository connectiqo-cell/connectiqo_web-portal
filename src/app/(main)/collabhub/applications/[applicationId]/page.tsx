"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileVideo,
  IndianRupee,
  Loader2,
  Quote,
  RefreshCw,
  Search,
  UploadCloud,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { SubmissionVideoPlayer } from "@/components/collabhub/SubmissionVideoPlayer";
import { getCategoryStyle } from "@/components/collabhub/campaignDisplay";
import { useAuth } from "@/contexts/AuthContext";
import {
  collabHubApi,
  type CampaignApplication,
  type CampaignSubmission,
  type CampaignUnlock,
} from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

const MAX_VIDEO_MB = 200;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Event timestamps (applied, reviewed, paid) in the viewer's local day. */
function formatEventDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_META: Record<
  CampaignSubmission["status"],
  { icon: typeof Clock; title: string; body: string; className: string; iconClassName: string }
> = {
  processing: {
    icon: Loader2,
    title: "Processing…",
    body: "We're watermarking your video — this page updates itself when it's done.",
    className: "border-border-light bg-surface-panel",
    iconClassName: "bg-surface-chip text-text-secondary",
  },
  submitted: {
    icon: Clock,
    title: "In review",
    body: "Waiting for the brand to review your video.",
    className: "border-border-light bg-surface-panel",
    iconClassName: "bg-accent-soft text-accent-link",
  },
  revision_requested: {
    icon: RefreshCw,
    title: "Revision requested",
    body: "The brand asked for changes — see their feedback and resubmit below.",
    className: "border-accent-warning/30 bg-accent-warning/5",
    iconClassName: "bg-accent-warning/15 text-accent-warning",
  },
  approved: {
    icon: CheckCircle2,
    title: "Approved!",
    body: "The brand approved your video.",
    className: "border-accent-success/30 bg-accent-success/5",
    iconClassName: "bg-accent-success/15 text-accent-success",
  },
  rejected: {
    icon: XCircle,
    title: "Not selected",
    body: "The brand didn't approve this submission.",
    className: "border-accent-error/30 bg-accent-error/5",
    iconClassName: "bg-accent-error/15 text-accent-error",
  },
};

type Tone = "brand" | "success" | "warning" | "error";

const TONE_BADGE: Record<Tone, string> = {
  brand: "bg-accent-soft text-accent-link",
  success: "bg-accent-success/10 text-accent-success",
  warning: "bg-accent-warning/10 text-accent-warning",
  error: "bg-accent-error/10 text-accent-error",
};

const TONE_DOT: Record<Tone, string> = {
  brand: "bg-accent-link",
  success: "bg-accent-success",
  warning: "bg-accent-warning",
  error: "bg-accent-error",
};

/** One headline status for the whole application, furthest stage first. */
function overallStatus(
  application: CampaignApplication,
  submission: CampaignSubmission | null,
  unlock: CampaignUnlock | null,
): { label: string; tone: Tone } {
  if (application.status === "rejected") return { label: "Not selected", tone: "error" };
  if (application.status === "pending") return { label: "Under review", tone: "warning" };
  if (unlock) return { label: "Paid", tone: "success" };
  if (submission?.status === "approved") return { label: "Approved", tone: "success" };
  if (submission?.status === "rejected") return { label: "Not selected", tone: "error" };
  if (submission?.status === "revision_requested") return { label: "Revision requested", tone: "warning" };
  if (submission) return { label: "Video in review", tone: "brand" };
  return application.status === "shortlisted"
    ? { label: "Shortlisted", tone: "brand" }
    : { label: "Accepted", tone: "success" };
}

type StepState = "done" | "current" | "upcoming" | "failed";
type Step = { label: string; date: string | null; state: StepState };

function buildSteps(
  application: CampaignApplication,
  submission: CampaignSubmission | null,
  unlock: CampaignUnlock | null,
): Step[] {
  const decided = application.status === "accepted" || application.status === "shortlisted";
  const submitted = !!submission && submission.status !== "processing";
  const approved = submission?.status === "approved";

  const steps: Step[] = [
    { label: "Applied", date: formatEventDate(application.applied_at), state: "done" },
    {
      label: application.status === "rejected" ? "Not selected" : application.status === "shortlisted" ? "Shortlisted" : "Accepted",
      date: application.status === "pending" ? null : formatEventDate(application.decided_at),
      state: application.status === "rejected" ? "failed" : decided ? "done" : "upcoming",
    },
    {
      label: "Submitted",
      date: submitted ? formatEventDate(submission?.submitted_at) : null,
      state: submitted ? "done" : "upcoming",
    },
    {
      label:
        submission?.status === "rejected"
          ? "Not selected"
          : submission?.status === "revision_requested"
            ? "Revision"
            : "Approved",
      date:
        submission?.status === "approved" || submission?.status === "rejected"
          ? formatEventDate(submission.reviewed_at)
          : null,
      state: approved ? "done" : submission?.status === "rejected" ? "failed" : "upcoming",
    },
    { label: "Paid", date: formatEventDate(unlock?.unlocked_at), state: unlock ? "done" : "upcoming" },
  ];

  // The first step still waiting on something is where the creator is now.
  if (!steps.some((s) => s.state === "failed")) {
    const next = steps.find((s) => s.state === "upcoming");
    if (next) next.state = "current";
  }
  return steps;
}

function ProgressTracker({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex items-start rounded-2xl border border-border-light bg-surface-panel px-3 py-5 sm:px-6">
      {steps.map((step, i) => {
        const prevDone = i > 0 && steps[i - 1].state === "done";
        return (
          <li key={step.label + i} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            {i > 0 ? (
              <span
                aria-hidden
                className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                  prevDone && step.state !== "upcoming" ? "bg-accent-primary" : "bg-border-light"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step.state === "done"
                  ? "bg-accent-primary text-text-on-accent"
                  : step.state === "current"
                    ? "border-2 border-accent-primary bg-surface-panel text-accent-link ring-4 ring-accent-soft"
                    : step.state === "failed"
                      ? "bg-accent-error text-white"
                      : "border-2 border-border-light bg-surface-panel text-text-muted"
              }`}
            >
              {step.state === "done" ? <Check size={15} strokeWidth={3} /> : step.state === "failed" ? <X size={15} strokeWidth={3} /> : i + 1}
            </span>
            <span className="flex flex-col">
              <span
                className={`text-[11px] font-semibold sm:text-xs ${
                  step.state === "upcoming" ? "text-text-muted" : step.state === "failed" ? "text-accent-error" : "text-text-primary"
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-text-muted sm:text-[11px]">
                {step.date || (step.state === "current" ? "Now" : " ")}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function BrandAvatar({ name, avatarUrl, className }: { name: string; avatarUrl: string | null | undefined; className: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-bold text-accent-link ${className}`}>
      {avatarUrl ? (
        <OptimizedImage src={avatarUrl} alt={name} width={64} height={64} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function ApplicationSubmissionPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<CampaignApplication | null>(null);
  const [submission, setSubmission] = useState<CampaignSubmission | null>(null);
  const [unlock, setUnlock] = useState<CampaignUnlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const app = await collabHubApi.getApplicationById(applicationId);
      setApplication(app);
      if (app?.status === "shortlisted" || app?.status === "accepted") {
        const sub = await collabHubApi.getSubmissionForApplication(applicationId);
        setSubmission(sub);
        if (sub?.status === "approved") {
          setUnlock(await collabHubApi.getCampaignUnlock(applicationId));
        }
      }
    } catch (err) {
      setError((err as Error)?.message || "Could not load application");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClean = async () => {
    setDownloading(true);
    setError("");
    try {
      const url = await collabHubApi.getCleanVideoUrl(applicationId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error)?.message || "Could not get the download link");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!applicationId) return;
    // Deferred by a microtask so load()'s setState calls aren't synchronous
    // within the effect's own call stack (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      void load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // Live updates so the creator sees a brand's decision — accepted,
  // approved, revision requested — the moment it happens, and sees the
  // "processing" -> "submitted" flip once watermarking finishes, without
  // needing to manually reload. Same per-instance channel-naming pattern as
  // the sidebar's unread-messages badge (see DashboardSidebar.tsx).
  const instanceId = useId();
  useEffect(() => {
    if (!applicationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`collabhub-application-${applicationId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_applications", filter: `id=eq.${applicationId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_submissions", filter: `application_id=eq.${applicationId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_unlocks", filter: `application_id=eq.${applicationId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, instanceId]);

  // Uploading large video over a slow connection can take a while — warn
  // before an accidental tab close/refresh throws away the in-progress
  // upload (the component's progress state doesn't survive a reload).
  useEffect(() => {
    if (!uploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [uploading]);

  // Shared by the file picker and drag-and-drop.
  const pickFile = (picked: File | null) => {
    if (picked && !picked.type.startsWith("video/")) {
      setError("Please choose a video file");
      setFile(null);
      return;
    }
    if (picked && picked.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video must be under ${MAX_VIDEO_MB} MB`);
      setFile(null);
      return;
    }
    setError("");
    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");
    try {
      const sub = await collabHubApi.submitVideo({
        applicationId,
        creatorId: user.id,
        file,
        onProgress: setUploadProgress,
      });
      setSubmission(sub);
      setFile(null);
    } catch (err) {
      setError((err as Error)?.message || "Could not submit video");
      // The upload may have landed even though the row write failed — re-fetch
      // so the UI shows the real state rather than stale data.
      const sub = await collabHubApi.getSubmissionForApplication(applicationId).catch(() => null);
      setSubmission(sub);
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-56 animate-pulse rounded-3xl bg-surface-chip" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface-chip" />
      </main>
    );
  }
  if (!application) return <p className="py-16 text-center text-sm text-accent-error">Application not found.</p>;
  if (application.creator_id !== user?.id) return <p className="py-16 text-center text-sm text-accent-error">Not authorized.</p>;

  // Shortlist is the single stage that unlocks video upload — 'accepted' is
  // kept around only for rows decided before this change. A 'processing' row
  // re-offers the upload only when the worker recorded a failure; otherwise
  // it is simply still in flight.
  const canSubmit =
    (application.status === "shortlisted" || application.status === "accepted") &&
    (!submission
      || submission.status === "revision_requested"
      || (submission.status === "processing" && !!submission.watermark_error));

  const campaign = application.campaign;
  const brandName = campaign?.brand?.name || "The brand";
  const categoryStyle = getCategoryStyle(campaign?.category ?? null);
  const CategoryIcon = categoryStyle.icon;
  const status = overallStatus(application, submission, unlock);
  const steps = buildSteps(application, submission, unlock);
  const decided = application.status === "accepted" || application.status === "shortlisted";
  const showVideo = !!submission?.watermarked_video_url && submission.status !== "processing";
  const winnerCount = campaign?.winner_count ?? 1;

  const statusCard = submission
    ? (() => {
        const meta = STATUS_META[submission.status];
        const StatusIcon = meta.icon;
        return (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${meta.className}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconClassName}`}>
              <StatusIcon size={18} className={submission.status === "processing" ? "animate-spin" : ""} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold text-text-primary">{meta.title}</p>
              <p className="text-sm text-text-secondary">{meta.body}</p>
              {submission.watermark_error ? (
                <p className="mt-2 rounded-lg bg-accent-error/10 px-3 py-2 text-xs text-accent-error">
                  Watermarking failed: {submission.watermark_error} — it retries on its own, or
                  upload again below.
                </p>
              ) : null}
            </div>
          </div>
        );
      })()
    : null;

  const feedbackCard = submission?.feedback ? (
    <div className="relative overflow-hidden rounded-2xl border border-border-light bg-surface-panel p-4 pl-5">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent-primary" />
      <div className="flex items-center gap-2.5">
        <BrandAvatar name={brandName} avatarUrl={campaign?.brand?.avatar_url} className="h-8 w-8 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">Message from {brandName}</p>
          {formatEventDate(submission.reviewed_at) ? (
            <p className="text-xs text-text-muted">{formatEventDate(submission.reviewed_at)}</p>
          ) : null}
        </div>
        <Quote size={18} className="shrink-0 text-accent-primary/40" />
      </div>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-text-primary">{submission.feedback}</p>
    </div>
  ) : null;

  const paymentCard =
    submission?.status === "approved" ? (
      unlock ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-accent-success/30 bg-surface-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent-success">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-success text-white">
              <Check size={14} strokeWidth={3} />
            </span>
            Payment received
          </div>
          <div>
            <p className="flex items-center text-4xl font-bold tracking-tight text-text-primary">
              <IndianRupee size={30} strokeWidth={2.5} />
              {unlock.amount_paid.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Added to your wallet{formatEventDate(unlock.unlocked_at) ? ` on ${formatEventDate(unlock.unlocked_at)}` : ""}.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadClean}
              disabled={downloading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-text-on-accent shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {downloading ? "Preparing…" : "Download clean video"}
            </button>
            <Link
              href={ROUTES.wallet}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-border-default px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-chip"
            >
              <Wallet size={15} />
              View wallet
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border-default bg-surface-panel p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-link">
            <Clock size={18} />
          </span>
          <div>
            <p className="text-base font-bold text-text-primary">Waiting for payment</p>
            <p className="text-sm text-text-secondary">
              You&apos;ll be paid
              {campaign?.budget_per_winner ? ` ₹${campaign.budget_per_winner.toLocaleString("en-IN")}` : ""} once{" "}
              {brandName === "The brand" ? "the brand" : brandName} unlocks this video.
            </p>
          </div>
        </div>
      )
    ) : null;

  const uploadCard = canSubmit ? (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-5">
      <div>
        <p className="text-base font-bold text-text-primary">{submission ? "Resubmit your video" : "Submit your video"}</p>
        <p className="text-sm text-text-secondary">
          {submission?.status === "revision_requested"
            ? "Upload a new version that addresses the brand's feedback."
            : "Upload your final video. The brand sees a watermarked preview until they pay."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) pickFile(e.dataTransfer.files?.[0] || null);
        }}
        disabled={uploading}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          dragging ? "border-accent-primary bg-accent-soft" : "border-border-default bg-surface-sheet hover:border-accent-primary/60"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-link">
          {file ? <FileVideo size={22} /> : <UploadCloud size={22} />}
        </span>
        {file ? (
          <span className="flex min-w-0 max-w-full flex-col">
            <span className="truncate text-sm font-semibold text-text-primary">{file.name}</span>
            <span className="text-xs text-text-muted">{formatFileSize(file.size)} · click to change</span>
          </span>
        ) : (
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              Drag your video here, or <span className="text-accent-link">browse</span>
            </span>
            <span className="text-xs text-text-muted">MP4, MOV or WebM · up to {MAX_VIDEO_MB} MB</span>
          </span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => pickFile(e.target.files?.[0] || null)}
        className="hidden"
      />

      <ul className="flex flex-col gap-1.5 text-xs text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-4">
        {["Vertical 9:16 works best", `Under ${MAX_VIDEO_MB} MB`, "Follow the campaign brief"].map((tip) => (
          <li key={tip} className="flex items-center gap-1.5">
            <Check size={13} className="text-accent-success" strokeWidth={3} />
            {tip}
          </li>
        ))}
      </ul>

      {uploading ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-chip">
          <div className="h-full rounded-full bg-accent-primary transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent shadow-sm disabled:opacity-60 sm:w-fit"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : null}
        {uploading
          ? uploadProgress < 100
            ? `Uploading… ${uploadProgress}%`
            : "Watermarking your video…"
          : "Submit Video"}
      </button>
    </div>
  ) : null;

  // A rejected submission is a dead end otherwise — every other end state on
  // this page (application-rejected, paid) gives the creator a clear next
  // step; this didn't.
  const browseMoreCard =
    submission?.status === "rejected" ? (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-default bg-surface-panel px-6 py-8 text-center">
        <p className="text-sm text-text-secondary">
          This brand went with another creator — there are plenty more campaigns looking for someone like you.
        </p>
        <Link
          href={ROUTES.collabHub}
          className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-text-on-accent shadow-sm"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Browse other campaigns
          <ArrowRight size={15} />
        </Link>
      </div>
    ) : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={ROUTES.collabHubApplications}
        className="flex w-fit items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to My Applications
      </Link>

      {/* Campaign header */}
      <section className="overflow-hidden rounded-3xl border border-border-light bg-surface-panel">
        <div className="relative h-28 sm:h-36">
          {campaign?.cover_image_url ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${campaign.cover_image_url})` }}
              role="img"
              aria-label={campaign.title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-end px-8" style={{ backgroundImage: categoryStyle.gradient }}>
              <CategoryIcon size={64} className="text-white/25" strokeWidth={1.25} />
            </div>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>

        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
          <div className="flex min-w-0 flex-col gap-3">
            <BrandAvatar
              name={brandName}
              avatarUrl={campaign?.brand?.avatar_url}
              className="-mt-8 h-16 w-16 text-xl ring-4 ring-surface-panel"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-secondary">{brandName}</p>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">{campaign?.title || "Campaign"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${TONE_BADGE[status.tone]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[status.tone]}`} />
                {status.label}
              </span>
              {campaign?.category ? (
                <span className="flex items-center gap-1 rounded-full bg-surface-chip px-2.5 py-1 font-medium text-text-secondary">
                  <CategoryIcon size={12} />
                  {campaign.category}
                </span>
              ) : null}
              {campaign?.budget_per_winner ? (
                <span className="flex items-center gap-0.5 rounded-full bg-accent-success/10 px-2.5 py-1 font-semibold text-accent-success">
                  <IndianRupee size={11} strokeWidth={2.5} />
                  {campaign.budget_per_winner.toLocaleString("en-IN")} × {winnerCount} winner{winnerCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
          {campaign?.id ? (
            <Link
              href={ROUTES.collabHubCampaign(campaign.id)}
              className="flex h-10 w-fit shrink-0 items-center gap-1.5 rounded-full border border-border-default px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-chip"
            >
              View campaign brief
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      </section>

      <ProgressTracker steps={steps} />

      {error ? (
        <p className="rounded-xl border border-accent-error/30 bg-accent-error/5 px-4 py-3 text-sm text-accent-error">{error}</p>
      ) : null}

      {!decided ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-default bg-surface-panel px-6 py-14 text-center">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              application.status === "pending" ? "bg-accent-soft text-accent-link" : "bg-surface-chip text-text-muted"
            }`}
          >
            {application.status === "pending" ? <Clock size={26} /> : <Search size={26} />}
          </span>
          <div className="flex max-w-sm flex-col gap-1">
            <p className="text-base font-bold text-text-primary">
              {application.status === "pending" ? `${brandName} is reviewing pitches` : "Not selected this time"}
            </p>
            <p className="text-sm text-text-secondary">
              {application.status === "pending"
                ? `You applied on ${formatEventDate(application.applied_at)}. You'll be able to submit a video once the brand shortlists or accepts your application.`
                : "This brand went with other creators — there are plenty more campaigns looking for someone like you."}
            </p>
          </div>
          {application.status !== "pending" ? (
            <Link
              href={ROUTES.collabHub}
              className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-text-on-accent shadow-sm"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              Browse other campaigns
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      ) : showVideo ? (
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <figure className="flex flex-col gap-2">
            <SubmissionVideoPlayer src={submission!.watermarked_video_url!} />
            <figcaption className="text-xs text-text-muted">
              Watermarked preview{formatEventDate(submission!.submitted_at) ? ` · submitted ${formatEventDate(submission!.submitted_at)}` : ""}
            </figcaption>
          </figure>
          <div className="flex min-w-0 flex-col gap-4">
            {statusCard}
            {feedbackCard}
            {paymentCard}
            {uploadCard}
            {browseMoreCard}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {statusCard}
          {feedbackCard}
          {uploadCard}
          {browseMoreCard}
        </div>
      )}
    </main>
  );
}
