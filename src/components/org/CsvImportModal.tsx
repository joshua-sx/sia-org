import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { OrgUnitType } from "@/hooks/useOrgUnitTypes";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import type { OrgUnit } from "@/hooks/useOrgUnits";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { parseCsv } from "@/lib/csv";
import { friendlyError } from "@/lib/siaErrors";
import {
  inferOrgUnitCsvMapping,
  planOrgUnitCsvImport,
  validateOrgUnitCsvRows,
  type OrgUnitCsvMapping,
  type OrgUnitCsvRow,
} from "@/lib/orgUnitCsv";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitTypes: OrgUnitType[];
  units: OrgUnit[];
}

const CsvImportModal = ({ open, onOpenChange, unitTypes, units }: Props) => {
  const { addUnit } = useOrgUnits();
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<OrgUnitCsvRow[]>([]);
  const [mapping, setMapping] = useState<OrgUnitCsvMapping>({
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
      const grid = parseCsv(text).map((row) => row.map((v) => v.trim()));
      if (grid.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const hdrs = grid[0];
      setHeaders(hdrs);
      setRows(grid.slice(1).map((values) => ({ values })));

      setMapping(inferOrgUnitCsvMapping(hdrs));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validated = validateOrgUnitCsvRows(rows, mapping, sortedTypes, units);
    setRows(validated);
    const errors = validated.filter((r) => r.error);
    if (errors.length === validated.length) {
      toast.error("All rows have errors — fix them and try again");
      return;
    }

    setImporting(true);
    const nameIdx = Number.parseInt(mapping.name, 10);
    const typeIdx = Number.parseInt(mapping.type, 10);
    const parentIdx = Number.parseInt(mapping.parent, 10);
    const typeNames = new Map(sortedTypes.map((t) => [t.name.toLowerCase(), t]));

    // Map of unit name (lowercase) -> id. Seeded with existing DB units, then
    // grown as new rows are inserted so later passes can resolve in-batch parents.
    const nameToId = new Map<string, string>(
      units.map((u) => [u.name.toLowerCase(), u.id])
    );

    const { orderedIndexes, unresolvedErrors } = planOrgUnitCsvImport(validated, mapping, units);
    const updated = validated.map((row, index) => {
      const unresolvedError = unresolvedErrors.get(index);
      return unresolvedError ? { ...row, error: unresolvedError } : row;
    });
    let successCount = 0;
    for (const index of orderedIndexes) {
      const row = updated[index];
      const name = row.values[nameIdx].trim();
      const typeName = row.values[typeIdx].trim();
      const parentName = row.values[parentIdx]?.trim();
      const unitType = typeNames.get(typeName.toLowerCase());
      if (!unitType) continue;

      const parentId = parentName ? nameToId.get(parentName.toLowerCase()) : null;
      if (parentName && !parentId) {
        updated[index] = { ...row, error: `Parent "${parentName}" could not be resolved` };
        continue;
      }

      try {
        const inserted = await addUnit.mutateAsync({
          name,
          unit_type_id: unitType.id,
          parent_id: parentId,
        });
        if (inserted?.id) nameToId.set(name.toLowerCase(), inserted.id);
        updated[index] = { ...row, imported: true };
        successCount++;
      } catch (err: unknown) {
        updated[index] = {
          ...row,
          error: friendlyError(err, "Could not import row"),
        };
      }
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
