import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import { OrgUnit, useOrgUnits } from "@/hooks/useOrgUnits";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitTypes: OrgUnitType[];
  units: OrgUnit[];
}

interface CsvRow {
  values: string[];
  error?: string;
  imported?: boolean;
}

const CsvImportModal = ({ open, onOpenChange, unitTypes, units }: Props) => {
  const { addUnit } = useOrgUnits();
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<{ name: string; type: string; parent: string }>({
    name: "",
    type: "",
    parent: "",
  });
  const [importing, setImporting] = useState(false);

  const sortedTypes = [...unitTypes].sort((a, b) => a.level - b.level);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const hdrs = lines[0].split(",").map((h) => h.trim());
      setHeaders(hdrs);
      setRows(lines.slice(1).map((line) => ({ values: line.split(",").map((v) => v.trim()) })));

      // Auto-map if headers match expected names
      const autoMap = { name: "", type: "", parent: "" };
      hdrs.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes("unit_name") || lower === "name") autoMap.name = String(i);
        if (lower.includes("unit_type") || lower === "type") autoMap.type = String(i);
        if (lower.includes("parent")) autoMap.parent = String(i);
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const validate = (): CsvRow[] => {
    const nameIdx = parseInt(mapping.name);
    const typeIdx = parseInt(mapping.type);
    const parentIdx = parseInt(mapping.parent);
    const typeNames = new Map(sortedTypes.map((t) => [t.name.toLowerCase(), t]));

    // Names present in the CSV itself so a child row whose parent appears
    // later in the same file isn't flagged as "Parent not found".
    const inFileNames = new Set(
      rows
        .map((r) => (r.values[nameIdx] ?? "").trim().toLowerCase())
        .filter(Boolean)
    );
    const existingNames = new Set(units.map((u) => u.name.toLowerCase()));

    return rows.map((row) => {
      const name = row.values[nameIdx]?.trim();
      const typeName = row.values[typeIdx]?.trim();
      const parentName = row.values[parentIdx]?.trim();

      if (!name) return { ...row, error: "Missing unit name" };
      if (!typeName) return { ...row, error: "Missing unit type" };

      const unitType = typeNames.get(typeName.toLowerCase());
      if (!unitType) return { ...row, error: `Unknown type: "${typeName}"` };

      if (parentName) {
        const key = parentName.toLowerCase();
        if (!existingNames.has(key) && !inFileNames.has(key)) {
          return { ...row, error: `Parent not found: "${parentName}"` };
        }
      } else if (unitType.level !== sortedTypes[0]?.level) {
        return { ...row, error: `Non-top-level type "${typeName}" requires a parent` };
      }

      return { ...row, error: undefined };
    });
  };

  const handleImport = async () => {
    const validated = validate();
    setRows(validated);
    const errors = validated.filter((r) => r.error);
    if (errors.length === validated.length) {
      toast.error("All rows have errors — fix them and try again");
      return;
    }

    setImporting(true);
    const nameIdx = parseInt(mapping.name);
    const typeIdx = parseInt(mapping.type);
    const parentIdx = parseInt(mapping.parent);
    const typeNames = new Map(sortedTypes.map((t) => [t.name.toLowerCase(), t]));

    // Map of unit name (lowercase) -> id. Seeded with existing DB units, then
    // grown as new rows are inserted so later passes can resolve in-batch parents.
    const nameToId = new Map<string, string>(
      units.map((u) => [u.name.toLowerCase(), u.id])
    );

    const updated = [...validated];
    const pending = () =>
      updated
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) => !row.error && !row.imported);

    let successCount = 0;
    let progressed = true;
    // Multi-pass: as long as any row was inserted last pass, retry the rest so
    // rows whose parent was created earlier in the same import get resolved.
    while (progressed && pending().length > 0) {
      progressed = false;
      for (const { row, idx } of pending()) {
        const name = row.values[nameIdx].trim();
        const typeName = row.values[typeIdx].trim();
        const parentName = row.values[parentIdx]?.trim();
        const unitType = typeNames.get(typeName.toLowerCase())!;

        let parentId: string | null = null;
        if (parentName) {
          const found = nameToId.get(parentName.toLowerCase());
          if (!found) continue; // parent not yet created this pass — try next pass
          parentId = found;
        }

        try {
          const inserted = await addUnit.mutateAsync({
            name,
            unit_type_id: unitType.id,
            parent_id: parentId,
          });
          if (inserted?.id) nameToId.set(name.toLowerCase(), inserted.id);
          updated[idx] = { ...row, imported: true };
          successCount++;
          progressed = true;
        } catch (err: any) {
          updated[idx] = { ...row, error: err.message };
        }
      }
    }

    // Anything still pending after we stopped progressing is a cyclic or
    // orphaned parent — surface it clearly instead of silently skipping.
    for (const { row, idx } of pending()) {
      const parentName = row.values[parentIdx]?.trim();
      updated[idx] = {
        ...row,
        error: parentName
          ? `Parent "${parentName}" could not be resolved (cyclic or missing)`
          : "Could not import row",
      };
    }

    setRows(updated);
    setImporting(false);
    toast.success(`Imported ${successCount} of ${validated.length} units`);
    if (successCount === validated.filter((r) => !r.error).length) {
      onOpenChange(false);
    }
  };

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setMapping({ name: "", type: "", parent: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import units via CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: unit_name, unit_type, parent_unit_name
          </DialogDescription>
        </DialogHeader>

        {headers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose CSV file
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Column mapping */}
            <div className="grid grid-cols-3 gap-3">
              {(["name", "type", "parent"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs capitalize">{field === "name" ? "Unit name" : field === "type" ? "Unit type" : "Parent unit"}</Label>
                  <Select value={mapping[field]} onValueChange={(v) => setMapping({ ...mapping, [field]: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Map column" /></SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left">Row</th>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left">{h}</th>
                    ))}
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-b ${row.error ? "bg-destructive/5" : row.imported ? "bg-[hsl(var(--success))]/5" : ""}`}>
                      <td className="px-3 py-1.5">{i + 1}</td>
                      {row.values.map((v, j) => (
                        <td key={j} className="px-3 py-1.5">{v}</td>
                      ))}
                      <td className="px-3 py-1.5">
                        {row.error && <span className="text-destructive">{row.error}</span>}
                        {row.imported && <span className="text-[hsl(var(--success))]">✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {headers.length > 0 && (
            <>
              <Button variant="outline" onClick={reset}>Reset</Button>
              <Button
                onClick={handleImport}
                disabled={importing || !mapping.name || !mapping.type}
              >
                {importing ? "Importing…" : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvImportModal;
