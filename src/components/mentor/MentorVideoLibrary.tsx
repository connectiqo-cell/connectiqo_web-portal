"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Play,
  Sparkles,
  Video as VideoIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import OptimizedImage from "@/components/OptimizedImage";
import { videoLibraryApi, type MentorVideo } from "@/lib/api/videoLibraryApi";
import { useHorizontalScroll } from "@/lib/hooks/useHorizontalScroll";
import { ROUTES } from "@/lib/routes";
import { openRazorpayCheckout } from "@/lib/utils/razorpayCheckout";

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Lifetime access";
  return `Access until ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

function VideoRow({
  title,
  variant,
  videos,
  playingId,
  isUnlocked,
  onPlayToggle,
  onLockedClick,
}: {
  title: string;
  variant: "locked" | "free";
  videos: MentorVideo[];
  playingId: string | null;
  isUnlocked: boolean;
  onPlayToggle: (id: string) => void;
  onLockedClick: () => void;
}) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll(
    videos,
    "[data-mentor-video-card]",
  );

  if (videos.length === 0) return null;

  const isFree = variant === "free";

  return (
    <div className="flex flex-col gap-3">
      <h3
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
          isFree ? "text-accent-success" : "text-accent-link"
        }`}
      >
        {isFree ? <Sparkles size={13} /> : <Lock size={13} />}
        {title}
      </h3>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((video) => {
            const canPlay = isFree || isUnlocked;
            const isPlaying = playingId === video.id;

            return (
              <button
                key={video.id}
                data-mentor-video-card
                type="button"
                onClick={() => (canPlay ? onPlayToggle(video.id) : onLockedClick())}
                className="flex w-40 shrink-0 flex-col gap-2 text-left sm:w-44"
              >
                <div
                  className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-meeting-canvas ${
                    isFree
                      ? "ring-1 ring-accent-success/30"
                      : canPlay
                        ? "ring-1 ring-accent-link/30"
                        : "ring-1 ring-border-light"
                  }`}
                >
                  {isPlaying && canPlay ? (
                    <video src={video.video_url} controls autoPlay className="h-full w-full object-cover" />
                  ) : (
                    <>
                      {video.thumbnail_url ? (
                        <OptimizedImage src={video.thumbnail_url} alt={video.title} width={320} height={180} className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <VideoIcon size={24} className="text-text-muted" />
                      )}
                      {isFree ? (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-success/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          FREE
                        </span>
                      ) : null}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        {canPlay ? (
                          <Play size={22} className="fill-white text-white" />
                        ) : (
                          <Lock size={20} className="text-white" />
                        )}
                      </span>
                    </>
                  )}
                </div>
                <p className="truncate text-xs font-medium text-text-secondary">{video.title}</p>
              </button>
            );
          })}
        </div>

        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute -left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border-light bg-surface-panel text-text-secondary shadow-sm hover:text-text-primary"
          >
            <ChevronLeft size={16} />
          </button>
        ) : null}
        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute -right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border-light bg-surface-panel text-text-secondary shadow-sm hover:text-text-primary"
          >
            <ChevronRight size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function MentorVideoLibrary({
  mentorId,
  mentorName,
  unlockPrice,
}: {
  mentorId: string;
  mentorName: string;
  unlockPrice: number | null;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isOwnProfile = user?.id === mentorId;

  const [videos, setVideos] = useState<MentorVideo[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  const refreshUnlockStatus = async () => {
    if (!user || user.id === mentorId) return;
    const status = await videoLibraryApi
      .checkUnlocked({ learnerId: user.id, mentorId })
      .catch(() => ({ unlocked: false, expiresAt: null }));
    setUnlocked(status.unlocked);
    setExpiresAt(status.expiresAt);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await videoLibraryApi.getMentorVideos(mentorId).catch(() => []);
      if (cancelled) return;
      setVideos(rows);

      if (user && user.id !== mentorId) {
        const status = await videoLibraryApi
          .checkUnlocked({ learnerId: user.id, mentorId })
          .catch(() => ({ unlocked: false, expiresAt: null }));
        if (!cancelled) {
          setUnlocked(status.unlocked);
          setExpiresAt(status.expiresAt);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mentorId, user]);

  const handleUnlock = async () => {
    // A mentor viewing their own profile already has full access — never
    // let them pay themselves for their own video library.
    if (isOwnProfile) return;
    if (!user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.mentorProfile(mentorId))}`);
      return;
    }
    setUnlocking(true);
    setError("");
    try {
      const order = await videoLibraryApi.createVideoOrder({ mentorId, learnerId: user.id });
      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        amount: order.amount,
        orderId: order.orderId,
        name: "Connectiqo",
        description: `Video library — ${mentorName}`,
        prefill: { name: profile?.name || undefined, email: profile?.email || user.email || undefined },
      });
      await videoLibraryApi.verifyVideoSubscription({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
        mentorId,
        learnerId: user.id,
      });
      await refreshUnlockStatus();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "PAYMENT_CANCELLED") {
        setError((err as Error)?.message || "Could not unlock the video library");
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (loading || videos.length === 0) return null;

  const memberVideos = videos.filter((v) => !v.is_free);
  const previewVideos = videos.filter((v) => v.is_free);
  const hasLockedVideos = memberVideos.length > 0;

  const handlePlayToggle = (id: string) => {
    setPlayingId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Videos ({videos.length})
        </h2>
        {isOwnProfile ? (
          <span className="rounded-full border border-border-light bg-surface-chip px-3 py-1 text-xs font-semibold text-text-secondary">
            Your channel
          </span>
        ) : unlocked && hasLockedVideos ? (
          <span className="flex items-center gap-1.5 rounded-full border border-accent-success/40 bg-accent-success/10 px-3 py-1 text-xs font-semibold text-accent-success">
            <CheckCircle2 size={14} />
            Unlocked · {formatExpiry(expiresAt)}
          </span>
        ) : !unlocked && hasLockedVideos && unlockPrice ? (
          <button
            type="button"
            onClick={handleUnlock}
            disabled={unlocking}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {unlocking ? "Processing…" : `Unlock all — ₹${unlockPrice} / 30 days`}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <VideoRow
        title="Members Only"
        variant="locked"
        videos={memberVideos}
        playingId={playingId}
        isUnlocked={unlocked || isOwnProfile}
        onPlayToggle={handlePlayToggle}
        onLockedClick={handleUnlock}
      />

      <VideoRow
        title="Free Preview Videos"
        variant="free"
        videos={previewVideos}
        playingId={playingId}
        isUnlocked={unlocked || isOwnProfile}
        onPlayToggle={handlePlayToggle}
        onLockedClick={handleUnlock}
      />
    </div>
  );
}
