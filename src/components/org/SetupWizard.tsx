import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
import TemplateSelector, { TEMPLATES } from "./TemplateSelector";
import CustomLevelBuilder from "./CustomLevelBuilder";

const STEP_LABELS = ["Hierarchy", "First Units", "Done"];
const TOTAL_STEPS = 3;

const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [confirmedLevels, setConfirmedLevels] = useState<string[]>([]);
  const [topLevelUnits, setTopLevelUnits] = useState<string[]>([""]);

  // Reward design state
  const [showAnticipation, setShowAnticipation] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

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
    // Trigger reward sequence
    setShowAnticipation(true);
    setShowReveal(false);
    setShowButtons(false);
  };

  const skipStep2 = () => {
    setTopLevelUnits([""]);
    setStep(3);
    setShowAnticipation(true);
    setShowReveal(false);
    setShowButtons(false);
  };

  // Reward design: anticipation → reveal → afterglow
  useEffect(() => {
    if (step !== 3) return;
    if (!showAnticipation) return;

    const revealTimer = setTimeout(() => {
      setShowAnticipation(false);
      setShowReveal(true);
    }, 1800);

    return () => clearTimeout(revealTimer);
  }, [step, showAnticipation]);

  useEffect(() => {
    if (!showReveal) return;
    const buttonTimer = setTimeout(() => setShowButtons(true), 1200);
    return () => clearTimeout(buttonTimer);
  }, [showReveal]);

  const addUnitField = () => {
    if (topLevelUnits.length < 5) setTopLevelUnits([...topLevelUnits, ""]);
  };

  const updateUnitField = (idx: number, value: string) => {
    const copy = [...topLevelUnits];
    copy[idx] = value;
    setTopLevelUnits(copy);
  };

  const filledUnitsCount = topLevelUnits.filter((u) => u.trim()).length;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 md:p-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Set up your organization structure
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure how your organization is structured.
        </p>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Clickable breadcrumb stepper */}
      <div className="flex gap-6 text-sm">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;
          const isFuture = stepNum > step;

          return (
            <button
              key={i}
              onClick={() => isCompleted && goToStep(stepNum)}
              disabled={isFuture}
              className={`flex items-center gap-1.5 transition-colors ${
                isCompleted
                  ? "cursor-pointer hover:text-primary"
                  : isFuture
                  ? "cursor-default"
                  : ""
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : isCurrent ? (
                <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/10" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span
                className={
                  isCompleted
                    ? "font-medium text-foreground"
                    : isCurrent
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Hierarchy */}
      {step === 1 && (
        <div className="animate-fade-in" key="step-1">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardHeader>
              <CardTitle className="text-lg">Choose your hierarchy template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />

              {selectedTemplate === "custom" && (
                <CustomLevelBuilder levels={customLevels} onChange={setCustomLevels} />
              )}

              <div className="flex justify-end">
                <Button onClick={confirmStep1} disabled={!canProceedStep1()}>
                  Confirm & Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: First Units */}
      {step === 2 && (
        <div className="animate-fade-in" key="step-2">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardHeader>
              <CardTitle className="text-lg">
                Add your first {confirmedLevels[0]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can add up to 5 top-level {confirmedLevels[0]?.toLowerCase()}s now, or skip
                and add them later.
              </p>
              {topLevelUnits.map((val, idx) => (
                <Input
                  key={idx}
                  placeholder={`${confirmedLevels[0]} name`}
                  value={val}
                  onChange={(e) => updateUnitField(idx, e.target.value)}
                />
              ))}
              {topLevelUnits.length < 5 && (
                <Button variant="outline" size="sm" onClick={addUnitField}>
                  + Add another
                </Button>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <button
                    className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
                    onClick={skipStep2}
                  >
                    Skip for now
                  </button>
                </div>
                <Button
                  onClick={confirmStep2}
                  disabled={!topLevelUnits.some((u) => u.trim())}
                >
                  Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Done — Reward Design */}
      {step === 3 && (
        <div className="animate-fade-in" key="step-3">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02)]">
            <CardContent className="py-10">
              {/* Anticipation phase */}
              {showAnticipation && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Setting things up…
                  </p>
                </div>
              )}

              {/* Reveal + Afterglow */}
              {showReveal && (
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Confetti burst */}
                  <div className="relative">
                    <div className="confetti-burst" />
                    <div className="animate-scale-in">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="animate-fade-in space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                      You're all set!
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Your organization structure is ready to go.
                    </p>
                  </div>

                  {/* Stats framing */}
                  <div className="flex gap-6 animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{confirmedLevels.length}</div>
                      <div className="text-xs text-muted-foreground">Hierarchy levels</div>
                    </div>
                    {filledUnitsCount > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{filledUnitsCount}</div>
                        <div className="text-xs text-muted-foreground">Units added</div>
                      </div>
                    )}
                  </div>

                  {/* Hierarchy path */}
                  <div className="animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
                    <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
                      {confirmedLevels.map((level, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-muted-foreground/50">→</span>}
                          <span className="font-medium text-foreground">{level}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Buttons — delayed afterglow */}
                  {showButtons && (
                    <div className="flex gap-3 pt-2 animate-fade-in">
                      <Button onClick={onComplete}>
                        Get Started <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="mr-1 h-4 w-4" /> Go to Dashboard
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
