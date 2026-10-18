import {
  Dumbbell,
  Landmark,
  type LucideIcon,
  Plane,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import type { Campaign } from "@/lib/api/collabHubApi";

// Keyed by the CampaignForm CATEGORY_OPTIONS values. Campaigns without a cover
// image fall back to this gradient + icon, so every card keeps the same shape.
const CATEGORY_STYLE: Record<string, { icon: LucideIcon; gradient: string }> = {
  "Fashion & Apparel": { icon: Shirt, gradient: "linear-gradient(135deg, #f472b6, #a855f7)" },
  "Beauty & Cosmetics": { icon: Sparkles, gradient: "linear-gradient(135deg, #fb7185, #f472b6)" },
  "Food & Beverage": { icon: UtensilsCrossed, gradient: "linear-gradient(135deg, #fb923c, #f43f5e)" },
  "Tech & Apps": { icon: Smartphone, gradient: "linear-gradient(135deg, #38bdf8, #6366f1)" },
  "Fitness & Wellness": { icon: Dumbbell, gradient: "linear-gradient(135deg, #34d399, #0ea5e9)" },
  "Travel & Hospitality": { icon: Plane, gradient: "linear-gradient(135deg, #22d3ee, #3b82f6)" },
  Finance: { icon: Landmark, gradient: "linear-gradient(135deg, #a3e635, #14b8a6)" },
};
const DEFAULT_CATEGORY_STYLE = { icon: Sparkles, gradient: "linear-gradient(135deg, #c757d9, #8e2ba1)" };

export function getCategoryStyle(category: string | null) {
  return (category && CATEGORY_STYLE[category]) || DEFAULT_CATEGORY_STYLE;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// CampaignForm saves a picked date ("2026-10-17") as UTC midnight, which is
// 05:30 IST — so the stored instant would close a campaign early that morning.
// Deadlines are whole days: read the UTC date back out and run it to the end
// of that day in IST.
function calendarDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function deadlineEndsAt(iso: string) {
  return new Date(`${calendarDate(iso)}T23:59:59.999+05:30`).getTime();
}

export function formatShortDate(iso: string) {
  return new Date(`${calendarDate(iso)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function deadlineLabel(deadline: string | null): { text: string; urgent: boolean } | null {
  if (!deadline) return null;
  const msLeft = deadlineEndsAt(deadline) - Date.now();
  if (msLeft < 0) return { text: "Applications closed", urgent: true };
  const daysLeft = Math.floor(msLeft / DAY_MS);
  if (daysLeft === 0) return { text: "Closes today", urgent: true };
  if (daysLeft <= 3) return { text: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`, urgent: true };
  return { text: `Apply by ${formatShortDate(deadline)}`, urgent: false };
}

/** Closed for new applications: unpublished, or past the end of its application-deadline day. */
export function isCampaignClosed(campaign: Campaign) {
  if (campaign.status !== "published") return true;
  return !!campaign.application_deadline && deadlineEndsAt(campaign.application_deadline) < Date.now();
}

/** Brand-entered text, split into its non-blank lines (brands often paste points separated by blank lines). */
export function textLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatFollowers(n: number) {
  if (n >= 100000) return `${+(n / 100000).toFixed(1)}L+`;
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}K+`;
  return `${n}+`;
}
