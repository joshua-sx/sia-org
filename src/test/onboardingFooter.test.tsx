import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OnboardingNavFooter } from "@/components/onboarding/OnboardingNavFooter";
import { OnboardingFooter } from "@/components/onboarding/OnboardingFooter";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { useStepReadiness } from "@/components/onboarding/OnboardingContext";
import { deriveOnboardingSteps } from "@/lib/onboardingSteps";

vi.mock("@/hooks/useOnboarding", () => ({
  useOnboarding: vi.fn(),
}));

vi.mock("@/lib/completionSounds", () => ({
  playSuccessCue: vi.fn(),
  playSetupCompleteCue: vi.fn(),
}));

import { useOnboarding } from "@/hooks/useOnboarding";

const mockedUseOnboarding = vi.mocked(useOnboarding);

function RegisterPeopleReady({ ready, hint }: { ready: boolean; hint?: string }) {
  useStepReadiness("people", ready, hint);
  return <OnboardingFooter />;
}

describe("OnboardingNavFooter", () => {
  it("shows Continue and an inline hint", () => {
    render(
      <OnboardingNavFooter
        onBack={() => undefined}
        onContinue={() => undefined}
        continueDisabled
        continueLabel="Continue to Cycle"
        hint="Add at least one employee to continue."
      />,
    );

    expect(screen.getByRole("button", { name: /continue to cycle/i })).toBeDisabled();
    expect(screen.getAllByText("Add at least one employee to continue.").length).toBeGreaterThan(0);
  });
});

describe("OnboardingFooter", () => {
  const steps = deriveOnboardingSteps({
    account: { done: true, skipped: false },
    structure: { done: true, skipped: false },
    people: { done: false, skipped: false },
    cycle: { done: false, skipped: false },
  });

  it("renders Continue to Cycle when People is ready", async () => {
    const markComplete = vi.fn().mockResolvedValue(undefined);
    mockedUseOnboarding.mockReturnValue({
      steps,
      progressCount: 2,
      totalSteps: 4,
      setupComplete: false,
      isOnboarding: true,
      markComplete,
      markSkipped: vi.fn(),
      finishSetup: vi.fn(),
      resume: vi.fn(),
      nextStepAfter: (key) => steps[steps.findIndex((s) => s.key === key) + 1] ?? null,
      previousStepBefore: (key) => {
        const i = steps.findIndex((s) => s.key === key);
        return i > 0 ? steps[i - 1] : null;
      },
      saving: false,
    });

    render(
      <MemoryRouter>
        <OnboardingProvider>
          <RegisterPeopleReady ready hint="2 people added — ready to continue." />
        </OnboardingProvider>
      </MemoryRouter>,
    );

    const button = await waitFor(() => screen.getByRole("button", { name: /continue to cycle/i }));
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(markComplete).toHaveBeenCalledWith("people"));
  });

  it("disables Finish setup until the cycle step is ready", async () => {
    const cycleSteps = deriveOnboardingSteps({
      account: { done: true, skipped: false },
      structure: { done: true, skipped: false },
      people: { done: true, skipped: false },
      cycle: { done: false, skipped: false },
    });

    mockedUseOnboarding.mockReturnValue({
      steps: cycleSteps,
      progressCount: 3,
      totalSteps: 4,
      setupComplete: false,
      isOnboarding: true,
      markComplete: vi.fn(),
      markSkipped: vi.fn(),
      finishSetup: vi.fn(),
      resume: vi.fn(),
      nextStepAfter: () => null,
      previousStepBefore: () => cycleSteps[2],
      saving: false,
    });

    function RegisterCycle({ ready }: { ready: boolean }) {
      useStepReadiness("cycle", ready, ready ? undefined : "Create a cycle to finish setup.");
      return <OnboardingFooter />;
    }

    render(
      <MemoryRouter>
        <OnboardingProvider>
          <RegisterCycle ready={false} />
        </OnboardingProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /finish setup/i })).toBeDisabled();
    expect(screen.getAllByText("Create a cycle to finish setup.").length).toBeGreaterThan(0);
  });
});
