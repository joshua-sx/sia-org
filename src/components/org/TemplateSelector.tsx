import React from "react";
import { Building2, Landmark, HeartPulse, GraduationCap, LayoutList, Settings2, Check, Pencil } from "lucide-react";

export interface HierarchyTemplate {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  levels: string[];
  isCustom?: boolean;
}

const LEVEL_ACCENT_VARS = [
  "--accent-blue",
  "--accent-green",
  "--accent-yellow",
  "--accent-red",
] as const;

const accentColor = (i: number) => `hsl(var(${LEVEL_ACCENT_VARS[i % LEVEL_ACCENT_VARS.length]}))`;

export const TEMPLATES: HierarchyTemplate[] = [
  { key: "government", label: "Government", desc: "Public sector hierarchy", icon: Landmark, levels: ["Ministry", "Agency", "Bureau", "Unit"] },
  { key: "corporate", label: "Corporate", desc: "Standard business structure", icon: Building2, levels: ["Division", "Department", "Team"] },
  { key: "healthcare", label: "Healthcare", desc: "Medical org structure", icon: HeartPulse, levels: ["Facility", "Department", "Unit", "Team"] },
  { key: "education", label: "Education", desc: "Academic institution", icon: GraduationCap, levels: ["Faculty", "Department", "Programme"] },
  { key: "flat", label: "Flat", desc: "Single-level, no nesting", icon: LayoutList, levels: ["Team"] },
  { key: "custom", label: "Custom", desc: "Build your own hierarchy", icon: Settings2, levels: [], isCustom: true },
];

interface Props {
  selected: string | null;
  onSelect: (key: string) => void;
  /** Suggested by the industry chosen during Setup. Never auto-selected. */
  recommendedKey?: string | null;
}

const TemplateCard = ({
  template,
  active,
  recommended = false,
  onSelect,
}: { template: HierarchyTemplate; active: boolean; recommended?: boolean; onSelect: () => void }) => {
  const Icon = template.icon;


  return (
    <button
      onClick={onSelect}
      className={`group relative flex flex-col text-left rounded-xl border-[1.5px] p-4 pb-3.5 min-h-[155px] transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        active
          ? "border-primary bg-accent shadow-[0_0_0_2px_hsl(var(--primary)/0.15),0_4px_14px_rgba(28,25,23,0.08)]"
          : "border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06),0_1px_2px_rgba(28,25,23,0.04)] hover:border-border/80 hover:bg-card hover:shadow-[0_4px_14px_rgba(28,25,23,0.08),0_2px_4px_rgba(28,25,23,0.04)]"
      }`}
    >
      {/* Checkmark */}
      <div
        className={`absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center transition-[opacity,transform] duration-150 ${
          active ? "bg-primary scale-100 opacity-100" : "bg-muted scale-[0.25] opacity-0"
        }`}
      >
        <Check className="h-3 w-3 text-primary-foreground" />
      </div>

      {recommended && !active && (
        <span className="absolute top-3 right-3 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Recommended
        </span>
      )}


      {/* Icon + Name */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
          active ? "bg-primary/10" : "bg-muted"
        }`}>
          <Icon className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <span className="text-sm font-semibold text-foreground">{template.label}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">{template.desc}</p>

      {/* Mini hierarchy tree */}
      <div className="mt-auto space-y-0.5">
        {template.isCustom ? (
          <div className="flex items-center gap-1.5">
            <Pencil className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Define your own levels</span>
          </div>
        ) : (
          template.levels.map((level, i) => (
            <div key={i} className="flex items-center gap-1.5" style={{ paddingLeft: i > 0 ? i * 10 : 0 }}>
              {i > 0 && (
                <span className="text-[10px] text-muted-foreground/50 font-mono leading-none">└</span>
              )}
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor(i) }} />
              <span
                className={`text-[11px] font-medium ${active ? "" : "text-muted-foreground"}`}
                style={active ? { color: accentColor(i) } : undefined}
              >
                {level}
              </span>
            </div>
          ))
        )}
      </div>
    </button>
  );
};

const TemplateSelector = React.forwardRef<HTMLDivElement, Props>(({ selected, onSelect }, ref) => (
  <div ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {TEMPLATES.map((t) => (
      <TemplateCard
        key={t.key}
        template={t}
        active={selected === t.key}
        onSelect={() => onSelect(t.key)}
      />
    ))}
  </div>
));

TemplateSelector.displayName = "TemplateSelector";

export default TemplateSelector;
