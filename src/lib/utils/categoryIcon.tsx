import {
  BarChart3,
  Braces,
  Brain,
  Briefcase,
  Camera,
  Clapperboard,
  Cloud,
  Cpu,
  Gavel,
  GraduationCap,
  Handshake,
  Heart,
  LayoutDashboard,
  Landmark,
  type LucideIcon,
  Megaphone,
  Palette,
  Rocket,
  Shapes,
  Shield,
  Sparkle,
  Sparkles,
} from "lucide-react";

/** Maps the semantic icon keys in categoryInterestMeta.ts to lucide-react components. */
const ICON_MAP: Record<string, LucideIcon> = {
  cpu: Cpu,
  code: Braces,
  brain: Brain,
  "bar-chart": BarChart3,
  shield: Shield,
  cloud: Cloud,
  briefcase: Briefcase,
  rocket: Rocket,
  "layout-dashboard": LayoutDashboard,
  landmark: Landmark,
  megaphone: Megaphone,
  clapperboard: Clapperboard,
  palette: Palette,
  camera: Camera,
  sparkles: Sparkles,
  heart: Heart,
  "graduation-cap": GraduationCap,
  gavel: Gavel,
  handshake: Handshake,
  sparkle: Sparkle,
  shapes: Shapes,
};

export function resolveCategoryIcon(key: string | null | undefined): LucideIcon {
  return (key && ICON_MAP[key]) || Shapes;
}
