import { NavLink } from "@/components/NavLink";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { RoleNavigationGroup } from "@/lib/workspaceNavigation";
import { cn } from "@/lib/utils";
import {
  workspaceAccentClasses,
  workspaceActiveClasses,
  workspaceNavigationIcons,
} from "./workspaceNavigationVisuals";

interface WorkspaceNavigationProps {
  groups: RoleNavigationGroup[];
  onNavigate: () => void;
  activePath?: string;
}

export function WorkspaceNavigation({ groups, onNavigate, activePath }: WorkspaceNavigationProps) {
  return (
    <nav aria-label="Workspace navigation">
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="px-3 py-2">
          <SidebarGroupLabel className="h-7 px-2 text-xs font-medium text-ink-muted">
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const Icon = workspaceNavigationIcons[item.icon];
                const activeClasses = workspaceActiveClasses[item.accent];
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="h-10 rounded-lg px-3 text-ink-muted transition-colors duration-150 hover:bg-ink-strong/[0.05] hover:text-foreground group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0"
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard" || item.url === "/appraisals"}
                        onClick={onNavigate}
                        className={cn(activePath === item.url && activeClasses)}
                        activeClassName={activeClasses}
                      >
                        <Icon
                          className={`shrink-0 ${workspaceAccentClasses[item.accent]}`}
                          aria-hidden="true"
                        />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}
