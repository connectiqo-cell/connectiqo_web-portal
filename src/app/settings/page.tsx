"use client";

import { ArrowRight, CreditCard, Landmark, PlayCircle, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

const LINKS = [
  { href: ROUTES.editProfile, label: "Edit Profile", description: "Name and avatar", icon: User },
  { href: ROUTES.payoutSetup, label: "Payout Setup", description: "Razorpay payout account", icon: Landmark },
  { href: ROUTES.transactions, label: "Transaction History", description: "Payments and earnings", icon: CreditCard },
  { href: ROUTES.recordings, label: "Recorded Sessions", description: "Watch past session recordings", icon: PlayCircle },
];

export default function SettingsHubPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace(ROUTES.login);
  }, [loading, user, router]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      <div className="flex flex-col gap-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-panel px-4 py-3.5 transition-colors hover:border-border-default"
            >
              <Icon size={18} className="text-accent-link" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{link.label}</p>
                <p className="text-xs text-text-muted">{link.description}</p>
              </div>
              <ArrowRight size={16} className="text-text-muted" />
            </Link>
          );
        })}

        <Link
          href={ROUTES.account}
          className="flex items-center gap-3 rounded-xl border border-accent-error/30 bg-accent-error/5 px-4 py-3.5 transition-colors hover:border-accent-error/50"
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-accent-error">Account &amp; Sign out</p>
            <p className="text-xs text-text-muted">Sign out or delete your account</p>
          </div>
          <ArrowRight size={16} className="text-accent-error" />
        </Link>
      </div>
    </main>
  );
}
