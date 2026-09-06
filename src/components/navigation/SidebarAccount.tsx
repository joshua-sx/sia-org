import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarAccountProps {
  name: string;
  email?: string;
  initials: string;
  roleLabel: string;
  collapsed: boolean;
  onSignOut: () => void;
}

export function SidebarAccount({
  name,
  email,
  initials,
  roleLabel,
  collapsed,
  onSignOut,
}: SidebarAccountProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={`${name} · ${roleLabel}`}
              className="h-auto min-h-12 rounded-xl px-2 py-2 hover:bg-ink-strong/[0.05] data-[state=open]:bg-ink-strong/[0.05] group-data-[collapsible=icon]:!size-10"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-accent-purple/[0.12] text-xs font-semibold text-accent-purple-ink">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                    <span className="block truncate text-xs text-ink-muted">{roleLabel}</span>
                  </span>
                  <ChevronsUpDown className="size-4 text-ink-subtle" aria-hidden="true" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64 p-2">
            <DropdownMenuLabel className="px-2 py-2 font-normal">
              <span className="block truncate text-sm font-medium text-foreground">{name}</span>
              {email && <span className="mt-0.5 block truncate text-xs text-ink-muted">{email}</span>}
              <span className="mt-2 inline-flex rounded-full bg-accent-purple/[0.1] px-2 py-1 text-xs font-medium text-accent-purple-ink">
                {roleLabel}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut} className="min-h-10 gap-2 rounded-lg">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
