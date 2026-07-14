import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OnboardingPipeline } from "@/components/onboarding/OnboardingPipeline";
import { OnboardingStepHeader } from "@/components/onboarding/OnboardingStepHeader";
import { PageHead } from "@/components/PageHead";
import {
  createInitialFlowState,
  createCompletedFlowState,
  deriveScreen,
  nextScreenId,
  prevScreenId,
  pipelineStepsFor,
  PIPELINE_KEY_BY_GLOBAL_STEP,
  screenIndex,
  skipTargetFrom,
  SCREEN_ORDER,
  type PreviewFlowState,
  type PreviewScreenId,
} from "./onboardingPreviewFlow";
import { OnboardingNavFooter } from "@/components/onboarding/OnboardingNavFooter";
import {
  PreviewScreenBody,
  SCREEN_LABELS,
  type PreviewFlowActions,
} from "./onboardingPreviewScreens";

/**
 * Dev-only interactive walkthrough of the full onboarding flow.
 */
export default function OnboardingPreview() {
  const [flow, setFlow] = useState<PreviewFlowState>(createInitialFlowState);
  const screen = deriveScreen(flow);

  const goToScreen = useCallback((id: PreviewScreenId) => {
    setFlow((prev) => ({ ...prev, screenId: id }));
  }, []);

  const goBack = useCallback(() => {
    setFlow((prev) => {
      const prevId = prevScreenId(prev.screenId);
      return prevId ? { ...prev, screenId: prevId } : prev;
    });
  }, []);

  const goContinue = useCallback(() => {
    setFlow((prev) => {
      const current = deriveScreen(prev);
      if (!current.footerReady) return prev;
      const nextId = nextScreenId(prev.screenId);
      if (!nextId) return prev;
      if (nextId === "complete") {
        toast.success("Setup complete — welcome to SIA.");
      }
      return {
        ...prev,
        screenId: nextId,
        launched: nextId === "complete" || nextId === "dashboard" ? true : prev.launched,
      };
    });
  }, []);

  const goToDashboard = useCallback(() => {
    setFlow((prev) => ({ ...prev, screenId: "dashboard", launched: true }));
  }, []);

  const jumpToCompletion = useCallback(() => {
    setFlow(createCompletedFlowState("complete"));
    toast.message("Jumped to completion screen");
  }, []);

  const jumpToDashboard = useCallback(() => {
    setFlow(createCompletedFlowState("dashboard"));
    toast.message("Jumped to post-setup dashboard");
  }, []);

  const skipStep = useCallback(() => {
    setFlow((prev) => {
      const target = skipTargetFrom(prev.screenId);
      const peopleSkipped =
        prev.peopleSkipped ||
        prev.screenId === "people-import" ||
        prev.screenId === "people-validation";
      const launchSkipped = prev.launchSkipped || prev.screenId === "launch-setup";
      toast.info(
        prev.screenId === "people-import" || prev.screenId === "people-validation"
          ? "Skipped People — you can add employees later."
          : "Skipped Launch — you can create a cycle later."
      );
      return {
        ...prev,
        screenId: target,
        peopleSkipped,
        launchSkipped,
        launchFormSaved: launchSkipped ? true : prev.launchFormSaved,
      };
    });
  }, []);

  const checkEmployees = useCallback(() => {
    setFlow((prev) => ({
      ...prev,
      importChecked: true,
      screenId: "people-validation",
      validationIssues: prev.validationIssues.map((i) => ({ ...i, fixed: false })),
    }));
    toast.success("84 employees checked — 2 issues found");
  }, []);

  const fixIssue = useCallback((issueId: string, managerName: string) => {
    setFlow((prev) => ({
      ...prev,
      validationIssues: prev.validationIssues.map((i) =>
        i.id === issueId ? { ...i, fixed: true, issue: `Reports to ${managerName}` } : i
      ),
    }));
    toast.success("Reporting line updated");
  }, []);

  const updateCycleField = useCallback(
    (field: "cycleName" | "cycleStart" | "cycleEnd", value: string) => {
      setFlow((prev) => ({ ...prev, [field]: value, launchFormSaved: false }));
    },
    []
  );

  const saveLaunchForm = useCallback(() => {
    setFlow((prev) => {
      if (!prev.cycleName.trim() || !prev.cycleStart || !prev.cycleEnd) {
        toast.error("Fill in all required fields");
        return prev;
      }
      toast.success("Cycle details saved");
      return { ...prev, launchFormSaved: true };
    });
  }, []);

  const restart = useCallback(() => {
    setFlow(createInitialFlowState());
    toast.message("Preview restarted");
  }, []);

  const actions: PreviewFlowActions = useMemo(
    () => ({
      checkEmployees,
      fixIssue,
      updateCycleField,
      saveLaunchForm,
      goBack,
      goContinue,
      goToDashboard,
      skipStep,
      restart,
    }),
    [
      checkEmployees,
      fixIssue,
      updateCycleField,
      saveLaunchForm,
      goBack,
      goContinue,
      goToDashboard,
      skipStep,
      restart,
    ]
  );

  const isCompleteScreen = flow.screenId === "complete";
  const isDashboardScreen = flow.screenId === "dashboard";
  const isTerminalScreen = isCompleteScreen || isDashboardScreen;
  const currentIndex = screenIndex(flow.screenId);

  const headerRight = isDashboardScreen
    ? "Live"
    : isCompleteScreen
      ? "Setup complete"
      : "Saved automatically";

  return (
    <>
      <PageHead
        title="Onboarding preview | SIA"
        description="Local dev preview of the full onboarding flow."
        path="/dev/onboarding-preview"
      />

      <div className="border-b border-[hsl(var(--accent-blue)/0.25)] bg-[hsl(var(--accent-blue)/0.06)] px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-[hsl(var(--accent-blue))] mb-1">
              Interactive dev preview — walk through every step
            </p>
            <p className="text-[11px] text-[hsl(var(--ink-muted))]">
              Fix issues, save forms, skip steps. Continue unlocks when requirements are met.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={jumpToCompletion}
              className="rounded-full border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-3 py-1 text-[11px] font-medium text-foreground hover:bg-[hsl(var(--surface))]"
            >
              Jump to completion
            </button>
            <button
              type="button"
              onClick={jumpToDashboard}
              className="rounded-full border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-3 py-1 text-[11px] font-medium text-foreground hover:bg-[hsl(var(--surface))]"
            >
              Jump to dashboard
            </button>
            <button
              type="button"
              onClick={restart}
              className="text-[11px] text-[hsl(var(--accent-blue))] underline hover:no-underline"
            >
              Restart flow
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl mt-2 flex gap-1.5 flex-wrap">
          {SCREEN_ORDER.map((id) => {
            const idx = screenIndex(id);
            const visited = idx <= currentIndex;
            const active = id === flow.screenId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goToScreen(id)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-[hsl(var(--accent-blue))] text-white"
                    : visited
                      ? "bg-[hsl(var(--surface-raised))] text-foreground border border-[hsl(var(--hairline))]"
                      : "bg-[hsl(var(--surface-raised))] text-[hsl(var(--ink-subtle))] border border-[hsl(var(--hairline))] opacity-60"
                )}
              >
                {SCREEN_LABELS[id]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-screen bg-[hsl(var(--surface))] flex flex-col">
        <header className="flex items-center justify-between border-b border-[hsl(var(--hairline))] px-6 md:px-16 py-5">
          <span className="text-xl font-semibold font-[Space_Grotesk] text-foreground">SIA</span>
          <div className="flex items-center gap-4">
            {screen.showSkip && (
              <button
                type="button"
                onClick={skipStep}
                className="text-xs text-[hsl(var(--ink-subtle))] hover:text-[hsl(var(--ink-muted))] transition-colors"
              >
                Skip this step
              </button>
            )}
            <span className="text-xs text-[hsl(var(--ink-subtle))]">{headerRight}</span>
          </div>
        </header>

        {!isTerminalScreen && (
          <div className="border-b border-[hsl(var(--hairline))] px-6 md:px-16 py-4">
            <OnboardingPipeline
              steps={pipelineStepsFor(screen.globalStep, screen.completedThrough)}
              currentKey={PIPELINE_KEY_BY_GLOBAL_STEP[screen.globalStep]}
              size="sm"
            />
          </div>
        )}

        <main className="flex-1 flex justify-center px-6 py-10 md:px-16 md:py-12">
          <div className={isDashboardScreen ? "w-full max-w-5xl" : "w-full max-w-[760px]"}>
            {!isTerminalScreen ? (
              <>
                <OnboardingStepHeader
                  eyebrow={screen.eyebrow}
                  eyebrowAccent={screen.eyebrowAccent}
                  title={screen.title}
                  subtitle={screen.subtitle}
                  localStepLabel={screen.localStepLabel}
                  criteria={screen.criteria}
                  criteriaAccent={screen.eyebrowAccent}
                />
                <PreviewScreenBody state={flow} actions={actions} />
              </>
            ) : (
              <PreviewScreenBody state={flow} actions={actions} />
            )}
          </div>
        </main>

        {!isDashboardScreen && (
          <OnboardingNavFooter
            onBack={goBack}
            onContinue={isCompleteScreen ? goToDashboard : goContinue}
            canGoBack={currentIndex > 0}
            continueDisabled={!isCompleteScreen && !screen.footerReady}
            continueLabel={isCompleteScreen ? "Go to dashboard" : "Continue"}
            hint={!isCompleteScreen ? screen.blockedHint : undefined}
          />
        )}
      </div>
    </>
  );
}
