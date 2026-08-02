import {
  Bot,
  Briefcase,
  Camera,
  Cloud,
  Code2,
  Database,
  Gavel,
  GraduationCap,
  Grid3x3,
  HeartPulse,
  Landmark,
  LineChart,
  type LucideIcon,
  Megaphone,
  Palette,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * mentor_categories.icon stores Google Material Symbols names (ported from
 * the mobile app's Android icon set), not Lucide names — map the ones
 * currently in use to their closest Lucide equivalent.
 */
const MATERIAL_ICON_MAP: Record<string, LucideIcon> = {
  smart_toy: Bot,
  developer_mode: Code2,
  cloud: Cloud,
  work: Briefcase,
  trending_up: TrendingUp,
  supervisor_account: Users,
  account_balance: Landmark,
  campaign: Megaphone,
  star: Star,
  photo_camera: Camera,
  self_improvement: Sparkles,
  school: GraduationCap,
  gavel: Gavel,
  insights: LineChart,
};

/** Name-based fallback for categories whose `icon` is still the unset "category" placeholder. */
const CATEGORY_NAME_ICON_MAP: Record<string, LucideIcon> = {
  "Data Science": Database,
  Cybersecurity: Shield,
  "Design & UX": Palette,
  "Health & Wellness": HeartPulse,
};

/**
 * Resolve a category's display icon. `icon` is the raw DB value (a Material
 * Symbols name — sometimes unset/"category", occasionally whitespace-
 * corrupted); `name` is the category's display name, used as a fallback.
 */
export function getCategoryIcon(icon?: string | null, name?: string | null): LucideIcon {
  const key = icon?.trim();
  if (key && MATERIAL_ICON_MAP[key]) return MATERIAL_ICON_MAP[key];
  if (name && CATEGORY_NAME_ICON_MAP[name]) return CATEGORY_NAME_ICON_MAP[name];
  return Grid3x3;
}
