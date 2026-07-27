"use client";

import { Lock, Play, Video as VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { videoLibraryApi, type MentorVideo } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";
import { openRazorpayCheckout } from "@/lib/utils/razorpayCheckout";

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
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await videoLibraryApi.getMentorVideos(mentorId).catch(() => []);
      if (cancelled) return;
      setVideos(rows);

      if (user && user.id !== mentorId) {
        const isUnlocked = await videoLibraryApi
          .checkUnlocked({ learnerId: user.id, mentorId })
          .catch(() => false);
        if (!cancelled) setUnlocked(isUnlocked);
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
      setUnlocked(true);
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

  const renderGrid = (list: MentorVideo[]) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {list.map((video) => {
        const canPlay = video.is_free || unlocked || isOwnProfile;
        const isPlaying = playingId === video.id;

        return (
          <div key={video.id} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => (canPlay ? setPlayingId(isPlaying ? null : video.id) : handleUnlock())}
              className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-meeting-canvas"
            >
              {isPlaying && canPlay ? (
                <video src={video.video_url} controls autoPlay className="h-full w-full object-cover" />
              ) : (
                <>
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover opacity-80"
                    />
                  ) : (
                    <VideoIcon size={24} className="text-text-muted" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    {canPlay ? (
                      <Play size={22} className="fill-white text-white" />
                    ) : (
                      <Lock size={20} className="text-white" />
                    )}
                  </span>
                </>
              )}
            </button>
            <p className="truncate text-xs font-medium text-text-secondary">{video.title}</p>
          </div>
        );
      })}
    </div>
  );

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

      {memberVideos.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Members Only
          </h3>
          {renderGrid(memberVideos)}
        </div>
      ) : null}

      {previewVideos.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Free Preview Videos
          </h3>
          {renderGrid(previewVideos)}
        </div>
      ) : null}
    </div>
  );
}
