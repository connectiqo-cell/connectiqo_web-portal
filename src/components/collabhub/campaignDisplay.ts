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

/** Past the end of a deadline's calendar day (IST), if one is set. */
export function isDeadlinePassed(deadline: string | null) {
  return !!deadline && deadlineEndsAt(deadline) < Date.now();
}

/** Closed for new applications: unpublished, or past the end of its application-deadline day. */
export function isCampaignClosed(campaign: Campaign) {
  if (campaign.status !== "published") return true;
  return isDeadlinePassed(campaign.application_deadline);
}

/**
 * What a brand actually pays to unlock a winner's clean video: the creator's
 * payout plus a platform convenience fee (+ GST on that fee), on top —
 * mirrors create-campaign-order's server-side math exactly, so the UI never
 * promises a number the Razorpay checkout then overrides.
 */
export function calcUnlockTotal(
  budgetPerWinner: number,
  feeRule: { platform_fee_percent: number; gst_percent: number } | null,
) {
  const platformFeePercent = feeRule?.platform_fee_percent ?? 5;
  const gstPercent = feeRule?.gst_percent ?? 18;
  const platformBaseFee = (budgetPerWinner * platformFeePercent) / 100;
  const gstOnFee = (platformBaseFee * gstPercent) / 100;
  const convenienceFee = Math.round(platformBaseFee + gstOnFee);
  return { convenienceFee, totalAmount: Math.round(budgetPerWinner + platformBaseFee + gstOnFee) };
}

/** What a creator agrees to before their first submission on an application
 * — shown on the upload screen, and reused on the brand's side so they can
 * see exactly what was agreed to, not just that it was. A full ownership
 * transfer (not a license): once unlocked, the brand owns the video outright,
 * forever — not a lawyer-reviewed final text, but the policy this reflects
 * (full assignment, portfolio-use carve-out, India-governed) was confirmed
 * deliberately, not a default. */
export function usageAgreementPoints(brandName: string) {
  return [
    `Full ownership transfer: once this video is approved and unlocked, you irrevocably assign and transfer to ${brandName} all right, title, and interest in it, including all copyright, worldwide and in perpetuity. ${brandName} becomes its full owner and may use, edit, reproduce, publish, or otherwise exploit it in any manner, for any purpose.`,
    "Your reserved right: despite that transfer, you may still keep a copy to showcase in your own personal portfolio or reel (e.g. to prospective brands or clients) — but you may not otherwise republish, resell, or commercially exploit it once ownership has transferred.",
    "Your warranties: you confirm this is your own original work; you hold the rights to all music, footage, and other elements used in it; if any other identifiable person appears in it, you have their consent to be filmed and published; and it does not violate any law or infringe anyone else's rights.",
    `${brandName} may not use this video for any unlawful, discriminatory, or defamatory purpose, even as its owner.`,
    `The campaign payout is full and final compensation for this transfer of ownership — no further payment is owed regardless of how, or for how long, ${brandName} uses this video going forward.`,
    "You indemnify the brand against any claim arising from your breach of the warranties above (for example, a third-party music copyright claim).",
    "Connectiqo facilitates this agreement and the related payment between you and the brand, but is not a party to this transfer and is not liable for either side's breach of it. Connectiqo keeps a timestamped record of your acceptance, which it can provide if a dispute arises.",
    `Nothing in this agreement creates an employment, agency, or partnership relationship between you, ${brandName}, or Connectiqo.`,
    "This agreement is governed by the laws of India, with disputes subject to the exclusive jurisdiction of the courts of Haridwar, Uttarakhand.",
  ];
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
