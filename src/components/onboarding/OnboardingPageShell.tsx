interface OnboardingPageShellProps {
  children: React.ReactNode;
}

/** Centered layout used during onboarding steps — matches the post-setup
 * page width (max-w-5xl) so the product feels consistent before and after
 * setup completes. */
export function OnboardingPageShell({ children }: OnboardingPageShellProps) {
  return (
    <div className="flex justify-center px-6 md:px-10 py-10">
      <div className="w-full max-w-5xl">{children}</div>
    </div>
  );
}

export default OnboardingPageShell;
