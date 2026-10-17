"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileVideo,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { SubmissionVideoPlayer } from "@/components/collabhub/SubmissionVideoPlayer";
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

const STATUS_META: Record<
  CampaignSubmission["status"],
  { icon: typeof Clock; title: string; body: string; className: string }
> = {
  processing: {
    icon: Loader2,
    title: "Processing…",
    body: "We're watermarking your video — this can take a minute.",
    className: "border-border-light bg-surface-chip text-text-secondary",
  },
  submitted: {
    icon: Clock,
    title: "Submitted",
    body: "Waiting for the brand to review your video.",
    className: "border-accent-link/25 bg-accent-link/5 text-accent-link",
  },
  revision_requested: {
    icon: RefreshCw,
    title: "Revision requested",
    body: "The brand asked for changes — see their feedback below.",
    className: "border-accent-primary/25 bg-accent-primary/5 text-accent-primary",
  },
  approved: {
    icon: CheckCircle2,
    title: "Approved!",
    body: "The brand approved your video. Payment is next on their side.",
    className: "border-accent-success/25 bg-accent-success/10 text-accent-success",
  },
  rejected: {
    icon: XCircle,
    title: "Not selected",
    body: "The brand didn't approve this submission.",
    className: "border-accent-error/25 bg-accent-error/10 text-accent-error",
  },
};

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const app = await collabHubApi.getApplicationById(applicationId);
      setApplication(app);
      if (app?.status === "accepted" || app?.status === "shortlisted") {
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
      // The upload + DB row creation may have already succeeded even though
      // watermarking failed — re-fetch so the UI reflects the real (stuck)
      // state instead of staying on stale data, and so canSubmit below
      // correctly re-offers a retry.
      const sub = await collabHubApi.getSubmissionForApplication(applicationId).catch(() => null);
      setSubmission(sub);
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-40 animate-pulse rounded-2xl bg-surface-chip" />
      </main>
    );
  }
  if (!application) return <p className="py-16 text-center text-sm text-accent-error">Application not found.</p>;
  if (application.creator_id !== user?.id) return <p className="py-16 text-center text-sm text-accent-error">Not authorized.</p>;

  // "processing" is included here too: a prior attempt whose watermark step
  // failed leaves the row stuck there (see handleUpload's catch above), and
  // without this a creator would have no way to retry.
  const canSubmit =
    (application.status === "accepted" || application.status === "shortlisted") &&
    (!submission || submission.status === "revision_requested" || submission.status === "processing");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link href={ROUTES.collabHubApplications} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back to My Applications
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-text-primary">{application.campaign?.title || "Campaign"}</h1>
        <p className="text-sm text-text-secondary">
          Application status: <span className="capitalize">{application.status}</span>
        </p>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {application.status !== "accepted" && application.status !== "shortlisted" ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-light py-12 text-center">
          <Clock size={24} className="text-text-muted" />
          <p className="max-w-xs text-sm text-text-muted">
            {application.status === "pending"
              ? "You'll be able to submit a video once the brand shortlists or accepts your application."
              : "This application wasn't accepted."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {submission ? (
            (() => {
              const meta = STATUS_META[submission.status];
              const StatusIcon = meta.icon;
              return (
                <div className={`flex flex-col gap-3 rounded-2xl border p-4 ${meta.className}`}>
                  <div className="flex items-center gap-2.5">
                    <StatusIcon size={18} className={submission.status === "processing" ? "animate-spin" : ""} />
                    <div>
                      <p className="text-sm font-bold">{meta.title}</p>
                      <p className="text-xs opacity-90">
                        {submission.status === "approved" && unlock
                          ? `Paid! The brand unlocked this video for ₹${unlock.amount_paid} — now in your wallet.`
                          : meta.body}
                      </p>
                    </div>
                  </div>
                  {submission.feedback ? (
                    <p className="rounded-lg bg-surface-panel px-3 py-2 text-sm text-text-secondary">
                      &ldquo;{submission.feedback}&rdquo;
                    </p>
                  ) : null}
                  {submission.watermarked_video_url && submission.status !== "processing" ? (
                    <SubmissionVideoPlayer src={submission.watermarked_video_url} />
                  ) : null}
                  {submission.status === "approved" && unlock ? (
                    <button
                      type="button"
                      onClick={handleDownloadClean}
                      disabled={downloading}
                      className="flex h-10 w-fit items-center justify-center rounded-full px-4 text-sm font-semibold text-text-on-accent disabled:opacity-60"
                      style={{ backgroundImage: "var(--gradient-button-primary)" }}
                    >
                      {downloading ? "Loading…" : "Download your clean video"}
                    </button>
                  ) : null}
                </div>
              );
            })()
          ) : null}

          {canSubmit ? (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border-light bg-surface-panel p-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {submission ? "Resubmit your video" : "Submit your video"}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border-light bg-surface-sheet px-4 py-3 text-left hover:border-border-default disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-link/10 text-accent-link">
                    <FileVideo size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {file ? file.name : "Choose a video file"}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {file ? formatFileSize(file.size) : `MP4, MOV, or WebM — up to ${MAX_VIDEO_MB} MB`}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary">
                    Browse
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    if (picked && picked.size > MAX_VIDEO_MB * 1024 * 1024) {
                      setError(`Video must be under ${MAX_VIDEO_MB} MB`);
                      setFile(null);
                      return;
                    }
                    setError("");
                    setFile(picked);
                  }}
                  className="hidden"
                />
              </label>

              {uploading ? (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-chip">
                  <div
                    className="h-full rounded-full bg-accent-link transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex h-11 w-fit items-center justify-center rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                {uploading
                  ? uploadProgress < 100
                    ? `Uploading… ${uploadProgress}%`
                    : "Watermarking your video…"
                  : "Submit Video"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
