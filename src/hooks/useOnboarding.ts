import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  deriveOnboardingProgress,
  deriveOnboardingSteps,
  onboardingStepIndex,
  type OnboardingStep,
  type OnboardingStepKey,
} from "@/lib/onboardingSteps";

export function useOnboarding() {
  const { organization, refreshOrganization } = useAuth();
  const navigate = useNavigate();

  const structureDone = !!organization?.structure_complete;
  const structureSkipped = !!organization?.structure_skipped;
  const peopleDone = !!organization?.people_complete;
  const peopleSkipped = !!organization?.people_skipped;
  const cycleDone = !!organization?.cycle_complete;
  const cycleSkipped = !!organization?.cycle_skipped;

  const steps = deriveOnboardingSteps({
    account: { done: true, skipped: false },
    structure: { done: structureDone, skipped: structureSkipped },
    people: { done: peopleDone, skipped: peopleSkipped },
    cycle: { done: cycleDone, skipped: cycleSkipped },
  });
  const { resolvedCount: progressCount, totalSteps } =
    deriveOnboardingProgress(steps);
  // Onboarding only ends once the user reaches the final review step and
  // confirms it — resolving every step surfaces that review screen, it does
  // not silently exit the flow.
  const setupComplete = !!organization && !!organization?.setup_complete;

  const isOnboarding = !!organization && !setupComplete;

  type OrgPatch = Partial<{
    structure_complete: boolean;
    structure_skipped: boolean;
    people_complete: boolean;
    people_skipped: boolean;
    cycle_complete: boolean;
    cycle_skipped: boolean;
    setup_complete: boolean;
  }>;

  const updateOrg = useMutation({
    mutationFn: async (patch: OrgPatch) => {
      if (!organization) return;
      const { error } = await supabase
        .from("organizations")
        .update(patch)
        .eq("id", organization.id);
      if (error) throw error;
      await refreshOrganization();
    },
  });

  const markComplete = (key: OnboardingStepKey) => {
    switch (key) {
      case "account":
        return Promise.resolve();
      case "structure":
        return updateOrg.mutateAsync({ structure_complete: true, structure_skipped: false });
      case "people":
        return updateOrg.mutateAsync({ people_complete: true, people_skipped: false });
      case "cycle":
        return updateOrg.mutateAsync({ cycle_complete: true, cycle_skipped: false });
      default: {
        const exhaustive: never = key;
        return exhaustive;
      }
    }
  };

  const markSkipped = (key: OnboardingStepKey) => {
    switch (key) {
      case "account":
        return Promise.resolve();
      case "structure":
        return updateOrg.mutateAsync({ structure_skipped: true });
      case "people":
        return updateOrg.mutateAsync({ people_skipped: true });
      case "cycle":
        return updateOrg.mutateAsync({ cycle_skipped: true });
      default: {
        const exhaustive: never = key;
        return exhaustive;
      }
    }
  };

  /**
   * Persist "the user reached the end of setup" and land them on the dashboard
   * with the completion screen. This is the single exit from onboarding.
   */
  const finishSetup = async () => {
    await updateOrg.mutateAsync({ setup_complete: true });
    navigate("/dashboard", { state: { setupJustCompleted: true } });
  };

  const resume = (key: OnboardingStepKey) => {
    const step = steps.find((s) => s.key === key);
    if (step) navigate(step.href);
  };

  /** Step immediately after `key` in the flow (regardless of status). */
  const nextStepAfter = (key: OnboardingStepKey): OnboardingStep | null => {
    const i = onboardingStepIndex(key);
    return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
  };

  /** Step immediately before `key` in the flow (regardless of status). */
  const previousStepBefore = (key: OnboardingStepKey): OnboardingStep | null => {
    const i = onboardingStepIndex(key);
    return i > 0 ? steps[i - 1] : null;
  };

  return {
    steps,
    progressCount,
    totalSteps,
    setupComplete,
    isOnboarding,
    markComplete,
    markSkipped,
    finishSetup,
    resume,
    nextStepAfter,
    previousStepBefore,
    saving: updateOrg.isPending,
  };
}
