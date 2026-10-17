"use client";

import { ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";

const INDUSTRIES = [
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Food & Beverage",
  "Tech & Apps",
  "Fitness & Wellness",
  "Travel & Hospitality",
  "Finance",
  "Other",
];

/** Mandatory brand onboarding, gates campaign creation (see brand/(dashboard)/layout.tsx). */
export default function BrandOnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  const handleContinue = async () => {
    if (!user) return;
    if (!industry || !description.trim()) {
      setError("Tell creators a bit about your brand before continuing.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await profileApi.updateBrandProfile({
        userId: user.id,
        website: website.trim(),
        industry,
        description: description.trim(),
      });
      router.push(ROUTES.brandCampaigns);
    } catch (err) {
      setError((err as Error)?.message || "Could not save your brand profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1.5">
        <span
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          <Building2 size={18} />
        </span>
        <h1 className="text-2xl font-bold text-text-primary">Tell us about your brand</h1>
        <p className="text-sm text-text-secondary">
          This shows up on every campaign you publish — creators see it before they apply.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-accent-error/35 bg-accent-error/10 px-3.5 py-2.5 text-sm text-accent-error">
          {error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Industry</span>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary focus:outline-none"
        >
          <option value="">Select an industry</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Website</span>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourbrand.com"
          className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">About your brand</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="What does your brand sell, and what kind of creators are you looking for?"
          className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={handleContinue}
        disabled={saving}
        className="flex h-11 items-center justify-center gap-2 self-start rounded-full px-6 text-sm font-semibold text-text-on-accent disabled:opacity-60"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {saving ? "Saving…" : "Continue"}
        <ArrowRight size={16} />
      </button>
    </main>
  );
}
