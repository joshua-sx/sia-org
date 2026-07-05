import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrgUnits, type OrgUnit } from "@/hooks/useOrgUnits";
import { useOrgUnitTypes } from "@/hooks/useOrgUnitTypes";
import {
  buildAncestryMap,
  childrenAt,
  orderedLevels,
  unitsByLevel,
} from "@/lib/orgHierarchy";
import { ChevronRight } from "lucide-react";

interface Props {
  value: string | null | undefined;
  onChange: (unitId: string | null) => void;
  /** Placeholder label for each dropdown when nothing is selected. */
  compact?: boolean;
}

const NONE = "__none__";

export function UnitPicker({ value, onChange, compact }: Props) {
  const { data: units = [] } = useOrgUnits();
  const { data: types = [] } = useOrgUnitTypes();

  const levels = useMemo(() => orderedLevels(types), [types]);
  const ancestry = useMemo(() => buildAncestryMap(units), [units]);
  const selectedChain = useMemo(
    () => unitsByLevel(value, ancestry, levels),
    [value, ancestry, levels]
  );

  if (levels.length === 0) {
    return (
      <p className="text-xs text-[hsl(var(--ink-muted))]">
        Set up your org structure first to assign a unit.
      </p>
    );
  }

  const setAtLevel = (levelIdx: number, unitId: string | null) => {
    // Selecting nothing at level N clears N and everything downstream.
    if (!unitId) {
      const upstream = selectedChain.slice(0, levelIdx).filter(Boolean) as OrgUnit[];
      onChange(upstream.length ? upstream[upstream.length - 1].id : null);
      return;
    }
    onChange(unitId);
  };

  return (
    <div className="space-y-2">
      <div
        className={
          compact
            ? "flex flex-wrap items-center gap-1.5"
            : "grid gap-2"
        }
        style={
          compact
            ? undefined
            : { gridTemplateColumns: `repeat(${Math.min(levels.length, 3)}, minmax(0, 1fr))` }
        }
      >
        {levels.map((lvl, i) => {
          const parentId = i === 0 ? null : selectedChain[i - 1]?.id ?? null;
          const disabled = i > 0 && !selectedChain[i - 1];
          const opts = childrenAt(units, parentId, lvl.type.id);
          const current = selectedChain[i]?.id ?? NONE;

          return (
            <Select
              key={lvl.type.id}
              value={current}
              onValueChange={(v) => setAtLevel(i, v === NONE ? null : v)}
              disabled={disabled || opts.length === 0}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={lvl.type.name} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Any {lvl.type.name.toLowerCase()} —</SelectItem>
                {opts.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>

      {value && (
        <div className="flex items-center gap-1 text-[11px] text-[hsl(var(--ink-muted))]">
          {(ancestry.get(value) ?? []).map((u, i, arr) => (
            <span key={u.id} className="flex items-center gap-1">
              <span className={i === arr.length - 1 ? "text-foreground font-medium" : ""}>
                {u.name}
              </span>
              {i < arr.length - 1 && <ChevronRight className="h-3 w-3 opacity-50" />}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default UnitPicker;
