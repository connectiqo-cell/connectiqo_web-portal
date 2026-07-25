import { Star } from "lucide-react";

export function StarRating({ rating, size = 14 }: { rating: number | null | undefined; size?: number }) {
  const value = rating ?? 0;
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="fill-accent-primary text-accent-primary" />
      <span className="text-sm font-semibold text-text-primary">{value.toFixed(1)}</span>
    </div>
  );
}
