import {
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutList,
  Settings2,
} from "lucide-react";
import type { ElementType } from "react";

export interface HierarchyTemplate {
  key: string;
  label: string;
  desc: string;
  icon: ElementType;
  levels: string[];
  isCustom?: boolean;
}

export const TEMPLATES: HierarchyTemplate[] = [
  { key: "government", label: "Government", desc: "Public sector hierarchy", icon: Landmark, levels: ["Ministry", "Agency", "Bureau", "Unit"] },
  { key: "corporate", label: "Corporate", desc: "Standard business structure", icon: Building2, levels: ["Division", "Department", "Team"] },
  { key: "healthcare", label: "Healthcare", desc: "Medical org structure", icon: HeartPulse, levels: ["Facility", "Department", "Unit", "Team"] },
  { key: "education", label: "Education", desc: "Academic institution", icon: GraduationCap, levels: ["Faculty", "Department", "Programme"] },
  { key: "flat", label: "Flat", desc: "Single-level, no nesting", icon: LayoutList, levels: ["Team"] },
  { key: "custom", label: "Custom", desc: "Build your own hierarchy", icon: Settings2, levels: [], isCustom: true },
];

/** Maps the industry chosen during Setup to a sensible template suggestion. */
export function recommendedTemplateFor(industry?: string | null): string | null {
  switch ((industry ?? "").toLowerCase()) {
    case "government": return "government";
    case "healthcare": return "healthcare";
    case "education": return "education";
    case "aviation":
    case "finance":
    case "hospitality": return "corporate";
    default: return null;
  }
}
