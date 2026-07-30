"use client";

import { ChevronRight, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";

import "./categories.css";

const ICONS: Record<string, string> = {
  briefcase:
    '<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/>',
  trending:
    '<path d="M4 16l5-5 4 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6h4v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  rocket:
    '<path d="M12 2c3 2 5 6 4 12l-4 3-4-3c-1-6 1-10 4-12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="1.4" fill="currentColor"/><path d="M8 15l-3 4M16 15l3 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  heart:
    '<path d="M12 20s-7-4.4-9.5-9C0.8 7.6 3 4 6.5 4 9 4 11 6 12 7.5 13 6 15 4 17.5 4 21 4 23.2 7.6 21.5 11 19 15.6 12 20 12 20Z" stroke="currentColor" stroke-width="1.6"/>',
  play: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M10 9l5 3-5 3V9Z" fill="currentColor"/>',
  star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  gamepad:
    '<rect x="3" y="8" width="18" height="9" rx="4" stroke="currentColor" stroke-width="1.7"/><path d="M8 11v3M6.5 12.5h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11.5" r="0.9" fill="currentColor"/><circle cx="18" cy="13.5" r="0.9" fill="currentColor"/>',
  bag: '<path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.7"/>',
  lotus:
    '<path d="M12 21c-4-1-6-4-6-7 2 1 4 1 6 0 2 1 4 1 6 0 0 3-2 6-6 7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 14c-2-3-1-7 0-9 1 2 2 6 0 9Z" stroke="currentColor" stroke-width="1.6"/>',
  trophy:
    '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" stroke-width="1.7"/><path d="M8 5H5v1a3 3 0 0 0 3 3M16 5h3v1a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.5"/><path d="M12 13v3M9 20h6M10 17h4v3h-4v-3Z" stroke="currentColor" stroke-width="1.6"/>',
  target:
    '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  users:
    '<circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M4 19c0-3 2.5-5 5-5s5 2 5 5" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="8" r="2.4" stroke="currentColor" stroke-width="1.5"/><path d="M15.5 14c2 0 4.5 1.6 4.5 5" stroke="currentColor" stroke-width="1.5"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="4" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="14" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="14" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.7"/>',
};

const CATEGORY_MAP: Record<string, { icon: string; desc: string }> = {
  Business: { icon: "briefcase", desc: "Startups, leadership, marketing & more" },
  "Finance & Investing": {
    icon: "trending",
    desc: "Stock market, crypto, trading & more",
  },
  "Career & Growth": {
    icon: "rocket",
    desc: "Career guidance, resume, interview prep & more",
  },
  "AI & Machine Learning": {
    icon: "cpu",
    desc: "AI, coding, data science, cybersecurity & more",
  },
  "Health & Wellness": {
    icon: "heart",
    desc: "Fitness, yoga, nutrition, mental health & more",
  },
  "Content Creation": {
    icon: "play",
    desc: "YouTube, reels, podcast, personal branding & more",
  },
  Entertainment: { icon: "star", desc: "Comedy, movies, music, celebrities & more" },
  "Gaming & Esports": {
    icon: "gamepad",
    desc: "BGMI, Free Fire, Valorant, Minecraft & more",
  },
  Lifestyle: { icon: "bag", desc: "Fashion, beauty, travel, home decor & more" },
  "Spirituality & Astrology": {
    icon: "lotus",
    desc: "Astrology, tarot, numerology, meditation & more",
  },
  "Sports & Fitness": {
    icon: "trophy",
    desc: "Cricket, football, gym, running & more",
  },
  "Education & Coaching": {
    icon: "target",
    desc: "Public speaking, time management, confidence & more",
  },
  "Parenting & Relationships": {
    icon: "users",
    desc: "Parenting tips, relationships, communication & more",
  },
  Other: { icon: "grid", desc: "Explore more unique categories" },
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

  const handleSkip = () => {
    router.push(ROUTES.home);
  };

  return (
    <div className="categories-shell">
      {/* LEFT SIDEBAR */}
      <aside className="categories-side">
        <div className="categories-brand">
          Connect<span>iqo</span>
        </div>
        <div className="categories-rule"></div>
        <h1>Let's personalize your experience</h1>
        <p className="desc">
          Choose the 5 categories you love the most. They will appear on your
          dashboard for quick access.
        </p>

        <div className="categories-stack">
          <div className="categories-glow-ring"></div>
          <div className="categories-polaroid p1"></div>
          <div className="categories-polaroid p2"></div>
          <div className="categories-polaroid p3"></div>
          <div className="categories-polaroid p4"></div>
          <div className="categories-fab">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12Z"
                stroke="#fff"
                strokeWidth="1.8"
              />
              <path
                d="M13 9l1.4 3 3 1.4-3 1.4L13 18l-1.4-3.2-3-1.4 3-1.4L13 9Z"
                fill="#fff"
              />
            </svg>
          </div>
        </div>

        <div className="categories-trust">
          <div className="shield">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path
                d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"
                stroke="#c4b5fd"
                strokeWidth="1.6"
              />
            </svg>
          </div>
          <div>
            <div className="t1">100% secure</div>
            <div className="t2">Your data is safe with us</div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN */}
      <main className="categories-main">
        <div className="categories-stepper">
          <span className="categories-step-dot active">1</span>
          <span className="categories-step-label active">Choose categories</span>
          <span className="categories-step-line"></span>
          <span className="categories-step-dot upcoming">2</span>
          <span className="categories-step-label">You're all set</span>
        </div>

        <h2 className="categories-headline">
          What are you <span className="hi">interested</span> in?
        </h2>
        <p className="categories-sub">
          Select 5 categories you love the most. They will appear on your
          dashboard for quick access.
        </p>

        <div className="categories-toolbar">
          <div className="categories-search">
            <SearchIcon size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="categories-counter-pill">
            {selected.length} / 5 selected
          </div>
        </div>

        <div className="categories-content">
          <div className="categories-grid">
            {filtered.map((cat) => {
              const isSelected = selected.includes(cat);
              const isDisabled = !isSelected && selected.length >= 5;
              const meta = CATEGORY_MAP[cat] || {
                icon: "grid",
                desc: "Learn & grow",
              };

              return (
                <button
                  key={cat}
                  onClick={() => !isDisabled && toggleCategory(cat)}
                  disabled={isDisabled}
                  className={`categories-cat ${isSelected ? "selected" : ""} ${
                    isDisabled ? "disabled" : ""
                  }`}
                >
                  <div className="categories-cat-top">
                    <div
                      className="categories-icon-badge"
                      dangerouslySetInnerHTML={{
                        __html: `<svg viewBox="0 0 24 24" fill="none">${
                          ICONS[meta.icon]
                        }</svg>`,
                      }}
                    />
                    <div className="categories-check">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3>{cat}</h3>
                  <p>{meta.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="categories-side-panel">
            <div className="categories-sp-title">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1L12 2Z" />
              </svg>
              Your top 5 categories
            </div>
            <p className="categories-sp-desc">
              These categories will appear on your dashboard for quick access.
            </p>
            <div>
              {[1, 2, 3, 4, 5].map((num) => {
                const cat = selected[num - 1];
                const meta = cat && CATEGORY_MAP[cat];

                return (
                  <div
                    key={num}
                    className={`categories-slot ${cat ? "filled" : ""}`}
                  >
                    <span className="num">{num}</span>
                    {meta && (
                      <span
                        className="icon"
                        dangerouslySetInnerHTML={{
                          __html: `<svg viewBox="0 0 24 24" fill="none">${
                            ICONS[meta.icon]
                          }</svg>`,
                        }}
                      />
                    )}
                    <span className="label">
                      {cat || "Select a category"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="categories-footer">
          <button className="categories-btn-skip" onClick={handleSkip}>
            Skip for now
          </button>
          <div className="categories-hint">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12 11v5M12 8v.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            You can change your selected categories anytime from your profile
            settings.
          </div>
          <button
            className="categories-btn-continue"
            onClick={handleContinue}
            disabled={loading || selected.length === 0}
          >
            Continue
            <ChevronRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
