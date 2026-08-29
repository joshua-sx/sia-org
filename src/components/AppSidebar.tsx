import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarClock,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandMark } from "@/components/BrandMark";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ONBOARDING_STEPS } from "@/lib/onboardingSteps";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, accent: "--accent-blue" },
  { title: "Organization", url: "/org/structure", icon: Building2, accent: "--accent-red" },
  { title: "People", url: "/org/employees", icon: Users, accent: "--accent-purple" },
  { title: "Appraisals", url: "/appraisals", icon: CalendarClock, accent: "--accent-green" },
];

/** During setup the sidebar mirrors the four onboarding steps. */
const onboardingItems = ONBOARDING_STEPS.map((step) => ({
  title: step.label,
  url: step.href,
  icon: step.icon,
  accent: step.accent,
}));

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, organization, signOut } = useAuth();
  const { isOnboarding } = useOnboarding();
  const items = isOnboarding ? onboardingItems : navItems;

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <Sidebar
      collapsible="icon"
      className="border-e border-hairline bg-sidebar"
    >
      <SidebarHeader className={collapsed ? "flex items-center justify-center px-0 py-5" : "px-4 py-5"}>
        {collapsed ? (
          <span className="text-base font-bold tracking-tight font-[Space_Grotesk] text-foreground">
            S
          </span>
        ) : (
          <>
            <BrandMark size="sm" to="/dashboard" />
            {organization && (
              <p className="mt-1 text-xs text-ink-muted truncate">
                {organization.name}
              </p>
            )}
          </>
        )}
      </SidebarHeader>

      <SidebarContent className={collapsed ? "px-0" : "px-2"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? "items-center gap-1" : undefined}>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard" || item.url === "/onboarding/setup"}
                      aria-label={collapsed ? item.title : undefined}
                      title={collapsed ? item.title : undefined}
                      className={
                        collapsed
                          ? "group relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-ink-strong/[0.05] hover:text-foreground"
                          : "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors duration-150 hover:bg-ink-strong/[0.05] hover:text-foreground"
                      }
                      activeClassName={
                        collapsed
                          ? "!bg-ink-strong/[0.07] !text-foreground shadow-[var(--shadow-border)]"
                          : "!bg-ink-strong/[0.06] !text-foreground font-medium before:absolute before:inset-y-2 before:start-0 before:w-[2px] before:rounded-e-full before:bg-ink-strong/[0.35]"
                      }
                    >
                      <item.icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: `hsl(var(${item.accent}))` }}
                      />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={collapsed ? "flex items-center px-0 pb-3" : "px-2 pb-3"}>
        <SidebarMenu className={collapsed ? "items-center" : undefined}>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className={
                    collapsed
                      ? "flex h-10 w-10 items-center justify-center rounded-lg hover:bg-ink-strong/[0.05]"
                      : "flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-ink-strong/[0.05]"
                  }
                >
                  <div className="relative">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="bg-accent-blue/[0.1] text-accent-blue text-[10px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -end-0.5 h-2 w-2 rounded-full bg-accent-green ring-2 ring-sidebar" />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="truncate font-medium">
                        {profile?.full_name ?? "User"}
                      </span>
                      <ChevronsUpDown className="ms-auto h-3 w-3 text-ink-subtle" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={signOut} className="gap-2 text-sm">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
}
