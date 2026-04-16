import { useLocation } from "react-router-dom";
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Org Structure", url: "/org/structure", icon: Building2 },
  { title: "Employees", url: "/org/employees", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, organization, signOut } = useAuth();
  const location = useLocation();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[rgba(0,0,0,0.1)] bg-[#f6f5f4]"
    >
      {/* Header */}
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight font-[Space_Grotesk] text-[rgba(0,0,0,0.95)]">
            {collapsed ? "S" : "SIA"}
          </span>
        </div>
        {!collapsed && organization && (
          <p className="mt-0.5 text-xs text-[#615d59] truncate">
            {organization.name}
          </p>
        )}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#615d59] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[rgba(0,0,0,0.95)]"
                      activeClassName="bg-[rgba(0,0,0,0.04)] text-[rgba(0,0,0,0.95)] font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-[#a39e98]" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user menu */}
      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[rgba(0,0,0,0.95)] hover:bg-[rgba(0,0,0,0.04)] w-full">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-[rgba(0,0,0,0.05)] text-[#615d59] text-[10px] font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <span className="truncate font-medium text-[rgba(0,0,0,0.95)]">
                        {profile?.full_name ?? "User"}
                      </span>
                      <ChevronsUpDown className="ml-auto h-3 w-3 text-[#a39e98]" />
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
