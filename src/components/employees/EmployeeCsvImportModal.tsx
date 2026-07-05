import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  CSV_COLUMNS,
  downloadTemplateCsv,
  parseCsv,
  validateRow,
  type CsvColumn,
  type ParsedEmployeeRow,
} from "@/lib/employeeCsv";
import { useOrgUnits } from "@/hooks/useOrgUnits";
import { useEmployees } from "@/hooks/useEmployees";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: (count: number) => void;
}

export function EmployeeCsvImportModal({ open, onOpenChange, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: units = [] } = useOrgUnits();
  const { data: existing = [], bulkInsert } = useEmployees();

  const [rows, setRows] = useState<ParsedEmployeeRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<{ inserted: number; skipped: number } | null>(null);

  const departmentByName = useMemo(() => {
    const m = new Map<string, string>();
    units.forEach((u) => m.set(u.name.toLowerCase(), u.id));
    return m;
  }, [units]);

  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const readyCount = rows.length - errorCount;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const grid = parseCsv(text);
      if (grid.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const headers = grid[0].map((h) => h.trim().toLowerCase());
      const rowObjects = grid.slice(1).map((r) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
        return obj;
      });

      const departmentNames = new Set(units.map((u) => u.name.toLowerCase()));
      const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()));
      const seenEmails = new Set<string>();
      const parsed = rowObjects.map((raw) =>
        validateRow(raw as Record<CsvColumn, string>, {
          departmentNames,
          seenEmails,
          existingEmails,
        })
      );
      setRows(parsed);
      setSummary(null);
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    const ready = rows.filter((r) => r.errors.length === 0);
    if (!ready.length) {
      toast.error("Nothing to import — fix the errors above.");
      return;
    }
    setImporting(true);
    try {
      const payload = ready.map((r) => ({
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        employee_code: r.employee_code,
        job_title: r.job_title,
        org_unit_id: r.department ? departmentByName.get(r.department.toLowerCase()) ?? null : null,
        employment_type: r.employment_type,
        employment_status: r.employment_status,
        start_date: r.start_date,
        location: r.location,
        phone: r.phone,
        manager_email_pending: r.manager_email,
      }));
      const { inserted } = await bulkInsert.mutateAsync(payload);
      setSummary({ inserted: inserted.length, skipped: rows.length - inserted.length });
      onImported?.(inserted.length);
      toast.success(`Imported ${inserted.length} of ${rows.length} rows`);
    } catch (err: any) {
      toast.error(err?.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setRows([]);
    setFileName("");
    setSummary(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import employees</DialogTitle>
          <DialogDescription>
            Upload a CSV with these columns: {CSV_COLUMNS.join(", ")}
          </DialogDescription>
        </DialogHeader>

        {summary ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[hsl(var(--accent-green))]" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Import complete</h3>
            <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
              <span className="tabular-nums">{summary.inserted}</span> added,{" "}
              <span className="tabular-nums">{summary.skipped}</span> skipped.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: "hsl(var(--accent-red) / 0.12)" }}
            >
              <Upload className="h-6 w-6" style={{ color: "hsl(var(--accent-red))" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop a CSV or choose a file</p>
              <p className="mt-1 text-xs text-[hsl(var(--ink-muted))]">
                Not sure where to start? Grab the template below.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Choose CSV
              </Button>
              <Button variant="ghost" onClick={downloadTemplateCsv}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download template
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--ink-muted))] truncate">{fileName}</span>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-[hsl(var(--accent-green))]">✓ {readyCount} ready</span>
                {errorCount > 0 && (
                  <span className="text-destructive">✗ {errorCount} blocked</span>
                )}
              </div>
            </div>

            <div className="max-h-[360px] overflow-auto rounded-lg border border-[hsl(var(--hairline))]">
              <table className="w-full text-xs">
                <thead className="bg-[hsl(var(--ink-strong)/0.03)] sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">Email</th>
                    <th className="text-left px-3 py-2 font-medium">Department</th>
                    <th className="text-left px-3 py-2 font-medium">Manager</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-t border-[hsl(var(--hairline))] ${
                        r.errors.length ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2 tabular-nums text-[hsl(var(--ink-subtle))]">{i + 1}</td>
                      <td className="px-3 py-2">
                        {r.first_name} {r.last_name}
                      </td>
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">{r.department ?? "—"}</td>
                      <td className="px-3 py-2">{r.manager_email ?? "—"}</td>
                      <td className="px-3 py-2">
                        {r.errors.length ? (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {r.errors[0]}
                          </span>
                        ) : r.warnings.length ? (
                          <span className="text-[hsl(45,70%,32%)]">{r.warnings[0]}</span>
                        ) : (
                          <span className="text-[hsl(var(--accent-green))]">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {summary ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : rows.length > 0 ? (
            <>
              <Button variant="ghost" onClick={reset}>Choose another file</Button>
              <Button
                onClick={runImport}
                disabled={importing || readyCount === 0}
                className="active:scale-[0.96] transition-transform"
              >
                {importing ? "Importing…" : `Import ${readyCount}`}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeCsvImportModal;
