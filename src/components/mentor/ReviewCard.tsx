import { User } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";

import type { ReviewRow } from "@/lib/api/reviewsApi";

import { StarRating } from "./StarRating";

export function ReviewCard({ review }: { review: ReviewRow }) {
  const name = review.profiles?.name || "Learner";
  const avatarUrl = review.profiles?.avatar_url;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-light bg-surface-panel p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
          {avatarUrl ? (
            <OptimizedImage src={avatarUrl} alt={name} width={36} height={36} className="h-full w-full object-cover" />
          ) : (
            <User size={16} className="text-text-muted" />
          )}
        </div>
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary">{name}</p>
          <StarRating rating={review.rating} size={12} />
        </div>
      </div>
      {review.comment ? (
        <p className="text-sm leading-relaxed text-text-secondary">{review.comment}</p>
      ) : null}
      <p className="text-xs text-text-muted">
        {new Date(review.created_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
