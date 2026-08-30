"use client";

import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  Film,
  HelpCircle,
  Landmark,
  PlayCircle,
  Shield,
  Share2,
  Sun,
  User,
  Video as VideoIcon,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggleSwitch } from "@/components/ThemeToggleSwitch";
import { useAuth } from "@/contexts/AuthContext";
import OptimizedImage from "@/components/OptimizedImage";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { paymentApi } from "@/lib/api/paymentApi";
import { videoLibraryApi } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";

const SUPPORT_EMAIL = "contact@connectiqo.com";

interface Subscription {
  mentor_id: string;
  expires_at: string | null;
  profiles: { id: string; name: string | null; avatar_url: string | null } | null;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Full access active";
  return `Access until ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function SettingsHubPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark } = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [supportCopied, setSupportCopied] = useState(false);
  const [subsExpanded, setSubsExpanded] = useState(false);
  const isMentor = profile?.role === "mentor" || profile?.role === "both";

  useEffect(() => {
    if (!loading && !user) router.replace(ROUTES.login);
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    videoLibraryApi
      .getLearnerActiveSubscriptions(user.id)
      .then((rows) => {
        if (!cancelled) setSubscriptions(rows);
      })
      .catch(() => {
        if (!cancelled) setSubscriptions([]);
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    paymentApi
      .getWallet(user.id)
      .then((w) => {
        if (!cancelled) setWalletBalance(w.balance);
      })
      .catch(() => {
        if (!cancelled) setWalletBalance(null);
      })
      .finally(() => {
        if (!cancelled) setWalletLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—";
  const walletLabel = walletLoading
    ? "…"
    : `₹${(walletBalance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const roleLabel =
    profile?.role === "mentor" ? "Mentor" : profile?.role === "learner" ? "Learner" : "Mentor & Learner";

  const handleShare = async () => {
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Connectiqo", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      // user cancelled share/clipboard prompt — nothing to do
    }
  };

  const handleContactSupport = async () => {
    // mailto: silently does nothing if the machine has no registered mail
    // client — always try it, but also copy the address so there's a
    // reliable fallback the user can see worked.
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Connectiqo Support")}`;
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setSupportCopied(true);
      setTimeout(() => setSupportCopied(false), 1500);
    } catch {
      // clipboard unavailable — mailto attempt above is still the primary path
    }
  };

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 sm:px-6 py-8 sm:py-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-xs sm:text-sm text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5 sm:gap-6">
          {/* Profile Card */}
          <div className="flex flex-col gap-3 sm:gap-4 rounded-2xl border border-border-light bg-surface-panel p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 sm:h-16 w-14 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-accent-link bg-surface-chip">
              {profile?.avatar_url ? (
                <OptimizedImage src={profile.avatar_url} alt={profile.name} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <User size={20} className="sm:size-7 text-text-muted" />
              )}
            </div>
            <div className="flex flex-1 min-w-0 flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-text-primary truncate">{profile?.name || "User"}</p>
                {profile?.username ? (
                  <p className="shrink-0 text-xs text-accent-link">@{profile.username}</p>
                ) : null}
              </div>
              <p className="hidden text-xs text-text-muted truncate sm:block">{profile?.email}</p>
              <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-surface-chip px-2 py-0.5 text-[10px] font-semibold text-accent-link">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center border-t border-border-light pt-3.5">
            <div className="flex flex-1 flex-col items-center gap-0.5">
              <span className="text-sm font-bold text-text-primary">
                {subsLoading ? "…" : subscriptions.length}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                Subscriptions
              </span>
            </div>
            <div className="h-8 w-px bg-border-light" />
            <div className="flex flex-1 flex-col items-center gap-0.5">
              <span className="text-sm font-bold text-text-primary">{walletLabel}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                Earnings
              </span>
            </div>
            <div className="h-8 w-px bg-border-light" />
            <div className="flex flex-1 flex-col items-center gap-0.5">
              <span className="text-sm font-bold text-text-primary">{memberSince}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                Member since
              </span>
            </div>
          </div>

          <Link
            href={ROUTES.editProfileForm}
            className="flex items-center justify-center gap-2 rounded-xl border border-border-light px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-accent-link transition-colors hover:bg-surface-chip"
          >
            Edit Profile
          </Link>
        </div>

        {/* Video subscriptions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Video subscriptions"
              subtitle="Mentors whose video libraries you can access"
            />
            <Link
              href={ROUTES.videos}
              className="flex items-center gap-1 text-sm font-semibold text-accent-link hover:text-accent-secondary"
            >
              View all
            </Link>
          </div>
          {subsLoading ? (
            <p className="rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 text-xs text-text-muted">
              Checking subscriptions…
            </p>
          ) : subscriptions.length === 0 ? (
            <Link
              href={ROUTES.videos}
              className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 hover:border-border-default"
            >
              <PlayCircle size={18} className="text-accent-link" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">No active subscriptions</p>
                <p className="text-xs text-text-muted">Browse the video library to unlock one.</p>
              </div>
            </Link>
          ) : (
            <>
              {(subsExpanded ? subscriptions : subscriptions.slice(0, 3)).map((sub) => (
                <Link
                  key={sub.mentor_id}
                  href={ROUTES.mentorProfile(sub.mentor_id)}
                  className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 hover:border-border-default"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                    {sub.profiles?.avatar_url ? (
                      <OptimizedImage src={sub.profiles.avatar_url} alt={sub.profiles.name || "Mentor"} width={36} height={36} className="h-full w-full object-cover" />
                    ) : (
                      <User size={16} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{sub.profiles?.name || "Mentor"}</p>
                    <p className="text-xs text-text-muted">{formatExpiry(sub.expires_at)}</p>
                  </div>
                </Link>
              ))}
              {subscriptions.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setSubsExpanded((v) => !v)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border-light bg-surface-panel px-4 py-3 text-sm font-semibold text-accent-link transition-colors hover:border-border-default"
                >
                  {subsExpanded ? "Show less" : `Show more (${subscriptions.length - 3})`}
                </button>
              ) : null}
            </>
          )}
        </div>

        {/* Preferences */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Preferences" subtitle="Customize your app experience" />
          <div className="rounded-xl border border-border-light bg-surface-panel p-4">
            <div className="flex flex-col gap-0">
              {/* Appearance */}
              <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sun size={16} className="shrink-0 text-accent-link" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Appearance</p>
                    <p className="text-xs text-text-muted">
                      {isDark ? "Dark · tap switch for Light" : "Light · tap switch for Dark"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <ThemeToggleSwitch />
                </div>
              </div>

              {/* Notifications */}
              <Link
                href={ROUTES.notifications}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Bell size={16} className="shrink-0 text-accent-link" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                    <p className="text-xs text-text-muted">Session updates, bookings, and reminders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {unreadCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                  <ChevronRight size={16} className="text-text-muted" />
                </div>
              </Link>

              {/* My Bookings */}
              <Link
                href={ROUTES.bookings}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlayCircle size={16} className="shrink-0 text-accent-link" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">My Bookings</p>
                    <p className="text-xs text-text-muted">Upcoming and past sessions</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border-light bg-surface-panel p-4">
            <SectionHeader title="Payments & Earnings" subtitle="Earnings, payouts, and transaction history" />
            <div className="mt-3 flex flex-col gap-0">
              <Link
                href={ROUTES.wallet}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Wallet size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Earnings</p>
                  <p className="text-xs text-text-muted">View balance and transaction history</p>
                </div>
              </Link>
              <Link
                href={ROUTES.payoutSetup}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Landmark size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Payouts</p>
                  <p className="text-xs text-text-muted">Manage your payout UPI ID</p>
                </div>
              </Link>
              <Link
                href={ROUTES.transactions}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <CreditCard size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Transaction History</p>
                  <p className="text-xs text-text-muted">All your earnings transactions</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border-light bg-surface-panel p-4">
            <SectionHeader title="Content & Library" subtitle="Your videos and recorded sessions" />
            <div className="mt-3 flex flex-col gap-0">
              <Link
                href={ROUTES.recordings}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Film size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Recorded Sessions</p>
                  <p className="text-xs text-text-muted">Replay past live sessions</p>
                </div>
              </Link>
              {isMentor ? (
                <Link
                  href={ROUTES.mentorVideos}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
                >
                  <VideoIcon size={16} className="shrink-0 text-accent-link" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">My Videos</p>
                    <p className="text-xs text-text-muted">Manage your mentor video library</p>
                  </div>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border-light bg-surface-panel p-4">
            <SectionHeader title="Support & Legal" subtitle="Help, policies, and sharing" />
            <div className="mt-3 flex flex-col gap-0">
              <button
                type="button"
                onClick={handleContactSupport}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <HelpCircle size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Help & Support</p>
                  <p className="text-xs text-text-muted">
                    {supportCopied ? "Email copied to clipboard!" : `Contact us at ${SUPPORT_EMAIL}`}
                  </p>
                </div>
              </button>
              <Link
                href={ROUTES.privacy}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Shield size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Privacy Policy</p>
                  <p className="text-xs text-text-muted">How we handle your data</p>
                </div>
              </Link>
              <Link
                href={ROUTES.terms}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <FileText size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Terms of Service</p>
                  <p className="text-xs text-text-muted">Usage guidelines and policies</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Share2 size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {shared ? "Link copied!" : "Share Connectiqo"}
                  </p>
                  <p className="text-xs text-text-muted">Invite friends to join the platform</p>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
