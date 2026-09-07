import { useEffect, useMemo, useState } from "react";
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
import { useEmployees } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import {
  cycleEntries,
  pageEntries,
  personEntries,
  searchWorkspace,
  teamEntries,
} from "@/lib/workspaceSearchIndex";
import { workspaceAccentClasses, workspaceNavigationIcons } from "./workspaceNavigationVisuals";

interface WorkspaceSearchProps {
  groups: RoleNavigationGroup[];
  collapsed: boolean;
  onNavigate: () => void;
}

export function WorkspaceSearch({ groups, collapsed, onNavigate }: WorkspaceSearchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: employees = [] } = useEmployees();
  const { data: units = [] } = useOrgUnits();
  const { data: unitTypes = [] } = useOrgUnitTypes();
  const { data: cycles = [] } = useAppraisalCycles();

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

  const entries = useMemo(() => {
    const unitNameById = new Map(units.map((unit) => [unit.id, unit.name]));
    const typeNameById = new Map(unitTypes.map((type) => [type.id, type.name]));
    return [
      ...pageEntries(groups),
      ...personEntries(employees, (id) => (id ? unitNameById.get(id) : undefined)),
      ...teamEntries(units, (id) => typeNameById.get(id)),
      ...cycleEntries(cycles),
    ];
  }, [groups, employees, units, unitTypes, cycles]);

  const results = useMemo(() => searchWorkspace(entries, query), [entries, query]);

  const select = (url: string) => {
    setOpen(false);
    setQuery("");
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
          Search pages, people, teams and review cycles you have access to.
        </DialogDescription>
        <CommandInput
          placeholder="Search people, teams, cycles…"
          aria-label="Search Sia"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          {results.map((group) => (
            <CommandGroup key={group.kind} heading={group.label}>
              {group.entries.map((entry) => {
                const Icon = workspaceNavigationIcons[entry.icon];
                return (
                  <CommandItem
                    key={entry.id}
                    value={entry.id}
                    keywords={[entry.title, entry.subtitle ?? "", entry.keywords]}
                    onSelect={() => select(entry.url)}
                    className="min-h-11 rounded-lg"
                  >
                    <Icon
                      className={`me-2 size-4 shrink-0 ${workspaceAccentClasses[entry.accent]}`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{entry.title}</span>
                    {entry.subtitle && (
                      <span className="ms-auto ps-3 truncate text-xs text-ink-subtle">
                        {entry.subtitle}
                      </span>
                    )}
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
