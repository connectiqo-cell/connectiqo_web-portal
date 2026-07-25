"use client";

import { ArrowRight, Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveCategories } from "@/lib/api/contentApi";
import { profileApi } from "@/lib/api/profileApi";
import { getCategoryInterestMeta } from "@/lib/constants/categoryInterestMeta";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";
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

  const count = selected.length;
  const canContinue = count === MAX_LEARNER_INTERESTS;

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
      router.push(ROUTES.home);
    } catch (error) {
      setNotice((error as Error)?.message || "Could not save interests");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
          Choose <span className="text-accent-link">{MIN_LEARNER_INTERESTS} categories</span>
        </h1>
        <p className="text-text-muted">
          Select {MIN_LEARNER_INTERESTS} categories you&apos;re most interested in mentors.
        </p>
      </div>

      {loadingCategories ? (
        <div className="flex flex-1 items-center justify-center py-16 text-text-muted">
          Loading categories…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((category) => {
            const meta = getCategoryInterestMeta(category);
            const Icon = resolveCategoryIcon(meta.icon);
            const isSelected = selected.some((c) => c.toLowerCase() === category.toLowerCase());
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleToggle(category)}
                aria-pressed={isSelected}
                className={`relative flex min-h-[148px] flex-col items-center rounded-2xl border p-4 text-center transition-colors ${
                  isSelected
                    ? "border-accent-link bg-surface-panel"
                    : "border-border-light bg-surface-panel/60 hover:border-border-default"
                }`}
              >
                <span
                  className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full ${
                    isSelected ? "bg-accent-link text-text-on-accent" : "bg-surface-chip text-text-muted"
                  }`}
                >
                  {isSelected ? <Check size={12} /> : <Plus size={12} />}
                </span>

                <span
                  className={`mb-3 mt-1 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isSelected ? "bg-accent-link/20 text-accent-link" : "bg-accent-secondary/15 text-accent-secondary"
                  }`}
                >
                  <Icon size={24} />
                </span>

                <span
                  className={`text-sm font-extrabold ${isSelected ? "text-accent-link" : "text-text-primary"}`}
                >
                  {category}
                </span>
                <span className="mt-1 text-xs leading-tight text-text-muted">{meta.description}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-t-3xl border-t border-border-light bg-surface-sheet px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-secondary">
            {count} / {MAX_LEARNER_INTERESTS} selected
          </span>
          {notice ? <span className="text-xs text-accent-warning">{notice}</span> : null}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || saving}
          className="flex h-13 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold text-text-on-accent transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          {saving ? "Saving…" : "Continue"}
          {!saving ? <ArrowRight size={18} /> : null}
        </button>
        <p className="text-center text-xs text-text-muted">You can change this later</p>
      </div>
    </main>
  );
}
