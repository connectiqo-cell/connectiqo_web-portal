import { User } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";

import { mentorSlug, type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

import { StarRating } from "./StarRating";

export function MentorCard({ mentor }: { mentor: MentorProfileRow }) {
  const name = mentor.profiles?.name || "Mentor";
  const avatarUrl = mentor.profiles?.avatar_url;

  return (
    <Link
      href={ROUTES.mentorProfile(mentorSlug(mentor))}
      className="flex w-full flex-col gap-2.5 rounded-2xl border border-border-light bg-surface-panel p-3 transition-colors hover:border-border-default"
    >
      
      <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-surface-chip">
        {avatarUrl ? (
          <OptimizedImage src={avatarUrl} alt={name} width={384} height={384} className="h-full w-full object-cover" />
        ) : (
          <User size={32} className="text-text-muted" />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="truncate text-sm font-bold text-text-primary">{name}</p>
        <p className="truncate text-xs text-text-muted">{mentor.specialization || "Mentor"}</p>
      </div>

      <div className="flex items-center justify-between">
        <StarRating rating={mentor.rating} />
        {mentor.price_per_hour ? (
          <span className="text-xs font-semibold text-accent-secondary">
            ₹{mentor.price_per_hour}/session
          </span>
        ) : null}
      </div>
    </Link>
  );
}
