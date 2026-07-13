interface OnboardingPageShellProps {
  children: React.ReactNode;
}

/** Centered single-column layout used during onboarding steps. */
export function OnboardingPageShell({ children }: OnboardingPageShellProps) {
  return (
    <div className="flex justify-center px-6 md:px-16 py-10 md:py-12">
      <div className="w-full max-w-[760px]">{children}</div>
    </div>
  );
}

export default OnboardingPageShell;
