"use client";

import { Star, Users, Check } from "lucide-react";
import Link from "next/link";
import { type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

interface CreatorsCarouselProps {
  mentors: MentorProfileRow[];
}

export function CreatorsCarousel({ mentors }: CreatorsCarouselProps) {
  if (mentors.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-text-primary">Popular Creators</h3>
        <Link href={ROUTES.discover} className="text-sm font-semibold text-accent-link">
          View all
        </Link>
      </div>

      <div
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", minWidth: "0" }}
      >
        {mentors.map((mentor) => (
          <Link
            key={mentor.id}
            href={ROUTES.mentorProfile(mentor.id)}
            className="flex shrink-0 w-64 flex-col gap-2 rounded-2xl border border-border-light bg-surface-panel p-3 transition-all hover:shadow-lg"
          >
            {/* Avatar/Image */}
            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-surface-chip">
              {mentor.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.profiles.avatar_url}
                  alt={mentor.profiles?.name || ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users size={32} className="text-text-muted" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
              <div>
                <h4 className="font-bold text-text-primary flex items-center gap-1">
                  {mentor.profiles?.name || "Creator"}
                  <Check size={14} className="text-accent-link shrink-0" />
                </h4>
                <p className="text-xs text-text-secondary">{mentor.specialization || ""}</p>
              </div>

              {/* Rating and Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-current text-accent-warning" />
                  <span className="text-xs font-semibold text-text-primary">
                    {(mentor.rating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs text-text-muted">(0.0k)</span>
                </div>
                <span className="text-sm font-bold text-text-primary">
                  ₹{mentor.price_per_hour || 0}
                </span>
              </div>

              {/* Book Button */}
              <button className="w-full rounded-lg bg-accent-link px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-link/90">
                Book Now
              </button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
