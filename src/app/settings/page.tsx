"use client";

import {
  ArrowRight,
  Bell,
  Calendar,
  CreditCard,
  FileText,
  HelpCircle,
  Landmark,
  PlayCircle,
  Share2,
  ShieldCheck,
  User,
  Video,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
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
    <div className="mt-2 flex flex-col gap-0.5">
      <h2 className="text-sm font-bold text-text-primary">{title}</h2>
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  icon: Icon,
  label,
  subtitle,
  badge,
  destructive,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof User;
  label: string;
  subtitle: string;
  badge?: number;
  destructive?: boolean;
}) {
  const content = (
    <>
      <Icon size={18} className={destructive ? "text-accent-error" : "text-accent-link"} />
      <div className="flex-1">
        <p className={`text-sm font-semibold ${destructive ? "text-accent-error" : "text-text-primary"}`}>
          {label}
        </p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
      {badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-link px-1.5 text-[11px] font-bold text-text-on-accent">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <ArrowRight size={16} className={destructive ? "text-accent-error" : "text-text-muted"} />
    </>
  );

  const className = `flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
    destructive
      ? "border-accent-error/30 bg-accent-error/5 hover:border-accent-error/50"
      : "border-border-light bg-surface-panel hover:border-border-default"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
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

  const handleShare = async () => {
    const shareData = {
      title: "Connectiqo",
      text: "Join me on Connectiqo — connect with mentors, book sessions, and learn together.",
      url: typeof window !== "undefined" ? window.location.origin : undefined,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        window.alert("Link copied to clipboard!");
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
              <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <User size={22} className="text-text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-text-primary">{profile?.name || "User"}</p>
            {profile?.username ? (
              <p className="truncate text-xs text-accent-link">@{profile.username}</p>
            ) : null}
            <p className="truncate text-xs text-text-muted">{profile?.email}</p>
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-surface-chip px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
              {roleLabel}
            </span>
          </div>
          <Link
            href={ROUTES.editProfile}
            className="shrink-0 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            Edit
          </Link>
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
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader
          title="Video subscriptions"
          subtitle="Mentors whose video libraries you can access"
        />
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
            <ArrowRight size={16} className="text-text-muted" />
          </Link>
        ) : (
          subscriptions.map((sub) => (
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
              <ArrowRight size={16} className="text-text-muted" />
            </Link>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Payments & earnings" subtitle="Wallet, payouts, and transaction history" />
        <MenuLink
          href={ROUTES.wallet}
          icon={Wallet}
          label="My Wallet"
          subtitle={!walletLoading ? `Available balance: ${walletLabel}` : "View balance and withdraw earnings"}
        />
        <MenuLink
          href={ROUTES.payoutSetup}
          icon={Landmark}
          label="Payout Setup"
          subtitle="Configure UPI for mentor withdrawals"
        />
        <MenuLink
          href={ROUTES.transactions}
          icon={CreditCard}
          label="Transaction History"
          subtitle="Sessions, subscriptions, and payouts"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Content & library" subtitle="Your videos and recorded sessions" />
        <MenuLink
          href={ROUTES.recordings}
          icon={PlayCircle}
          label="Recorded Sessions"
          subtitle="Replay past live sessions"
        />
        <MenuLink
          href={ROUTES.mentorVideos}
          icon={Video}
          label="My Videos"
          subtitle="Manage your mentor video library"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Preferences" subtitle="Notifications, appearance, and bookings" />
        <div className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5">
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Appearance</p>
            <p className="text-xs text-text-muted">Switch between light and dark mode</p>
          </div>
          <ThemeToggle />
        </div>
        <MenuLink
          href={ROUTES.notifications}
          icon={Bell}
          label="Notifications"
          subtitle="Session updates, bookings, and reminders"
          badge={unreadCount}
        />
        <MenuLink
          href={ROUTES.bookings}
          icon={Calendar}
          label="My Bookings"
          subtitle="Upcoming and past sessions"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Support & legal" subtitle="Help, policies, and sharing" />
        <MenuLink
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Connectiqo Support")}`}
          icon={HelpCircle}
          label="Help & Support"
          subtitle={`Contact us at ${SUPPORT_EMAIL}`}
        />
        <MenuLink href={ROUTES.privacy} icon={ShieldCheck} label="Privacy Policy" subtitle="How we handle your data" />
        <MenuLink href={ROUTES.terms} icon={FileText} label="Terms of Service" subtitle="Usage guidelines and policies" />
        <MenuLink
          onClick={handleShare}
          icon={Share2}
          label="Share Connectiqo"
          subtitle="Invite friends to join the platform"
        />
      </div>

      <MenuLink
        href={ROUTES.account}
        icon={User}
        label="Account & Sign out"
        subtitle="Sign out or delete your account"
        destructive
      />
    </main>
  );
}
