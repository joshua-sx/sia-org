import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import OnboardingSkipControl from "@/components/onboarding/OnboardingSkipControl";
import OnboardingFooter from "@/components/onboarding/OnboardingFooter";
import NotificationBell from "@/components/NotificationBell";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <OnboardingProvider>
        <div className="min-h-screen flex w-full bg-surface">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-[0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          <AppSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-3 border-b border-hairline bg-surface/80 px-4 backdrop-blur">
              <SidebarTrigger className="text-ink-subtle hover:text-foreground" />
              <div className="ml-auto flex items-center gap-4 text-xs text-ink-muted">
                <OnboardingSkipControl />
                <NotificationBell />
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                  <span>Live</span>
                </div>
              </div>
            </header>
            <main id="main-content" className="flex min-h-0 flex-1 flex-col overflow-auto">
              <div className="flex-1">{children}</div>
            </main>
            <OnboardingFooter />
          </div>
        </div>
      </OnboardingProvider>
    </SidebarProvider>
  );
}
