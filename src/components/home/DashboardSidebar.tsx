"use client";

import {
  Apple,
  Calendar,
  Compass,
  Home,
  MessageSquare,
  PlayCircle,
  Settings,
  Smartphone,
  User,
  Video as VideoIcon,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

const NAV_ITEMS = [
  { href: ROUTES.home, label: "Home", icon: Home },
  { href: ROUTES.discover, label: "Discover", icon: Compass },
  { href: ROUTES.videos, label: "Videos", icon: PlayCircle },
  { href: ROUTES.bookings, label: "Bookings", icon: Calendar },
  { href: null, label: "Messages", icon: MessageSquare },
  { href: ROUTES.mentorSessions, label: "My Sessions", icon: VideoIcon },
  { href: ROUTES.wallet, label: "Wallet", icon: WalletIcon },
] as const;

const BOTTOM_ITEMS = [
  { href: ROUTES.editProfile, label: "Profile", icon: User, prefix: ROUTES.editProfile },
  { href: ROUTES.settings, label: "Settings", icon: Settings, prefix: ROUTES.settings },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [storeNotice, setStoreNotice] = useState(false);

  const handleStoreClick = () => {
    setStoreNotice(true);
    setTimeout(() => setStoreNotice(false), 2000);
  };

  return (
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col justify-between border-r border-border-light bg-surface-panel px-4 py-6">
      <div className="flex flex-col gap-6 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = !!item.href && pathname === item.href;
            if (!item.href) {
              return (
                <span
                  key={item.label}
                  aria-disabled="true"
                  title="Coming soon"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-disabled"
                >
                  <Icon size={18} className="shrink-0" />
                  {item.label}
                  <span className="ml-auto rounded-full bg-surface-chip px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                    Soon
                  </span>
                </span>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-link/10 text-accent-link"
                    : "text-text-secondary hover:bg-surface-chip hover:text-text-primary"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.prefix);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-link/10 text-accent-link"
                    : "text-text-secondary hover:bg-surface-chip hover:text-text-primary"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-chip/50 p-4">
          <div>
            <p className="text-sm font-bold text-text-primary">Connectiqo App</p>
            <p className="text-xs text-text-muted">Take your sessions on the go!</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleStoreClick}
              className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-page px-3 py-1.5 text-left hover:border-border-default"
            >
              <Apple size={16} className="shrink-0 text-text-primary" />
              <span className="flex flex-col leading-tight">
                <span className="text-[9px] text-text-muted">Download on the</span>
                <span className="text-xs font-semibold text-text-primary">App Store</span>
              </span>
            </button>
            <button
              type="button"
              onClick={handleStoreClick}
              className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-page px-3 py-1.5 text-left hover:border-border-default"
            >
              <Smartphone size={16} className="shrink-0 text-text-primary" />
              <span className="flex flex-col leading-tight">
                <span className="text-[9px] text-text-muted">Get it on</span>
                <span className="text-xs font-semibold text-text-primary">Google Play</span>
              </span>
            </button>
          </div>
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <Zap size={24} className="fill-current" />
          </span>
          {storeNotice ? (
            <div className="absolute inset-x-3 bottom-1 rounded-lg bg-surface-panel px-2.5 py-1.5 text-center text-[11px] font-medium text-text-secondary shadow-lg">
              Coming soon
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(ROUTES.editProfile)}
        className="flex items-center gap-2.5 rounded-xl border border-border-light px-3 py-2.5 text-left transition-colors hover:border-border-default"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
            <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <User size={16} className="text-text-muted" />
          )}
        </span>
        <span className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold text-text-primary">
            {profile?.name || "My Account"}
          </span>
          <span className="truncate text-xs text-text-muted">
            {profile?.role === "mentor" ? "Creator" : "Member"}
          </span>
        </span>
      </button>
    </aside>
  );
}
