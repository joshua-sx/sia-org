import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import OnboardingStrip from "@/components/onboarding/OnboardingStrip";
import OnboardingFooter from "@/components/onboarding/OnboardingFooter";
import OnboardingSkipControl from "@/components/onboarding/OnboardingSkipControl";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <OnboardingProvider>
        <div className="min-h-screen flex w-full bg-[hsl(var(--surface))]">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[hsl(var(--surface-raised))] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-[0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center gap-3 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]/80 backdrop-blur px-4 shrink-0">
              <SidebarTrigger className="text-[hsl(var(--ink-subtle))] hover:text-foreground" />
              <div className="ml-auto flex items-center gap-4 text-xs text-[hsl(var(--ink-muted))]">
                <OnboardingSkipControl />
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-green))]" />
                  <span>Live</span>
                </div>
              </div>
            </header>
            <main id="main-content" className="flex-1 overflow-auto flex flex-col">
              <OnboardingStrip />
              <div className="flex-1">{children}</div>
              <OnboardingFooter />
            </main>
          </div>
        </div>
      </OnboardingProvider>
    </SidebarProvider>
  );
}
