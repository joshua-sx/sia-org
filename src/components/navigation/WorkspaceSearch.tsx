import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { RoleNavigationGroup } from "@/lib/workspaceNavigation";
import { workspaceAccentClasses, workspaceNavigationIcons } from "./workspaceNavigationVisuals";

interface WorkspaceSearchProps {
  groups: RoleNavigationGroup[];
  collapsed: boolean;
  onNavigate: () => void;
}

export function WorkspaceSearch({ groups, collapsed, onNavigate }: WorkspaceSearchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const select = (url: string) => {
    setOpen(false);
    onNavigate();
    navigate(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={collapsed ? "Search Sia" : "Search ⌘ K"}
        className={
          collapsed
            ? "mx-auto flex size-10 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-ink-strong/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "flex h-10 w-full items-center gap-2 rounded-lg border border-hairline bg-surface-raised px-3 text-sm text-ink-muted shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-150 hover:border-ink-strong/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        }
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        {!collapsed && (
          <>
            <span>Search</span>
            <kbd className="ms-auto rounded-md bg-ink-strong/[0.06] px-1.5 py-0.5 font-sans text-xs text-ink-muted">
              ⌘ K
            </kbd>
          </>
        )}
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} label="Search Sia">
        <DialogTitle className="sr-only">Search Sia</DialogTitle>
        <DialogDescription className="sr-only">
          Search the workspace destinations available to you.
        </DialogDescription>
        <CommandInput placeholder="Search Sia" aria-label="Search Sia" />
        <CommandList>
          <CommandEmpty>No matching destination.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => {
                const Icon = workspaceNavigationIcons[item.icon];
                return (
                  <CommandItem
                    key={item.url}
                    value={`${item.title} ${group.label}`}
                    onSelect={() => select(item.url)}
                    className="min-h-11 rounded-lg"
                  >
                    <Icon
                      className={`me-2 size-4 ${workspaceAccentClasses[item.accent]}`}
                      aria-hidden="true"
                    />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="flex items-center gap-4 border-t border-hairline px-4 py-2 text-xs text-ink-subtle">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span className="ms-auto">Esc Close</span>
        </div>
      </CommandDialog>
    </>
  );
}
