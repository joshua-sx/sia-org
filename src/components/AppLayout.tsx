import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thin header with sidebar trigger */}
          <header className="h-11 flex items-center border-b border-[rgba(0,0,0,0.06)] px-4 shrink-0">
            <SidebarTrigger className="text-[#8e8b86] hover:text-[#2c2c2b]" />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
