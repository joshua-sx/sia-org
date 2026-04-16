import { Card, CardContent } from "@/components/ui/card";
import { Building2, Landmark, HeartPulse, GraduationCap, LayoutList, Settings2 } from "lucide-react";

export interface HierarchyTemplate {
  key: string;
  label: string;
  icon: React.ElementType;
  levels: string[];
}

export const TEMPLATES: HierarchyTemplate[] = [
  { key: "government", label: "Government", icon: Landmark, levels: ["Ministry", "Directorate", "Division", "Section", "Unit"] },
  { key: "corporate", label: "Corporate", icon: Building2, levels: ["Division", "Department", "Team"] },
  { key: "healthcare", label: "Healthcare", icon: HeartPulse, levels: ["Facility", "Department", "Ward"] },
  { key: "education", label: "Education", icon: GraduationCap, levels: ["Faculty", "Department", "Programme"] },
  { key: "flat", label: "Flat", icon: LayoutList, levels: ["Department"] },
  { key: "custom", label: "Custom", icon: Settings2, levels: [] },
];

interface Props {
  selected: string | null;
  onSelect: (key: string) => void;
}

import React from "react";

const TemplateSelector = React.forwardRef<HTMLDivElement, Props>(({ selected, onSelect }, ref) => (
  <div ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
    {TEMPLATES.map((t) => {
      const Icon = t.icon;
      const isSelected = selected === t.key;
      return (
        <Card
          key={t.key}
          className={`cursor-pointer transition-all hover:border-primary/50 ${
            isSelected ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={() => onSelect(t.key)}
        >
          <CardContent className="flex flex-col items-center gap-2 p-5">
            <Icon className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold">{t.label}</span>
            {t.levels.length > 0 && isSelected && (
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {t.levels.join(" → ")}
              </p>
            )}
          </CardContent>
        </Card>
      );
    })}
  </div>
));

TemplateSelector.displayName = "TemplateSelector";

export default TemplateSelector;
