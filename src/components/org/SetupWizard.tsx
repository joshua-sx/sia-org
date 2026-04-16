import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import TemplateSelector, { TEMPLATES } from "./TemplateSelector";
import CustomLevelBuilder from "./CustomLevelBuilder";

const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(2);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [confirmedLevels, setConfirmedLevels] = useState<string[]>([]);
  const [topLevelUnits, setTopLevelUnits] = useState<string[]>([""]);

  const progress = (step / 4) * 100;

  const getLevels = () => {
    if (selectedTemplate === "custom") return customLevels;
    const t = TEMPLATES.find((t) => t.key === selectedTemplate);
    return t?.levels ?? [];
  };

  const canProceedStep2 = () => getLevels().length >= 1;

  const confirmStep2 = () => {
    const levels = getLevels();
    if (levels.length < 1) return;
    setConfirmedLevels(levels);
    setStep(3);
  };

  const confirmStep3 = () => setStep(4);
  const skipStep3 = () => setStep(4);

  const addUnitField = () => {
    if (topLevelUnits.length < 5) setTopLevelUnits([...topLevelUnits, ""]);
  };

  const updateUnitField = (idx: number, value: string) => {
    const copy = [...topLevelUnits];
    copy[idx] = value;
    setTopLevelUnits(copy);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your organization structure</h1>
        <p className="mt-1 text-muted-foreground">Configure how your organization is structured.</p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex gap-6 text-sm">
        {["Organization", "Hierarchy", "First units", "Done"].map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i + 1 <= step ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span className={i + 1 <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>
          </div>
        ))}
      </div>

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose your hierarchy template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />

            {selectedTemplate === "custom" && (
              <CustomLevelBuilder levels={customLevels} onChange={setCustomLevels} />
            )}

            <div className="flex justify-end">
              <Button onClick={confirmStep2} disabled={!canProceedStep2()}>
                Confirm & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Add your first {confirmedLevels[0]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can add up to 5 top-level {confirmedLevels[0].toLowerCase()}s now, or skip and add them later.
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
              <button
                className="text-sm text-muted-foreground underline hover:text-foreground"
                onClick={skipStep3}
              >
                Skip for now — I'll add units later
              </button>
              <Button
                onClick={confirmStep3}
                disabled={!topLevelUnits.some((u) => u.trim())}
              >
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your hierarchy is ready!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {confirmedLevels.join(" → ")}
            </p>
            <div className="flex gap-3">
              <Button onClick={onComplete}>
                Add more units <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SetupWizard;
