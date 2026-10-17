"use client";

/** A bounded, left-aligned video player for CollabHub submission previews.
 * Submitted content is almost always portrait (Reels/TikTok-style, 9:16) —
 * a plain `w-full` <video> with no height constraint stretches to the
 * video's natural height once metadata loads, which for a 720x1280 clip
 * inside a ~672px-wide card means a ~1195px-tall block blowing out the
 * whole layout. Fixing the frame to a phone-shaped box with object-contain
 * keeps it sane regardless of the clip's actual dimensions. Left-aligned
 * (not centered) so it sits flush with the status badge/buttons around it
 * instead of floating in the middle of a wide card with dead space on both
 * sides. */
export function SubmissionVideoPlayer({ src }: { src: string }) {
  return (
    <div className="w-fit max-w-[220px] overflow-hidden rounded-xl bg-black shadow-sm">
      <video src={src} controls playsInline className="aspect-[9/16] w-[220px] object-contain" />
    </div>
  );
}
