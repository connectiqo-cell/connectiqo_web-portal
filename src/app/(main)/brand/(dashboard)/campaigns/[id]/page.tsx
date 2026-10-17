"use client";

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { SubmissionVideoPlayer } from "@/components/collabhub/SubmissionVideoPlayer";
import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import {
  collabHubApi,
  type Campaign,
  type CampaignApplication,
  type CampaignSubmission,
  type CampaignUnlock,
  type CreatorProfile,
} from "@/lib/api/collabHubApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { openRazorpayCheckout } from "@/lib/utils/razorpayCheckout";

function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

const APPLICATION_STATUS_STYLES: Record<CampaignApplication["status"], string> = {
  pending: "bg-surface-chip text-text-muted",
  shortlisted: "bg-accent-link/10 text-accent-link",
  accepted: "bg-accent-success/10 text-accent-success",
  rejected: "bg-accent-error/10 text-accent-error",
};

const SUBMISSION_STATUS_META: Record<CampaignSubmission["status"], { icon: typeof Clock; label: string; className: string }> = {
  processing: { icon: Loader2, label: "Processing", className: "bg-surface-chip text-text-muted" },
  submitted: { icon: Clock, label: "Awaiting your review", className: "bg-accent-link/10 text-accent-link" },
  revision_requested: { icon: Clock, label: "Revision requested", className: "bg-accent-primary/10 text-accent-primary" },
  approved: { icon: CheckCircle2, label: "Approved", className: "bg-accent-success/10 text-accent-success" },
  rejected: { icon: XCircle, label: "Rejected", className: "bg-accent-error/10 text-accent-error" },
};

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border-light bg-surface-panel py-3">
      <span className={`text-lg font-bold ${accent || "text-text-primary"}`}>{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

function ApplicantCard({
  app,
  submission,
  unlock,
  budgetPerWinner,
  creatorProfile,
  busyId,
  feedbackDrafts,
  setFeedbackDrafts,
  handleDecision,
  handleSubmissionDecision,
  handleUnlockPayment,
  handleDownloadClean,
}: {
  app: CampaignApplication;
  submission?: CampaignSubmission;
  unlock?: CampaignUnlock;
  budgetPerWinner: number;
  creatorProfile?: CreatorProfile;
  busyId: string | null;
  feedbackDrafts: Record<string, string>;
  setFeedbackDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleDecision: (applicationId: string, status: CampaignApplication["status"]) => void;
  handleSubmissionDecision: (submissionId: string, status: "revision_requested" | "approved" | "rejected") => void;
  handleUnlockPayment: (applicationId: string) => void;
  handleDownloadClean: (applicationId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-panel p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip ring-2 ring-surface-panel">
          {app.creator?.avatar_url ? (
            <OptimizedImage
              src={app.creator.avatar_url}
              alt={app.creator.name || "Creator"}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={16} className="text-text-muted" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{app.creator?.name || "Creator"}</p>
          <p className="text-xs text-text-muted">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${APPLICATION_STATUS_STYLES[app.status]}`}>
          {app.status}
        </span>
      </div>

      <Link
        href={ROUTES.mentorProfile(app.creator_id)}
        className="flex w-fit items-center gap-1 text-xs font-semibold text-accent-link hover:underline"
      >
        View full profile, videos & book a call
        <ExternalLink size={11} />
      </Link>
      {creatorProfile &&
      (creatorProfile.follower_count ||
        creatorProfile.primary_platform ||
        creatorProfile.location ||
        creatorProfile.bio ||
        creatorProfile.portfolio_links?.length ||
        (creatorProfile.social_links && Object.keys(creatorProfile.social_links).length)) ? (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-sheet p-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            {creatorProfile.follower_count ? (
              <span className="flex items-center gap-1 font-semibold text-text-primary">
                <Users size={12} />
                {formatFollowerCount(creatorProfile.follower_count)}
                {creatorProfile.primary_platform ? ` on ${creatorProfile.primary_platform}` : " followers"}
              </span>
            ) : creatorProfile.primary_platform ? (
              <span>{creatorProfile.primary_platform}</span>
            ) : null}
            {creatorProfile.location ? (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {creatorProfile.location}
              </span>
            ) : null}
          </div>
          {creatorProfile.bio ? <p className="text-xs text-text-secondary">{creatorProfile.bio}</p> : null}
          {(creatorProfile.portfolio_links?.length || 0) > 0 ||
          (creatorProfile.social_links && Object.keys(creatorProfile.social_links).length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(creatorProfile.social_links || {}).map(([platform, url]) =>
                url ? (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-full border border-border-light px-2.5 py-1 text-[11px] font-medium capitalize text-accent-link hover:bg-surface-chip"
                  >
                    {platform}
                    <ExternalLink size={9} />
                  </a>
                ) : null,
              )}
              {(creatorProfile.portfolio_links || []).map((link, i) => (
                <a
                  key={`${link}-${i}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full border border-border-light px-2.5 py-1 text-[11px] font-medium text-accent-link hover:bg-surface-chip"
                >
                  Portfolio
                  <ExternalLink size={9} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-text-secondary">{app.pitch}</p>

      {app.status === "accepted" || app.status === "shortlisted" ? (
        !submission ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border-light px-3 py-2.5">
            <Clock size={13} className="shrink-0 text-text-muted" />
            <p className="text-xs text-text-muted">Waiting for the creator to submit a video.</p>
          </div>
        ) : (
          (() => {
            const meta = SUBMISSION_STATUS_META[submission.status];
            const StatusIcon = meta.icon;
            return (
              <div className="flex flex-col gap-2.5 rounded-lg border border-border-light bg-surface-sheet p-3">
                <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                  <StatusIcon size={12} className={submission.status === "processing" ? "animate-spin" : ""} />
                  {meta.label}
                </span>
                {submission.watermarked_video_url && submission.status !== "processing" ? (
                  <SubmissionVideoPlayer src={submission.watermarked_video_url} />
                ) : null}
                {submission.status === "submitted" ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={feedbackDrafts[submission.id] || ""}
                      onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                      rows={2}
                      placeholder="Feedback (shown to the creator, e.g. if requesting a revision)"
                      className="rounded-lg border border-border-light bg-surface-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmissionDecision(submission.id, "approved")}
                        disabled={busyId === submission.id}
                        className="h-9 rounded-full bg-accent-success/10 px-4 text-xs font-semibold text-accent-success disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmissionDecision(submission.id, "revision_requested")}
                        disabled={busyId === submission.id}
                        className="h-9 rounded-full border border-border-light px-4 text-xs font-semibold text-text-primary disabled:opacity-60"
                      >
                        Request Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmissionDecision(submission.id, "rejected")}
                        disabled={busyId === submission.id}
                        className="h-9 rounded-full bg-accent-error/10 px-4 text-xs font-semibold text-accent-error disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : submission.status === "approved" ? (
                  unlock ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-semibold text-accent-success">
                        <CheckCircle2 size={13} />
                        Unlocked — ₹{unlock.amount_paid} paid
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadClean(app.id)}
                        disabled={busyId === app.id}
                        className="h-9 rounded-full border border-border-light px-4 text-xs font-semibold text-text-primary disabled:opacity-60"
                      >
                        {busyId === app.id ? "Loading…" : "Download clean video"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-text-muted">
                        Pay ₹{budgetPerWinner} to unlock the clean (non-watermarked) video — this becomes the
                        creator&apos;s earnings.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleUnlockPayment(app.id)}
                        disabled={busyId === app.id}
                        className="flex h-9 w-fit items-center justify-center rounded-full px-4 text-xs font-semibold text-text-on-accent disabled:opacity-60"
                        style={{ backgroundImage: "var(--gradient-button-primary)" }}
                      >
                        {busyId === app.id ? "Processing…" : `Pay ₹${budgetPerWinner} to unlock`}
                      </button>
                    </div>
                  )
                ) : submission.feedback ? (
                  <p className="text-xs text-text-muted">Your feedback: &ldquo;{submission.feedback}&rdquo;</p>
                ) : null}
              </div>
            );
          })()
        )
      ) : null}

      {app.status === "pending" || app.status === "shortlisted" ? (
        <div className="flex gap-2">
          {app.status === "pending" ? (
            <button
              type="button"
              onClick={() => handleDecision(app.id, "shortlisted")}
              disabled={busyId === app.id}
              className="h-9 rounded-full border border-border-light px-4 text-xs font-semibold text-text-primary disabled:opacity-60"
            >
              Shortlist
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => handleDecision(app.id, "accepted")}
            disabled={busyId === app.id}
            className="h-9 rounded-full bg-accent-success/10 px-4 text-xs font-semibold text-accent-success disabled:opacity-60"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => handleDecision(app.id, "rejected")}
            disabled={busyId === app.id}
            className="h-9 rounded-full bg-accent-error/10 px-4 text-xs font-semibold text-accent-error disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function BrandCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const { user, profile } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, CampaignSubmission>>({});
  const [unlocks, setUnlocks] = useState<Record<string, CampaignUnlock>>({});
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, CreatorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const [c, apps, subs, unlockRows] = await Promise.all([
        collabHubApi.getCampaign(campaignId),
        collabHubApi.getApplicationsForCampaign(campaignId),
        collabHubApi.getSubmissionsForCampaign(campaignId),
        collabHubApi.getUnlocksForCampaign(campaignId),
      ]);
      setCampaign(c);
      setApplications(apps);
      setSubmissions(subs);
      setUnlocks(unlockRows);
      const creatorIds = [...new Set(apps.map((a) => a.creator_id))];
      setCreatorProfiles(await collabHubApi.getCreatorProfiles(creatorIds));
    } catch (err) {
      setError((err as Error)?.message || "Could not load campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!campaignId) return;
    // Deferred by a microtask so load()'s setState calls aren't synchronous
    // within the effect's own call stack (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      void load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Keeps the applicant list's own ids current for the submissions realtime
  // filter below without re-subscribing every time applications changes.
  const applicationIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    applicationIdsRef.current = new Set(applications.map((a) => a.id));
  }, [applications]);

  // Live updates so the brand doesn't have to manually refresh to see a new
  // application land, or a submission move from "processing" to "submitted"
  // once watermarking finishes — same channel-per-instance pattern used by
  // the sidebar's unread-messages badge (see DashboardSidebar.tsx).
  const instanceId = useId();
  useEffect(() => {
    if (!campaignId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`brand-campaign-${campaignId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_applications", filter: `campaign_id=eq.${campaignId}` },
        () => void load(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_submissions" }, (payload) => {
        const row = (payload.new ?? payload.old) as { application_id?: string } | null;
        if (row?.application_id && applicationIdsRef.current.has(row.application_id)) void load();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaign_unlocks", filter: `campaign_id=eq.${campaignId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, instanceId]);

  const handleDecision = async (applicationId: string, status: CampaignApplication["status"]) => {
    setBusyId(applicationId);
    setError("");
    try {
      await collabHubApi.setApplicationStatus({ applicationId, status });
      await load();
    } catch (err) {
      setError((err as Error)?.message || "Could not update application");
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmissionDecision = async (
    submissionId: string,
    status: "revision_requested" | "approved" | "rejected",
  ) => {
    setBusyId(submissionId);
    setError("");
    try {
      await collabHubApi.setSubmissionStatus({ submissionId, status, feedback: feedbackDrafts[submissionId] });
      await load();
    } catch (err) {
      setError((err as Error)?.message || "Could not update submission");
    } finally {
      setBusyId(null);
    }
  };

  // CollabHub Phase 3: pay to unlock the clean (non-watermarked) video —
  // only reachable once the submission is 'approved' (server re-verifies
  // this too), mirroring MentorVideoLibrary's handleUnlock exactly.
  const handleUnlockPayment = async (applicationId: string) => {
    if (!user) return;
    setBusyId(applicationId);
    setError("");
    try {
      const order = await collabHubApi.createCampaignOrder({ applicationId, brandId: user.id });
      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        amount: order.amount,
        orderId: order.orderId,
        name: "Connectiqo",
        description: `Unlock video — ${order.campaignTitle}`,
        prefill: { name: profile?.name || undefined, email: profile?.email || user.email || undefined },
      });
      await collabHubApi.verifyCampaignPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
        applicationId,
        brandId: user.id,
      });
      await load();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "PAYMENT_CANCELLED") {
        setError((err as Error)?.message || "Could not unlock the video");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadClean = async (applicationId: string) => {
    setBusyId(applicationId);
    setError("");
    try {
      const url = await collabHubApi.getCleanVideoUrl(applicationId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error)?.message || "Could not get the download link");
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async () => {
    if (!campaign) return;
    try {
      await collabHubApi.setCampaignStatus({ campaignId: campaign.id, status: "published" });
      void load();
    } catch (err) {
      setError((err as Error)?.message || "Could not publish campaign");
    }
  };

  const handleClose = async () => {
    if (!campaign) return;
    if (!window.confirm("Close this campaign? It will stop accepting new applications and disappear from Collab Hub.")) return;
    try {
      await collabHubApi.setCampaignStatus({ campaignId: campaign.id, status: "closed" });
      void load();
    } catch (err) {
      setError((err as Error)?.message || "Could not close campaign");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-32 animate-pulse rounded-2xl bg-surface-chip" />
        <div className="h-20 animate-pulse rounded-xl bg-surface-chip" />
      </div>
    );
  }
  if (!campaign) return <p className="text-sm text-accent-error">Campaign not found.</p>;
  if (campaign.brand_id !== user?.id) return <p className="text-sm text-accent-error">Not authorized.</p>;

  // A shortlisted applicant who has already submitted a video has moved past
  // "needs a shortlist/accept/reject decision" — it belongs alongside
  // accepted creators where the video itself gets reviewed, even though the
  // brand hasn't made a final accept/reject call yet.
  const needsReview = applications.filter(
    (a) => a.status === "pending" || (a.status === "shortlisted" && !submissions[a.id]),
  );
  const inProduction = applications.filter(
    (a) => a.status === "accepted" || a.status === "rejected" || (a.status === "shortlisted" && submissions[a.id]),
  );
  const acceptedCount = applications.filter((a) => a.status === "accepted").length;

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-text-primary">{campaign.title}</h2>
          {campaign.status === "draft" ? (
            <button
              type="button"
              onClick={handlePublish}
              className="h-9 shrink-0 rounded-full px-4 text-xs font-semibold text-text-on-accent"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              Publish
            </button>
          ) : campaign.status === "published" ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-accent-success/10 px-2.5 py-1 text-xs font-semibold capitalize text-accent-success">
                {campaign.status}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 rounded-full border border-border-light px-4 text-xs font-semibold text-text-secondary hover:bg-surface-chip"
              >
                Close Campaign
              </button>
            </div>
          ) : (
            <span className="shrink-0 rounded-full bg-surface-chip px-2.5 py-1 text-xs font-semibold capitalize text-text-muted">
              {campaign.status}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">{campaign.description}</p>

        <div className="grid grid-cols-4 gap-2.5">
          <StatTile label="Per Winner" value={`₹${campaign.budget_per_winner}`} />
          <StatTile label="Winners Needed" value={campaign.winner_count} />
          <StatTile label="Applicants" value={applications.length} accent="text-accent-link" />
          <StatTile label="Accepted" value={acceptedCount} accent="text-accent-success" />
        </div>
      </div>

      {needsReview.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-muted">
            <Users size={13} />
            New Applicants ({needsReview.length})
          </h3>
          <div className="flex flex-col gap-2">
            {needsReview.map((app) => (
              <ApplicantCard
                key={app.id}
                app={app}
                submission={submissions[app.id]}
                unlock={unlocks[app.id]}
                budgetPerWinner={campaign.budget_per_winner}
                creatorProfile={creatorProfiles[app.creator_id]}
                busyId={busyId}
                feedbackDrafts={feedbackDrafts}
                setFeedbackDrafts={setFeedbackDrafts}
                handleDecision={handleDecision}
                handleSubmissionDecision={handleSubmissionDecision}
                handleUnlockPayment={handleUnlockPayment}
                handleDownloadClean={handleDownloadClean}
              />
            ))}
          </div>
        </div>
      ) : null}

      {inProduction.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-muted">
            <IndianRupee size={13} />
            In Production ({inProduction.length})
          </h3>
          <div className="flex flex-col gap-2">
            {inProduction.map((app) => (
              <ApplicantCard
                key={app.id}
                app={app}
                submission={submissions[app.id]}
                unlock={unlocks[app.id]}
                budgetPerWinner={campaign.budget_per_winner}
                creatorProfile={creatorProfiles[app.creator_id]}
                busyId={busyId}
                feedbackDrafts={feedbackDrafts}
                setFeedbackDrafts={setFeedbackDrafts}
                handleDecision={handleDecision}
                handleSubmissionDecision={handleSubmissionDecision}
                handleUnlockPayment={handleUnlockPayment}
                handleDownloadClean={handleDownloadClean}
              />
            ))}
          </div>
        </div>
      ) : null}

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-light py-16 text-center">
          <Users size={24} className="text-text-muted" />
          <p className="text-sm text-text-muted">No applications yet.</p>
        </div>
      ) : null}
    </div>
  );
}
