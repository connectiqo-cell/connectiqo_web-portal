import {
  Briefcase,
  Camera,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  GraduationCap,
  Grid3x3,
  Handshake,
  HeartPulse,
  Laptop,
  type LucideIcon,
  Megaphone,
  Palette,
  Rocket,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

/** Cosmetic icon lookup for category chips/rows — purely presentational, has no DB dependency. */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Technology: Laptop,
  "Software Development": Code2,
  "AI & Machine Learning": Sparkles,
  "Data Science": Database,
  Cybersecurity: Shield,
  "Cloud Computing": Cloud,
  Business: Briefcase,
  Entrepreneurship: Rocket,
  "Product Management": ClipboardList,
  "Finance & Investing": TrendingUp,
  "Digital Marketing": Megaphone,
  "Content Creation": Camera,
  "Design & UX": Palette,
  "Photography & Video": Camera,
  "Personal Development": Sparkles,
  "Health & Wellness": HeartPulse,
  "Education & Coaching": GraduationCap,
  Legal: Scale,
  Sales: Handshake,
  Other: Grid3x3,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON_MAP[category] || Grid3x3;
}
