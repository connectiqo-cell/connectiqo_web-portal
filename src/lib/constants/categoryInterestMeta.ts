/**
 * Presentation metadata for interest onboarding cards. Ported from
 * connectfront/src/constants/categoryInterestMeta.js. The `icon` field is a
 * semantic key mapped to a lucide-react component where it's rendered
 * (mobile used MaterialIcons glyph names — not applicable on web).
 */
export const CATEGORY_INTEREST_META: Record<
  string,
  { icon: string; description: string }
> = {
  technology: { icon: "cpu", description: "Developers, AI, products & more" },
  software: { icon: "code", description: "Apps, systems & engineering" },
  "ai & machine learning": {
    icon: "brain",
    description: "ML, AI products & research",
  },
  "data science": { icon: "bar-chart", description: "Analytics, data & insights" },
  cybersecurity: { icon: "shield", description: "Security, privacy & defense" },
  cloud: { icon: "cloud", description: "Cloud, DevOps & infra" },
  business: { icon: "briefcase", description: "Strategy, growth & leadership" },
  entrepreneurship: {
    icon: "rocket",
    description: "Startups, founders & scale",
  },
  "product management": {
    icon: "layout-dashboard",
    description: "Roadmaps, discovery & delivery",
  },
  finance: { icon: "landmark", description: "Money, markets & investing" },
  marketing: { icon: "megaphone", description: "Growth, brands & campaigns" },
  "digital marketing": {
    icon: "megaphone",
    description: "Growth, brands & campaigns",
  },
  "content creation": {
    icon: "clapperboard",
    description: "Creators, media & storytelling",
  },
  design: { icon: "palette", description: "UI, UX & visual systems" },
  photography: { icon: "camera", description: "Photo, video & production" },
  "personal development": {
    icon: "sparkles",
    description: "Mindset, habits & coaching",
  },
  health: { icon: "heart", description: "Wellness, fitness & lifestyle" },
  education: { icon: "graduation-cap", description: "Learning, teaching & mentoring" },
  legal: { icon: "gavel", description: "Law, compliance & contracts" },
  sales: { icon: "handshake", description: "Closing, pipeline & outreach" },
  other: { icon: "sparkle", description: "Something else entirely" },
};

const DEFAULT_META = { icon: "shapes", description: "Mentors in this space" };

export function getCategoryInterestMeta(categoryName = "") {
  const lower = String(categoryName || "").trim().toLowerCase();

  let meta = CATEGORY_INTEREST_META[lower];
  if (!meta) {
    for (const [key, value] of Object.entries(CATEGORY_INTEREST_META)) {
      if (lower.includes(key) || key.includes(lower)) {
        meta = value;
        break;
      }
    }
  }

  return meta ?? DEFAULT_META;
}
