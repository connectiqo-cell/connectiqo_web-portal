"use client";

import { ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";

const CATEGORY_ICONS: Record<string, string> = {
  "Business": "💼",
  "Finance & Investing": "📈",
  "AI & Machine Learning": "🤖",
  "Health & Wellness": "❤️",
  "Education & Coaching": "📚",
  "Content Creation": "▶️",
  "Personal Development": "🎯",
  "Lifestyle": "🛍️",
  "Spirituality & Astrology": "✨",
  "Sports & Fitness": "🏆",
  "Gaming & Esports": "🎮",
  "Entertainment": "⭐",
  "Parenting & Relationships": "👨‍👩‍👧",
  "Other": "◻️",
};

export default function CategoriesOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = MENTOR_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat].slice(-5)
    );
  };

  const handleContinue = async () => {
    if (!user || selected.length === 0) return;
    setLoading(true);
    try {
      await profileApi.updateMentorProfile({
        userId: user.id,
        category: selected[0],
      });
      router.push(ROUTES.home);
    } catch (err) {
      console.error("Error saving categories:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <div className="hidden sm:flex w-1/3 bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-primary flex-col items-center justify-center p-8 sm:p-12 text-white">
        <div className="text-center max-w-sm">
          <h1 className="text-4xl font-extrabold mb-4">Connectiqo</h1>
          <p className="text-xl font-bold mb-6">Let's personalize your experience</p>
          <p className="text-sm opacity-90 mb-8">
            Choose the 5 categories you love the most. They will appear on your dashboard for quick access.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold">Personalized</p>
                <p className="text-sm opacity-75">Tailored to your interests</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold">100% Secure</p>
                <p className="text-sm opacity-75">Your data is safe with us</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col p-6 sm:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-semibold text-accent-link mb-2">Step 1 of 2</div>
            <h2 className="text-3xl font-bold text-text-primary">What are you <span className="text-accent-link">interested</span> in?</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-accent-link">{selected.length} / 5 selected</div>
            <div className="text-xs text-text-muted">You're All Set</div>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-6">
          Select 5 categories you love the most. They will appear on your dashboard for quick access.
        </p>

        {/* Search */}
        <div className="mb-8">
          <div className="flex items-center gap-2 px-4 py-3 bg-surface-sheet rounded-xl border border-border-light">
            <Search size={18} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 flex-1">
          {filtered.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                selected.includes(cat)
                  ? "border-accent-link bg-accent-link/10"
                  : "border-border-light bg-surface-panel hover:border-accent-link/50"
              }`}
            >
              <div className="flex-1">
                <p className="font-bold text-text-primary">{cat}</p>
                <p className="text-xs text-text-muted mt-1">Learn & grow</p>
              </div>
              <input
                type="checkbox"
                checked={selected.includes(cat)}
                onChange={() => {}}
                className="w-5 h-5 rounded-full accent-accent-link cursor-pointer mt-1"
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push(ROUTES.home)}
            className="px-6 py-3 text-text-secondary font-semibold rounded-full border border-border-light hover:bg-surface-chip transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={loading || selected.length === 0}
            className="flex-1 px-6 py-3 bg-accent-primary text-white font-semibold rounded-full hover:bg-accent-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="text-xs text-text-muted text-center mt-6">
          You can change your selected categories anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
