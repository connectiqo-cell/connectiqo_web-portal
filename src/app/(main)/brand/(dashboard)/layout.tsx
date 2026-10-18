"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";

export default function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  // Campaign creation is gated behind the brand onboarding step
  // (src/app/(main)/onboarding/brand/page.tsx) having been completed.
  useEffect(() => {
    if (!user || profile?.role !== "brand") return;
    let cancelled = false;
    (async () => {
      const brandProfile = await profileApi.getBrandProfile(user.id).catch(() => null);
      if (cancelled) return;
      if (!brandProfile?.industry || !brandProfile?.description) {
        router.replace(ROUTES.brandOnboarding);
        return;
      }
      setOnboardingChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile, router]);

  if (!user || !onboardingChecked) return null;

  const isEdit = pathname.endsWith("/edit");
  const title =
    pathname === ROUTES.brandCampaignNew
      ? "New Campaign"
      : pathname === ROUTES.brandCampaigns
        ? "Campaigns"
        : isEdit
          ? "Edit Campaign"
          : "Campaign";
  const subtitle =
    pathname === ROUTES.brandCampaignNew
      ? "Describe what you need — publishing is free"
      : pathname === ROUTES.brandCampaigns
        ? "Manage your CollabHub campaigns"
        : isEdit
          ? "Update your campaign details"
          : "Review applicants and submissions";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        </div>
        {pathname === ROUTES.brandCampaigns ? (
          <Link
            href={ROUTES.brandCampaignNew}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-text-on-accent shadow-sm transition-transform hover:scale-[1.02]"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <Plus size={16} />
            New Campaign
          </Link>
        ) : null}
      </div>
      {(pathname === ROUTES.brandCampaignNew || isEdit) && !profile?.avatar_url ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent-primary/25 bg-accent-soft p-4 sm:flex-row sm:items-center">
          {/* What creators see today: the first-letter fallback. */}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-panel text-sm font-bold text-text-primary ring-2 ring-surface-panel">
            {(profile?.name || "B").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">Add your company logo</p>
            <p className="text-xs text-text-secondary">
              Your campaigns show your logo to creators — right now they see just a letter.
            </p>
          </div>
          <Link
            href={ROUTES.editProfile}
            className="flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-full bg-surface-panel px-4 text-sm font-semibold text-accent-link transition-colors hover:bg-surface-chip"
          >
            Add in Profile
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}
      {children}
    </main>
  );
}
