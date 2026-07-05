import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[hsl(var(--surface))]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-3 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]/80 backdrop-blur px-4 shrink-0">
            <SidebarTrigger className="text-[hsl(var(--ink-subtle))] hover:text-foreground" />
            <div className="ml-auto flex items-center gap-2 text-xs text-[hsl(var(--ink-muted))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-green))]" />
              <span>Live</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
