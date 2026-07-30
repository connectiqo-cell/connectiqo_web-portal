"use client";

import {
  Bell,
  Camera,
  CreditCard,
  Landmark,
  PlayCircle,
  Share2,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { paymentApi } from "@/lib/api/paymentApi";
import { videoLibraryApi } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

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

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-5">
          <div className="flex items-center gap-3">
            <div className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-accent-link bg-surface-chip">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <User size={28} className="text-text-muted" />
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                <Camera size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-1.5 border-white bg-accent-link text-white shadow-md">
                <Camera size={11} />
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <p className="text-sm font-bold text-text-primary">{profile?.name || "User"}</p>
              {profile?.username ? (
                <p className="text-xs text-accent-link">@{profile.username}</p>
              ) : null}
              <p className="text-xs text-text-muted">{profile?.email}</p>
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
                Wallet
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
            className="flex items-center justify-center gap-2 rounded-xl border border-border-light px-4 py-3 text-sm font-semibold text-accent-link transition-colors hover:bg-surface-chip"
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
              {subscriptions.map((sub) => (
                <Link
                  key={sub.mentor_id}
                  href={ROUTES.mentorProfile(sub.mentor_id)}
                  className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 hover:border-border-default"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                    {sub.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                      <img
                        src={sub.profiles.avatar_url}
                        alt={sub.profiles.name || "Mentor"}
                        className="h-full w-full object-cover"
                      />
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
              <Link
                href={ROUTES.videos}
                className="flex items-center justify-center gap-2 rounded-xl border border-border-light bg-surface-panel px-4 py-3 text-sm font-semibold text-accent-link transition-colors hover:border-border-default"
              >
                <PlayCircle size={18} />
                Browse video library
              </Link>
            </>
          )}
        </div>

        {/* Appearance - Top Priority */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="Customize your app experience" subtitle="Appearance" />
          <div className="flex flex-col gap-0 rounded-xl border border-border-light bg-surface-panel">
            {/* Appearance */}
            <div
              className="flex items-center justify-between px-4 py-4 text-left transition-colors hover:bg-surface-chip"
            >
              <div className="flex items-center gap-3">
                <Sun size={24} className="text-yellow-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Appearance</p>
                  <p className="text-xs text-text-muted">Light · tap switch for Dark</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-col gap-3">
          <SectionHeader title="More Preferences" subtitle="Additional settings" />
          <div className="flex flex-col gap-0 rounded-xl border border-border-light bg-surface-panel">
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-chip"
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Notification Settings</p>
                  <p className="text-xs text-text-muted">Manage push and email notifications</p>
                </div>
              </div>
            </button>
            <div className="h-px bg-border-light" />
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-chip"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Privacy Settings</p>
                  <p className="text-xs text-text-muted">Manage your privacy and visibility</p>
                </div>
              </div>
            </button>
          </div>
        </div>
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border-light bg-surface-panel p-4">
            <SectionHeader title="Payments & Earnings" subtitle="Wallet, payouts, and transaction history" />
            <div className="mt-3 flex flex-col gap-0">
              <Link
                href={ROUTES.wallet}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Wallet size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">My Wallet</p>
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
                  <p className="text-xs text-text-muted">Manage bank accounts and payouts</p>
                </div>
              </Link>
              <Link
                href={ROUTES.mentorEarnings}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <CreditCard size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Earnings</p>
                  <p className="text-xs text-text-muted">View your earning summary</p>
                </div>
              </Link>
              <Link
                href={ROUTES.transactions}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <CreditCard size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Transaction History</p>
                  <p className="text-xs text-text-muted">All your wallet transactions</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border-light bg-surface-panel p-4">
            <SectionHeader title="Account & Security" subtitle="Manage your account and security settings" />
            <div className="mt-3 flex flex-col gap-0">
              <Link
                href={ROUTES.editProfileForm}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <User size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Personal Information</p>
                  <p className="text-xs text-text-muted">Update your personal details</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <ShieldCheck size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Change Password</p>
                  <p className="text-xs text-text-muted">Update your password</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Bell size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Email Preferences</p>
                  <p className="text-xs text-text-muted">Manage email notifications</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Share2 size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Share Connectiqo</p>
                  <p className="text-xs text-text-muted">Invite friends to join</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <ShieldCheck size={16} className="shrink-0 text-accent-link" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Two-Factor Authentication</p>
                  <p className="text-xs text-text-muted">Add extra security to your account</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-chip"
              >
                <Trash2 size={16} className="shrink-0 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-500">Delete Account</p>
                  <p className="text-xs text-text-muted">Permanently delete your account</p>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
