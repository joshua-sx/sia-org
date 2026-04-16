import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import TemplateSelector, { TEMPLATES } from "./TemplateSelector";
import CustomLevelBuilder from "./CustomLevelBuilder";
import AccordionBuilder, { UnitNode } from "./AccordionBuilder";
import TreePreview from "./TreePreview";

const STEP_LABELS = ["Hierarchy", "Structure", "Done"];
const TOTAL_STEPS = 3;

const LEVEL_DOT_COLORS = [
  "bg-primary",
  "bg-green-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
];

const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [confirmedLevels, setConfirmedLevels] = useState<string[]>([]);
  const [units, setUnits] = useState<UnitNode[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Reward ceremony state
  const [phase, setPhase] = useState<"anticipation" | "reveal" | "afterglow">("anticipation");
  const [rewardProgress, setRewardProgress] = useState(0);
  const [treeNodesShown, setTreeNodesShown] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

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
    setUnits([]);
    setStep(3);
  };

  const startRewardCeremony = () => {
    setStep(4);
    setPhase("anticipation");
    setRewardProgress(0);
    setTreeNodesShown(0);
    setShowStats(false);
    setShowCTA(false);
  };

  // Flatten units for sequential reveal
  const flattenUnits = useCallback((nodes: UnitNode[], depth = 0): { name: string; depth: number }[] => {
    const result: { name: string; depth: number }[] = [];
    for (const n of nodes) {
      result.push({ name: n.name, depth });
      result.push(...flattenUnits(n.children, depth + 1));
    }
    return result;
  }, []);

  const flatNodes = flattenUnits(units);

  // Count nodes at each level
  const countAtLevel = useCallback((nodes: UnitNode[], depth: number, target: number): number => {
    if (depth === target) return nodes.length;
    return nodes.reduce((sum, n) => sum + countAtLevel(n.children, depth + 1, target), 0);
  }, []);

  // Reward ceremony animation
  useEffect(() => {
    if (step !== 4) return;

    let p = 0;
    const tick = setInterval(() => {
      p += p > 75 ? 0.8 : 2.5;
      setRewardProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          setPhase("reveal");
          let n = 0;
          const maxNodes = flatNodes.length;
          if (maxNodes === 0) {
            setShowStats(true);
            setTimeout(() => { setPhase("afterglow"); setShowCTA(true); }, 500);
            return;
          }
          const nodeIn = setInterval(() => {
            n++;
            setTreeNodesShown(n);
            if (n >= maxNodes) {
              clearInterval(nodeIn);
              setTimeout(() => setShowStats(true), 400);
              setTimeout(() => { setPhase("afterglow"); setShowCTA(true); }, 900);
            }
          }, 150);
        }, 350);
      }
    }, 30);

    return () => clearInterval(tick);
  }, [step, flatNodes.length]);

  const anticipationMessages = ["Mapping structure...", "Linking levels...", "Connecting units...", "Almost there..."];
  const msgIdx = rewardProgress < 30 ? 0 : rewardProgress < 60 ? 1 : rewardProgress < 90 ? 2 : 3;

  const hasUnits = units.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-[Space_Grotesk]">
          {step === 1 ? "Choose your hierarchy template" : step === 2 ? "Build your structure" : step === 3 ? "Review your structure" : "Done"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1
            ? "This determines the organizational levels available during setup. You can adjust later in settings."
            : step === 2
            ? confirmedLevels.join(" → ")
            : step === 3
            ? "Confirm your organizational hierarchy."
            : ""}
        </p>
      </div>

      {/* Numbered step indicator */}
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
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCompleted
                      ? "bg-primary text-primary-foreground cursor-pointer"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
                </button>
                <span className={`text-[11px] font-medium ${isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-16 h-px mx-2 mb-5 border-t border-dashed ${
                  stepNum < step ? "border-primary" : "border-border"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ Step 1: Template ═══ */}
      {step === 1 && (
        <div className="animate-fade-in" key="step-1">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardContent className="pt-6 space-y-6">
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />

              {selectedTemplate === "custom" && (
                <CustomLevelBuilder levels={customLevels} onChange={setCustomLevels} />
              )}

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
                    Confirm & Continue <ChevronRight className="ml-1 h-4 w-4" />
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
                  <button
                    className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                    onClick={skipStep2}
                  >
                    Skip for now
                  </button>
                </div>
                <Button onClick={confirmStep2} disabled={!hasUnits}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Step 3: Preview / Confirm ═══ */}
      {step === 3 && (
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
                      <div className={`h-2 w-2 rounded-full ${LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length]}`} />
                      <span className="font-semibold text-foreground">{count}</span>
                      <span className="text-muted-foreground">{level}{count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button onClick={startRewardCeremony}>
                  Confirm & Finish <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Step 4: Done — Reward Ceremony ═══ */}
      {step === 4 && (
        <div className="animate-fade-in" key="step-4">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardContent className="py-10">
              {/* Anticipation */}
              {phase === "anticipation" && (
                <div className="flex flex-col items-center justify-center space-y-5 py-8">
                  <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Building your org chart
                    </p>
                    <p className="text-xs text-muted-foreground animate-pulse">
                      {anticipationMessages[msgIdx]}
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-100"
                      style={{ width: `${rewardProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Reveal + Afterglow */}
              {(phase === "reveal" || phase === "afterglow") && (
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Checkmark */}
                  <div className="relative">
                    <div className="confetti-burst" />
                    <div className="animate-scale-in">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground font-[Space_Grotesk]">
                      Organization structure ready
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Your hierarchy is configured and ready to use.
                    </p>
                  </div>

                  {/* Hierarchy path */}
                  <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-in">
                    {confirmedLevels.map((level, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-muted-foreground/40">→</span>}
                        <div className={`h-2 w-2 rounded-full ${LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length]}`} />
                        <span className="text-sm font-medium text-foreground">{level}</span>
                      </span>
                    ))}
                  </div>

                  {/* Sequential tree reveal */}
                  {flatNodes.length > 0 && (
                    <div className="w-full max-w-xs text-left bg-muted/50 rounded-lg p-3 space-y-0.5">
                      {flatNodes.map((node, idx) =>
                        idx < treeNodesShown ? (
                          <div
                            key={idx}
                            className="flex items-center gap-2 animate-fade-in"
                            style={{ paddingLeft: node.depth * 16 }}
                          >
                            <div className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT_COLORS[node.depth % LEVEL_DOT_COLORS.length]}`} />
                            <span className="text-xs text-foreground">{node.name}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {showStats && (
                    <div className="flex gap-6 animate-fade-in">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{confirmedLevels.length}</div>
                        <div className="text-xs text-muted-foreground">Levels</div>
                      </div>
                      {confirmedLevels.map((level, i) => {
                        const count = countAtLevel(units, 0, i);
                        if (count === 0) return null;
                        return (
                          <div key={level} className="text-center">
                            <div className="text-2xl font-bold text-foreground">{count}</div>
                            <div className="text-xs text-muted-foreground">{level}s</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CTA */}
                  {showCTA && (
                    <div className="flex gap-3 pt-2 animate-fade-in">
                      <Button onClick={onComplete}>
                        Get Started <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/dashboard")}>
                        Go to Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;
