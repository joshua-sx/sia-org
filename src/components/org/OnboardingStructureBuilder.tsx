import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Circle, Eye, EyeOff, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OnboardingActionFooter } from "@/components/onboarding/OnboardingStepFrame";
import TemplateSelector, { TEMPLATES } from "./TemplateSelector";
import CustomLevelBuilder from "./CustomLevelBuilder";
import AccordionBuilder, { UnitNode } from "./AccordionBuilder";
import TreePreview from "./TreePreview";
import type { UseMutationResult } from "@tanstack/react-query";
import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import { playSuccessCue } from "@/lib/completionSounds";
import { friendlyError } from "@/lib/siaErrors";
import { persistOrgStructure } from "@/lib/persistOrgStructure";

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

function TaskCheck({ label, met }: { label: string; met: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--ink-muted))]">
      {met ? (
        <Check className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent-green))" }} strokeWidth={2.5} />
      ) : (
        <Circle className="h-3.5 w-3.5 text-[hsl(var(--ink-subtle))]" />
      )}
      <span className={met ? "text-foreground" : undefined}>{label}</span>
    </span>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

interface Props {
  industry?: string | null;
  onComplete: () => void | Promise<void>;
  createTypes: UseMutationResult<OrgUnitType[], Error, { name: string; level: number }[]>;
  addUnit: UseMutationResult<OrgUnit, Error, { name: string; unit_type_id: string; parent_id?: string | null }>;
}

/** Structure step for onboarding: one screen, progressive disclosure, no
 *  nested numbered wizard. */
export default function OnboardingStructureBuilder({ industry, onComplete, createTypes, addUnit }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [units, setUnits] = useState<UnitNode[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const recommended = useMemo(() => recommendedTemplateFor(industry), [industry]);

  const levels = useMemo(() => {
    if (selectedTemplate === "custom") return customLevels;
    return TEMPLATES.find((t) => t.key === selectedTemplate)?.levels ?? [];
  }, [selectedTemplate, customLevels]);

  const structureChosen = levels.length >= 1;
  const hasUnits = units.length > 0;
  const canContinue = structureChosen && hasUnits;

  const save = async () => {
    if (!canContinue) return;
    setSaving(true);
    try {
      await persistOrgStructure({
        levels,
        units,
        createTypes,
        addUnit,
        requireUnits: true,
      });
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Could not save your structure"));
      setSaving(false);
      return;
    }
    setSaving(false);
    playSuccessCue();
    await onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <TaskCheck label="Structure selected" met={structureChosen} />
        <TaskCheck label="At least one unit added" met={hasUnits} />
      </div>

      <Section title="Choose a structure" description="Pick the levels your organization uses.">
        <AnimatePresence initial={false} mode="wait">
          {selectedTemplate === "custom" ? (
            <motion.div
              key="custom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--accent-red)/0.1)]">
                    <Settings2 className="h-4 w-4" style={{ color: "hsl(var(--accent-red))" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Custom hierarchy</p>
                    <p className="text-[11px] text-[hsl(var(--ink-muted))]">Build your own levels</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                  Choose a template
                </Button>
              </div>
              <CustomLevelBuilder levels={customLevels} onChange={setCustomLevels} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            >
              <TemplateSelector
                selected={selectedTemplate}
                onSelect={setSelectedTemplate}
                recommendedKey={recommended}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <AnimatePresence initial={false}>
        {structureChosen && (
          <motion.div
            key="units"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <Section title="Add organization units" description={levels.join(" → ")}>
              <div className="mb-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)} className="gap-1.5">
                  {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPreview ? "Hide preview" : "Preview"}
                </Button>
              </div>
              {showPreview && (
                <div className="mb-3">
                  <TreePreview units={units} levels={levels} onClose={() => setShowPreview(false)} />
                </div>
              )}
              <AccordionBuilder levels={levels} units={units} onUnitsChange={setUnits} />
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingActionFooter
        backHref="/onboarding/setup"
        primaryLabel="Continue"
        onPrimary={() => void save()}
        primaryDisabled={!canContinue}
        disabledReason="Choose a structure and add at least one unit to continue."
        loading={saving}
      />
    </div>
  );
}
