import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, ArrowLeft, Eye, EyeOff, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { OnboardingPageShell } from "@/components/onboarding/OnboardingPageShell";
import { OnboardingStepHeader } from "@/components/onboarding/OnboardingStepHeader";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import { useOnboardingContext } from "@/components/onboarding/OnboardingContext";
import { friendlyError } from "@/lib/siaErrors";
import TemplateSelector, { TEMPLATES } from "./TemplateSelector";
import CustomLevelBuilder from "./CustomLevelBuilder";
import AccordionBuilder, { UnitNode } from "./AccordionBuilder";
import TreePreview from "./TreePreview";
import type { UseMutationResult } from "@tanstack/react-query";
import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import type { OrgUnit } from "@/hooks/useOrgUnits";


const STEP_LABELS = ["Hierarchy", "Structure", "Review"];
const TOTAL_STEPS = 3;
const STRUCTURE_ACCENT = "--accent-red";

const LEVEL_DOT_COLORS = [
  "hsl(var(--accent-blue))",
  "hsl(var(--accent-green))",
  "hsl(var(--accent-yellow))",
  "hsl(var(--accent-red))",
  "hsl(var(--accent-blue))",
];

interface SetupWizardProps {
  isOnboarding?: boolean;
  onComplete: () => void;
  createTypes: UseMutationResult<OrgUnitType[], Error, { name: string; level: number }[]>;
  addUnit: UseMutationResult<OrgUnit, Error, { name: string; unit_type_id: string; parent_id?: string | null }>;
}

const SetupWizard = ({ isOnboarding = false, onComplete, createTypes, addUnit }: SetupWizardProps) => {
  const navigate = useNavigate();
  const { setFooterSuppressed } = useOnboardingContext();

  useEffect(() => {
    if (!isOnboarding) return;
    setFooterSuppressed(true);
    return () => setFooterSuppressed(false);
  }, [isOnboarding, setFooterSuppressed]);

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [confirmedLevels, setConfirmedLevels] = useState<string[]>([]);
  const [units, setUnits] = useState<UnitNode[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [done, setDone] = useState(false);

  const getLevels = () => {
    if (selectedTemplate === "custom") return customLevels;
    const t = TEMPLATES.find((t) => t.key === selectedTemplate);
    return t?.levels ?? [];
  };

  const canProceedStep1 = () => getLevels().length >= 1;

  const goToStep = (target: number) => {
    if (target < step) setStep(target);
  };

  const confirmStep1 = () => {
    const levels = getLevels();
    if (levels.length < 1) return;
    setConfirmedLevels(levels);
    setStep(2);
  };

  const confirmStep2 = () => {
    setStep(3);
  };

  const skipStep2 = () => {
    setStep(3);
  };

  const [saving, setSaving] = useState(false);

  const confirmAndSave = async () => {
    setSaving(true);

    try {
      // 1. Persist levels
      const typeRows = confirmedLevels.map((name, i) => ({ name, level: i + 1 }));
      const createdTypes = await createTypes.mutateAsync(typeRows);

      // Build a map: level number → created type id
      const levelToTypeId: Record<number, string> = {};
      createdTypes.forEach((t) => { levelToTypeId[t.level] = t.id; });

      // 2. Persist units depth-by-depth: siblings within a depth run in
      // parallel, but a depth must finish before its children can reference
      // the real parent ids it just created.
      const persistNodes = async (nodes: UnitNode[], depth: number, parentId: string | null) => {
        const typeId = levelToTypeId[depth + 1]; // levels are 1-indexed
        if (!typeId) return;
        const createdNodes = await Promise.all(
          nodes.map((node) =>
            addUnit.mutateAsync({ name: node.name, unit_type_id: typeId, parent_id: parentId }),
          ),
        );
        await Promise.all(
          nodes.map((node, i) =>
            node.children.length > 0
              ? persistNodes(node.children, depth + 1, createdNodes[i].id)
              : Promise.resolve(),
          ),
        );
      };

      if (units.length > 0) {
        await persistNodes(units, 0, null);
      }
    } catch (err: unknown) {
      toast.error("Error saving structure", {
        description: friendlyError(err, "Something went wrong. Please try again."),
      });
      setSaving(false);
      return;
    }

    setSaving(false);
    setDone(true);
  };

  // Count nodes at each level
  const countAtLevel = useCallback((nodes: UnitNode[], depth: number, target: number): number => {
    if (depth === target) return nodes.length;
    return nodes.reduce((sum, n) => sum + countAtLevel(n.children, depth + 1, target), 0);
  }, []);

  const hasUnits = units.length > 0;

  const wizardContent = (
    <div className={`space-y-6 ${isOnboarding ? "" : "mx-auto max-w-4xl p-6 md:p-10"}`}>
      {isOnboarding ? (
        <OnboardingStepHeader
          eyebrow="STRUCTURE"
          eyebrowAccent={STRUCTURE_ACCENT}
          title="Build your organization"
          subtitle="Add levels first, then place your units."
          localStepLabel={`STRUCTURE · ${STEP_LABELS[step - 1]?.toUpperCase() ?? "HIERARCHY"} ${step} OF ${TOTAL_STEPS}`}
          criteriaAccent={STRUCTURE_ACCENT}
          criteria={[
            { label: "At least 1 level defined", met: getLevels().length >= 1 },
            { label: "At least 1 unit created", met: hasUnits },
          ]}
        />
      ) : (
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-[Space_Grotesk] text-balance">
            {step === 1
              ? "Choose your hierarchy template"
              : step === 2
                ? "Build your structure"
                : done
                  ? "Structure saved"
                  : "Review your structure"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {step === 1
              ? selectedTemplate === "custom"
                ? "Define the levels for your organization. Drag to reorder, up to 5 levels."
                : "This determines the organizational levels available during setup. You can adjust later in settings."
              : step === 2
                ? confirmedLevels.join(" → ")
                : done
                  ? ""
                  : "Confirm your organizational hierarchy."}
          </p>
        </div>
      )}

      {/* Numbered step indicator — onboarding mode relies on the header's
          localStepLabel text instead, to avoid duplicating progress UI. */}
      {!isOnboarding && (
      <div className="flex items-center justify-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;

          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => isCompleted && goToStep(stepNum)}
                  disabled={!isCompleted}
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isCompleted
                      ? "cursor-pointer"
                      : isCurrent
                      ? "ring-2"
                      : ""
                  }`}
                  style={
                    isCompleted || isCurrent
                      ? {
                          backgroundColor: `hsl(var(${STRUCTURE_ACCENT}))`,
                          color: "white",
                          boxShadow: isCurrent ? `0 0 0 2px hsl(var(${STRUCTURE_ACCENT}) / 0.25)` : undefined,
                          transitionProperty: "background-color, box-shadow, transform",
                          transitionDuration: "150ms",
                        }
                      : {
                          backgroundColor: "hsl(var(--muted))",
                          color: "hsl(var(--ink-subtle))",
                          transitionProperty: "background-color, transform",
                          transitionDuration: "150ms",
                        }
                  }
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
                </button>
                <span
                  className={`text-[11px] font-medium ${
                    isCurrent || isCompleted ? "text-foreground" : "text-[hsl(var(--ink-subtle))]"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className="w-16 h-px mx-2 mb-5 border-t border-dashed"
                  style={{
                    borderColor: stepNum < step ? `hsl(var(${STRUCTURE_ACCENT}))` : "hsl(var(--hairline))",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* ═══ Step 1: Template ═══ */}
      {step === 1 && (
        <div className="animate-fade-in" key="step-1">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardContent className="pt-6 space-y-6">
              <AnimatePresence initial={false} mode="wait">
                {selectedTemplate === "custom" ? (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--accent-blue)/0.1)]">
                          <Settings2 className="h-4 w-4 text-[hsl(var(--accent-blue))]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Custom hierarchy</p>
                          <p className="text-[11px] text-muted-foreground">Build your own levels</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
                      >
                        ← Choose a template instead
                      </button>
                    </div>
                    <CustomLevelBuilder levels={customLevels} onChange={setCustomLevels} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  >
                    <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" size="sm" disabled>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-3">
                  {/* Level path preview */}
                  {selectedTemplate && selectedTemplate !== "custom" && getLevels().length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      {getLevels().map((l, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-xs font-medium text-muted-foreground">{l}</span>
                          {i < getLevels().length - 1 && (
                            <span className="text-muted-foreground/40 text-xs">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button onClick={confirmStep1} disabled={!canProceedStep1()}>
                    Continue <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Step 2: Build Structure ═══ */}
      {step === 2 && (
        <div className="animate-fade-in" key="step-2">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Build your structure</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {confirmedLevels.join(" → ")}
                  </p>
                </div>
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-1.5"
                >
                  {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPreview ? "Hide" : "Preview"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPreview && (
                <TreePreview
                  units={units}
                  levels={confirmedLevels}
                  onClose={() => setShowPreview(false)}
                />
              )}

              <AccordionBuilder
                levels={confirmedLevels}
                units={units}
                onUnitsChange={setUnits}
              />

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  {!hasUnits && (
                    <button
                      className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                      onClick={skipStep2}
                    >
                      Skip
                    </button>
                  )}
                </div>
                <Button onClick={confirmStep2} disabled={!hasUnits}>
                  Continue <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Step 3: Preview / Confirm, then a static success card ═══ */}
      {step === 3 && !done && (
        <div className="animate-fade-in" key="step-3">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardHeader>
              <CardTitle className="text-lg">Review your structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {units.length > 0 ? (
                <TreePreview
                  units={units}
                  levels={confirmedLevels}
                  onClose={() => {}}
                />
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No units added yet. You can add them later from the org structure page.
                  </p>
                </div>
              )}

              {/* Stats summary */}
              <div className="flex gap-4 justify-center py-2">
                {confirmedLevels.map((level, i) => {
                  const count = countAtLevel(units, 0, i);
                  return (
                    <div key={level} className="flex items-center gap-1.5 text-sm">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length] }}
                      />
                      <span className="font-semibold text-foreground tabular-nums">{count}</span>
                      <span className="text-[hsl(var(--ink-muted))]">{level}{count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={saving}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button onClick={confirmAndSave} disabled={saving}>
                  {saving ? "Saving…" : "Save structure"}
                  {!saving && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && done && isOnboarding && (
        <StepSuccess
          eyebrow="Structure complete"
          title="Your hierarchy is saved"
          description="Next, add the people who work inside it."
          primaryLabel="Continue"
          onPrimary={onComplete}
        />
      )}

      {step === 3 && done && !isOnboarding && (
        <div className="animate-fade-in" key="step-3-done">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "hsl(var(--accent-green) / 0.14)" }}
                >
                  <CheckCircle2 className="h-10 w-10" style={{ color: "hsl(var(--accent-green))" }} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground font-[Space_Grotesk]">
                    Structure saved
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Your hierarchy is saved. Next, add the people who work inside it.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={onComplete}>
                    Continue <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                    Go to dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  if (isOnboarding) {
    return <OnboardingPageShell>{wizardContent}</OnboardingPageShell>;
  }

  return wizardContent;
};

export default SetupWizard;
