import {
  Building2,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { RoleNavigationItem } from "@/lib/workspaceNavigation";

export const workspaceNavigationIcons: Record<RoleNavigationItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  organization: Building2,
  people: Users,
  cycles: CalendarClock,
  goals: Target,
  assessments: ClipboardCheck,
  review: UserRound,
};

export const workspaceAccentClasses: Record<RoleNavigationItem["accent"], string> = {
  "--accent-blue": "text-accent-blue",
  "--accent-red": "text-accent-red",
  "--accent-purple": "text-accent-purple",
  "--accent-green": "text-accent-green",
};

export const workspaceActiveClasses: Record<RoleNavigationItem["accent"], string> = {
  "--accent-blue":
    "relative bg-accent-blue/[0.1] font-medium text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-blue",
  "--accent-red":
    "relative bg-accent-red/[0.09] font-medium text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-red",
  "--accent-purple":
    "relative bg-accent-purple/[0.1] font-medium text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-purple",
  "--accent-green":
    "relative bg-accent-green/[0.1] font-medium text-foreground before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-e-full before:bg-accent-green",
};
