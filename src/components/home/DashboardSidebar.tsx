"use client";

import {
  Calendar,
  Compass,
  Home,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Settings,
  User,
  Video as VideoIcon,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

const NAV_ITEMS = [
  { href: ROUTES.home, label: "Home", icon: Home },
  { href: ROUTES.discover, label: "Discover", icon: Compass },
  { href: ROUTES.videos, label: "Videos", icon: PlayCircle },
  { href: ROUTES.bookings, label: "My Bookings", icon: Calendar },
  { href: null, label: "Messages", icon: MessageSquare },
  { href: ROUTES.mentorSessions, label: "My Sessions", icon: VideoIcon },
  { href: ROUTES.wallet, label: "Earnings", icon: WalletIcon },
] as const;

const BOTTOM_ITEMS = [
  { href: ROUTES.editProfile, label: "Profile", icon: User, prefix: ROUTES.editProfile },
  { href: ROUTES.settings, label: "Settings", icon: Settings, prefix: ROUTES.settings },
] as const;

/** Nav list + app-promo card, shared between the desktop rail and the mobile drawer. */
function SidebarNavContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [storeNotice, setStoreNotice] = useState(false);

  const handleStoreClick = () => {
    setStoreNotice(true);
    setTimeout(() => setStoreNotice(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className={`flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-disabled ${
                  collapsed ? "justify-center px-0" : ""
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {collapsed ? null : (
                  <>
                    {item.label}
                    <span className="ml-auto rounded-full bg-surface-chip px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                      Soon
                    </span>
                  </>
                )}
              </span>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "text-accent-link"
                  : "text-text-secondary hover:bg-surface-chip hover:text-text-primary"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {collapsed ? null : item.label}
            </Link>
          );
        })}

        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.prefix + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "text-accent-link"
                  : "text-text-secondary hover:bg-surface-chip hover:text-text-primary"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {collapsed ? null : item.label}
            </Link>
          );
        })}
      </nav>

      {collapsed ? (
        <OptimizedImage src="/connectiqo_logo.png" alt="Connectiqo App" width={40} height={40} className="mx-auto h-10 w-10" />
      ) : (
        <div className="relative flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-chip/50 p-4">
          <div>
            <p className="text-sm font-bold text-text-primary">Connectiqo App</p>
            <p className="text-xs text-text-muted">Take your sessions on the go!</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleStoreClick}
              className="block w-36 overflow-hidden rounded-lg border border-border-light hover:border-border-default"
            >
              <OptimizedImage src="/appstore.png" alt="Download on the App Store" width={600} height={200} className="block h-auto w-full" />
            </button>
            <button
              type="button"
              onClick={handleStoreClick}
              className="block w-36 overflow-hidden rounded-lg border border-border-light hover:border-border-default"
            >
              <OptimizedImage src="/playstore.png" alt="Get it on Google Play" width={600} height={200} className="block h-auto w-full" />
            </button>
          </div>
          {storeNotice ? (
            <div className="absolute inset-x-3 bottom-1 rounded-lg bg-surface-panel px-2.5 py-1.5 text-center text-[11px] font-medium text-text-secondary shadow-lg">
              Coming soon
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SidebarAccountButton({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        router.push(ROUTES.editProfile);
      }}
      title={collapsed ? profile?.name || "My Account" : undefined}
      className={`flex items-center gap-2.5 rounded-xl border border-border-light py-2.5 text-left transition-colors hover:border-border-default ${
        collapsed ? "justify-center px-0" : "px-3"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
        {profile?.avatar_url ? (
          <OptimizedImage src={profile.avatar_url} alt={profile.name || "Profile"} width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          <User size={16} className="text-text-muted" />
        )}
      </span>
      {collapsed ? null : (
        <span className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold text-text-primary">
            {profile?.name || "My Account"}
          </span>
          <span className="truncate text-xs text-text-muted">
            {profile?.role === "mentor" ? "Mentor" : profile?.role === "learner" ? "Learner" : "Mentor & Learner"}
          </span>
        </span>
      )}
    </button>
  );
}

export function DashboardSidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
} = {}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop rail — hidden below lg, mobile nav uses the drawer instead. */}
      <aside
        className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col justify-between border-r border-border-light bg-surface-panel py-6 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[72px] px-2" : "w-60 px-4"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-chip hover:text-text-primary ${
              collapsed ? "mx-auto" : "ml-auto"
            }`}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <SidebarNavContent collapsed={collapsed} />
        </div>

        <SidebarAccountButton collapsed={collapsed} />
      </aside>

      {/* Mobile drawer — overlay + slide-in panel, triggered by the hamburger in AppTopBar. */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div
          onClick={onMobileClose}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[70vw] flex-col justify-between border-r border-border-light bg-surface-panel px-4 py-6 shadow-2xl transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <OptimizedImage src="/connectiqo_logo.png" alt="Connectiqo" width={36} height={36} className="h-9 w-9" />
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-chip hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <SidebarNavContent collapsed={false} onNavigate={onMobileClose} />
          </div>

          <SidebarAccountButton collapsed={false} onNavigate={onMobileClose} />
        </aside>
      </div>
    </>
  );
}