"use client";

import { ArrowRight, Check, Search, ShieldCheck, Sparkles, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveCategories } from "@/lib/api/contentApi";
import { mentorApi } from "@/lib/api/mentorApi";
import { profileApi } from "@/lib/api/profileApi";
import { getCategoryInterestMeta } from "@/lib/constants/categoryInterestMeta";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { resolveCategoryIcon } from "@/lib/utils/categoryIcon";
import { MAX_LEARNER_INTERESTS, MIN_LEARNER_INTERESTS, toggleMentorCategory } from "@/lib/utils/mentorCategories";

export default function InterestsOnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<string[]>([...MENTOR_CATEGORIES]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [spotlightAvatars, setSpotlightAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchActiveCategories();
      if (cancelled) return;
      if (rows.length) setCategories(rows.map((r) => r.name));
      setLoadingCategories(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const rows = await mentorApi.getTrendingMentors(supabase, 6).catch(() => []);
      if (cancelled) return;
      setSpotlightAvatars(
        rows.map((m) => m.profiles?.avatar_url).filter((url): url is string => !!url),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = selected.length;
  const canContinue = count === MAX_LEARNER_INTERESTS;
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const meta = getCategoryInterestMeta(c);
      return c.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q);
    });
  }, [categories, search]);

  const handleToggle = (category: string) => {
    setSelected((prev) => {
      const alreadySelected = prev.some(
        (c) => c.toLowerCase() === category.trim().toLowerCase(),
      );
      const next = toggleMentorCategory(prev, category);
      if (!alreadySelected && next.length > MAX_LEARNER_INTERESTS) {
        setNotice(`Select ${MAX_LEARNER_INTERESTS} categories`);
        setTimeout(() => setNotice(""), 2000);
        return prev;
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (!canContinue || !user?.id) return;
    setSaving(true);
    try {
      const existing = await profileApi.getLearnerProfile(user.id).catch(() => null);
      await profileApi.updateLearnerProfile({
        userId: user.id,
        bio: existing?.bio || "",
        interests: selected,
      });
      setStep(2);
    } catch (error) {
      setNotice((error as Error)?.message || "Could not save interests");
    } finally {
      setSaving(false);
    }
  };

  if (step === 2) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-link/15 text-accent-link">
            <Check size={28} />
          </span>
          <h1 className="text-2xl font-extrabold text-text-primary">You&apos;re All Set!</h1>
          <p className="text-sm text-text-secondary">
            Your {selected.length} interests will show up on your search page for quick access.
          </p>
          <button
            type="button"
            onClick={() => router.push(ROUTES.home)}
            className="mt-2 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold text-text-on-accent"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            Go to Connectiqo
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <aside className="hidden w-full max-w-xs shrink-0 flex-col justify-between overflow-hidden bg-[#0d0a24] px-8 py-10 text-white lg:flex">
        <div className="flex flex-col gap-6">
          <span className="text-xl font-extrabold">
            Connect<span className="text-accent-link">iqo</span>
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold leading-tight">
              Let&apos;s personalize your experience
            </h2>
            <p className="text-sm text-white/60">
              Choose the {MAX_LEARNER_INTERESTS} categories you love the most. They will appear
              on your search page for quick access.
            </p>
          </div>

          {spotlightAvatars.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 pt-4">
              {spotlightAvatars.slice(0, 6).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck size={16} />
          <div>
            <p className="font-semibold text-white/80">100% Secure</p>
            <p>Your data is safe with us</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
        <div className="flex items-center justify-center gap-3 text-xs font-semibold text-text-muted">
          <span className="flex items-center gap-1.5 text-accent-link">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-link text-text-on-accent">
              1
            </span>
            Choose Categories
          </span>
          <span className="h-px w-10 bg-border-light" />
          <span className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-light">
              2
            </span>
            You&apos;re All Set
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            What are you <span className="text-accent-link">interested</span> in?
          </h1>
          <p className="text-text-muted">
            Select {MIN_LEARNER_INTERESTS} categories you love the most. They will appear on your
            search page for quick access.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border-light bg-surface-panel px-4 py-2.5">
            <Search size={16} className="text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <span className="w-fit rounded-full border border-accent-link/30 bg-accent-link/10 px-4 py-2 text-xs font-bold text-accent-link">
            {count} / {MAX_LEARNER_INTERESTS} selected
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          {loadingCategories ? (
            <div className="flex flex-1 items-center justify-center py-16 text-text-muted">
              Loading categories…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredCategories.map((category) => {
                const meta = getCategoryInterestMeta(category);
                const Icon = resolveCategoryIcon(meta.icon);
                const isSelected = selected.some((c) => c.toLowerCase() === category.toLowerCase());
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleToggle(category)}
                    aria-pressed={isSelected}
                    className={`relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-accent-link bg-accent-link/5"
                        : "border-border-light bg-surface-panel/60 hover:border-border-default"
                    }`}
                  >
                    <span
                      className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-accent-link bg-accent-link text-text-on-accent"
                          : "border-border-default"
                      }`}
                    >
                      {isSelected ? <Check size={11} /> : null}
                    </span>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isSelected ? "bg-accent-link/20 text-accent-link" : "bg-accent-secondary/15 text-accent-secondary"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="text-sm font-extrabold text-text-primary">{category}</span>
                    <span className="text-xs leading-tight text-text-muted">{meta.description}</span>
                  </button>
                );
              })}
              {filteredCategories.length === 0 ? (
                <p className="col-span-full py-10 text-center text-sm text-text-muted">
                  No categories match &quot;{search}&quot;.
                </p>
              ) : null}
            </div>
          )}

          <div className="hidden flex-col gap-3 rounded-2xl border border-accent-link/20 bg-accent-link/5 p-4 lg:flex">
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-accent-link">
              <Sparkles size={16} />
              Your Top {MAX_LEARNER_INTERESTS} Categories
            </div>
            <p className="text-xs text-text-muted">
              These categories will appear on your search page for quick access.
            </p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: MAX_LEARNER_INTERESTS }, (_, i) => selected[i]).map(
                (category, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                      category
                        ? "border-accent-link/40 bg-surface-panel text-text-primary"
                        : "border-dashed border-border-default text-text-muted"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-chip text-[10px] text-text-muted">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{category || "Select a category"}</span>
                    {category ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(category)}
                        aria-label={`Remove ${category}`}
                        className="text-text-muted hover:text-accent-error"
                      >
                        <X size={13} />
                      </button>
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto flex flex-col gap-3 rounded-t-3xl border-t border-border-light bg-surface-sheet px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push(ROUTES.home)}
            className="rounded-full border border-border-light px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary sm:order-1"
          >
            Skip for now
          </button>
          <p className="flex items-center gap-1.5 text-xs text-text-muted sm:order-2">
            <User size={13} />
            You can change your selected categories anytime from your profile settings.
          </p>
          {notice ? (
            <span className="text-xs text-accent-warning sm:order-3">{notice}</span>
          ) : null}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold text-text-on-accent transition-opacity disabled:cursor-not-allowed disabled:opacity-60 sm:order-4"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {saving ? "Saving…" : "Continue"}
            {!saving ? <ArrowRight size={18} /> : null}
          </button>
        </div>
      </div>
    </main>
  );
}
