"use client";

import { Heart, Pause, Play, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Testimonial } from "@/lib/api/testimonialApi";

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = testimonials[currentIndex];

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  if (!testimonials.length) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-16">
      {/* Section Header */}
      <div className="mb-8 sm:mb-12 text-center">
        <div className="inline-flex px-4 py-2 rounded-full bg-accent-link/10 border border-accent-link/30 mb-4">
          <span className="text-sm font-semibold text-accent-link">✨ User Testimonials</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
          See What Our Community Says
        </h2>
        <p className="mt-3 text-base text-text-secondary">Real people, real connections</p>
      </div>

      {/* Testimonial Cards */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="space-y-4">
            {/* Video Card */}
            <div className="relative group">
              <div className="relative overflow-hidden rounded-3xl bg-black shadow-2xl aspect-square sm:aspect-video">
                <video
                  ref={videoRef}
                  src={current.video_url}
                  poster={current.thumbnail_url}
                  className="h-full w-full object-cover"
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

                {/* Play/Pause Button - Center */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 flex items-center justify-center transition-all hover:bg-black/20"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white/95 text-accent-link transition-all hover:scale-110 shadow-2xl">
                    {isPlaying ? (
                      <Pause size={40} className="ml-0 fill-current sm:size-12" />
                    ) : (
                      <Play size={40} className="ml-2 fill-current sm:size-12" />
                    )}
                  </div>
                </button>

                {/* Like Button - Bottom Right */}
                <button
                  className="absolute bottom-4 right-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-red-500 hover:bg-white transition-all shadow-2xl"
                  aria-label="Like testimonial"
                >
                  <Heart size={32} className="fill-current sm:size-8" />
                </button>
              </div>

              {/* Stats Badge - Bottom Left */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2 shadow-2xl backdrop-blur-sm">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, testimonials.length))].map((_, i) => (
                    testimonials[i]?.user_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={testimonials[i].user_avatar_url}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div key={i} className="h-6 w-6 rounded-full bg-accent-link/20 flex items-center justify-center ring-2 ring-white">
                        <Users size={10} className="text-accent-link" />
                      </div>
                    )
                  ))}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary">
                    {testimonials.length}+ Happy Users
                  </p>
                  <p className="text-[10px] text-text-muted leading-tight">
                    Connections Made
                  </p>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-surface-panel border border-border-light rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {current.user_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.user_avatar_url}
                    alt={current.user_name}
                    className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full object-cover ring-2 ring-accent-link/30"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full bg-accent-link/20 flex items-center justify-center ring-2 ring-accent-link/30">
                    <span className="text-lg font-bold text-accent-link">
                      {current.user_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-text-primary">
                    {current.user_name}
                  </h3>
                  {current.user_title && (
                    <p className="text-xs sm:text-sm text-text-muted">{current.user_title}</p>
                  )}
                  {current.message && (
                    <p className="mt-2 text-xs sm:text-sm text-text-secondary italic line-clamp-2">
                      "{current.message}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Dots */}
            {testimonials.length > 1 && (
              <div className="flex gap-2 justify-center pt-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`rounded-full transition-all ${
                      index === currentIndex
                        ? "h-3 w-8 bg-accent-link"
                        : "h-3 w-3 bg-border-light hover:bg-accent-link/50"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
