import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, accent: "--accent-blue" },
  { title: "Org Structure", url: "/org/structure", icon: Building2, accent: "--accent-green" },
  { title: "Employees", url: "/org/employees", icon: Users, accent: "--accent-red" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, organization, signOut } = useAuth();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[hsl(var(--hairline))] bg-[hsl(var(--sidebar-background))]"
    >
      <SidebarHeader className={collapsed ? "flex items-center justify-center px-0 py-4" : "px-4 py-4"}>
        {collapsed ? (
          <span className="text-base font-bold tracking-tight font-[Space_Grotesk] text-foreground">
            S
          </span>
        ) : (
          <>
            <BrandMark size="sm" to="/dashboard" />
            {organization && (
              <p className="mt-1 text-xs text-[hsl(var(--ink-muted))] truncate">
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={
                        collapsed
                          ? "group relative flex h-9 w-9 items-center justify-center rounded-md text-[hsl(var(--ink-muted))] transition-colors hover:bg-[hsl(var(--ink-strong)/0.05)] hover:text-foreground"
                          : "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[hsl(var(--ink-muted))] transition-colors hover:bg-[hsl(var(--ink-strong)/0.05)] hover:text-foreground"
                      }
                      activeClassName={
                        collapsed
                          ? "!bg-[hsl(var(--ink-strong)/0.07)] !text-foreground"
                          : "!bg-[hsl(var(--ink-strong)/0.06)] !text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r before:bg-[hsl(var(--ink-strong)/0.35)]"
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
                      ? "flex h-9 w-9 items-center justify-center rounded-md hover:bg-[hsl(var(--ink-strong)/0.05)]"
                      : "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-[hsl(var(--ink-strong)/0.05)] w-full"
                  }
                >
                  <div className="relative">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="bg-[hsl(var(--accent-blue)/0.1)] text-[hsl(var(--accent-blue))] text-[10px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--accent-green))] ring-2 ring-[hsl(var(--sidebar-background))]" />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="truncate font-medium">
                        {profile?.full_name ?? "User"}
                      </span>
                      <ChevronsUpDown className="ml-auto h-3 w-3 text-[hsl(var(--ink-subtle))]" />
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
