import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserCircle2,
  Building2,
  Users,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export type OnboardingStepKey = "account" | "structure" | "people" | "cycle";
export type OnboardingStatus = "done" | "current" | "next" | "skipped" | "locked";

export interface OnboardingStep {
  key: OnboardingStepKey;
  label: string;
  icon: LucideIcon;
  accent: string; // css var name
  href?: string;
  status: OnboardingStatus;
  skipped: boolean;
  done: boolean;
}

export function useOnboarding() {
  const { organization, refreshOrganization } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const structureDone = !!organization?.structure_complete;
  const structureSkipped = !!organization?.structure_skipped;
  const peopleDone = !!organization?.people_complete;
  const peopleSkipped = !!organization?.people_skipped;
  const cycleDone = !!organization?.cycle_complete;
  const cycleSkipped = !!organization?.cycle_skipped;

  // Determine current step: first step that is not done AND not skipped
  const orderedFlags: { done: boolean; skipped: boolean }[] = [
    { done: true, skipped: false }, // account
    { done: structureDone, skipped: structureSkipped },
    { done: peopleDone, skipped: peopleSkipped },
    { done: cycleDone, skipped: cycleSkipped },
  ];
  const currentIndex = orderedFlags.findIndex((f) => !f.done && !f.skipped);

  const resolveStatus = (i: number): OnboardingStatus => {
    const f = orderedFlags[i];
    if (f.done) return "done";
    if (f.skipped) return "skipped";
    if (currentIndex === -1) return "next";
    if (i === currentIndex) return "current";
    if (i < currentIndex) return "next";
    return "next";
  };

  const steps: OnboardingStep[] = [
    {
      key: "account",
      label: "Account",
      icon: UserCircle2,
      accent: "--accent-blue",
      status: resolveStatus(0),
      done: true,
      skipped: false,
    },
    {
      key: "structure",
      label: "Structure",
      icon: Building2,
      accent: "--accent-red",
      href: "/org/structure",
      status: resolveStatus(1),
      done: structureDone,
      skipped: structureSkipped,
    },
    {
      key: "people",
      label: "People",
      icon: Users,
      accent: "--accent-purple",
      href: "/org/employees",
      status: resolveStatus(2),
      done: peopleDone,
      skipped: peopleSkipped,
    },
    {
      key: "cycle",
      label: "Launch",
      icon: CalendarClock,
      accent: "--accent-green",
      href: "/appraisals",
      status: resolveStatus(3),
      done: cycleDone,
      skipped: cycleSkipped,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  // Structure is the only step the user cannot skip, but finishing it does NOT
  // end setup. Onboarding runs until every step has been explicitly resolved —
  // completed or deliberately skipped — so the guided flow never drops the user
  // half-way through. `setup_complete` is the persisted "reached the end" flag.
  const allStepsResolved = orderedFlags.every((f) => f.done || f.skipped);
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
      qc.invalidateQueries();
    },
  });

  const markComplete = (key: OnboardingStepKey) => {
    if (key === "structure") return updateOrg.mutateAsync({ structure_complete: true, structure_skipped: false });
    if (key === "people") return updateOrg.mutateAsync({ people_complete: true, people_skipped: false });
    if (key === "cycle") return updateOrg.mutateAsync({ cycle_complete: true, cycle_skipped: false });
    return Promise.resolve();
  };

  const markSkipped = (key: OnboardingStepKey) => {
    if (key === "structure") return updateOrg.mutateAsync({ structure_skipped: true });
    if (key === "people") return updateOrg.mutateAsync({ people_skipped: true });
    if (key === "cycle") return updateOrg.mutateAsync({ cycle_skipped: true });
    return Promise.resolve();
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
    if (step?.href) navigate(step.href);
  };

  const goToNext = () => {
    const next = steps.find((s) => s.status === "current" || (!s.done && !s.skipped && s.href));
    if (next?.href) navigate(next.href);
    else navigate("/dashboard");
  };

  const stepIndexByKey = (key: OnboardingStepKey) => steps.findIndex((s) => s.key === key);

  /** Step immediately after `key` in the flow (regardless of status). */
  const nextStepAfter = (key: OnboardingStepKey): OnboardingStep | null => {
    const i = stepIndexByKey(key);
    return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
  };

  /** Step immediately before `key` in the flow (regardless of status). */
  const previousStepBefore = (key: OnboardingStepKey): OnboardingStep | null => {
    const i = stepIndexByKey(key);
    return i > 0 ? steps[i - 1] : null;
  };

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    setupComplete,
    isOnboarding,
    markComplete,
    markSkipped,
    finishSetup,
    resume,
    goToNext,
    nextStepAfter,
    previousStepBefore,
    stepIndexByKey,
    saving: updateOrg.isPending,
  };
}
