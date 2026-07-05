import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  employeeFormSchema,
  emptyEmployeeForm,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  type EmployeeFormValues,
} from "@/lib/employeeSchema";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useOrgUnits } from "@/hooks/useOrgUnits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Employee | null;
  onSaved?: (employee: Employee) => void;
}

const NONE = "__none__";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))] font-medium">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[hsl(var(--ink-muted))]">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EmployeeFormDrawer({ open, onOpenChange, editing, onSaved }: Props) {
  const { createEmployee, updateEmployee, data: employees = [] } = useEmployees();
  const { data: units = [] } = useOrgUnits();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyEmployeeForm(),
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              first_name: editing.first_name,
              last_name: editing.last_name,
              email: editing.email,
              employee_code: editing.employee_code ?? "",
              job_title: editing.job_title ?? "",
              org_unit_id: editing.org_unit_id ?? null,
              manager_id: editing.manager_id ?? null,
              employment_type: editing.employment_type,
              employment_status: editing.employment_status,
              start_date: editing.start_date ?? "",
              end_date: editing.end_date ?? "",
              location: editing.location ?? "",
              phone: editing.phone ?? "",
              notes: editing.notes ?? "",
            }
          : emptyEmployeeForm()
      );
    }
  }, [open, editing, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = editing
        ? await updateEmployee.mutateAsync({ id: editing.id, values })
        : await createEmployee.mutateAsync(values);
      toast.success(editing ? "Employee updated" : "Employee added");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save employee");
    }
  });

  const otherEmployees = employees.filter((e) => e.id !== editing?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit employee" : "Add employee"}</SheetTitle>
          <SheetDescription>
            {editing ? "Update this employee's details." : "Enter the details for this employee."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <Section title="Identity">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name *" error={form.formState.errors.first_name?.message}>
                <Input {...form.register("first_name")} />
              </Field>
              <Field label="Last name *" error={form.formState.errors.last_name?.message}>
                <Input {...form.register("last_name")} />
              </Field>
            </div>
            <Field label="Work email *" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Employee ID">
              <Input placeholder="E.g. E-0001" {...form.register("employee_code")} />
            </Field>
          </Section>

          <Section title="Role">
            <Field label="Job title">
              <Input placeholder="E.g. Senior Engineer" {...form.register("job_title")} />
            </Field>
            <Field label="Department">
              <Select
                value={form.watch("org_unit_id") ?? NONE}
                onValueChange={(v) => form.setValue("org_unit_id", v === NONE ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select a unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Manager">
              <Select
                value={form.watch("manager_id") ?? NONE}
                onValueChange={(v) => form.setValue("manager_id", v === NONE ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {otherEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.first_name} {e.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Employment type">
              <Select
                value={form.watch("employment_type")}
                onValueChange={(v) => form.setValue("employment_type", v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Employment">
            <Field label="Status">
              <Select
                value={form.watch("employment_status")}
                onValueChange={(v) => form.setValue("employment_status", v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{EMPLOYMENT_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <Input type="date" {...form.register("start_date")} />
              </Field>
              <Field label="End date">
                <Input type="date" {...form.register("end_date")} />
              </Field>
            </div>
            <Field label="Location">
              <Input placeholder="City / office" {...form.register("location")} />
            </Field>
          </Section>

          <Section title="Extras">
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Notes">
              <Textarea rows={3} {...form.register("notes")} />
            </Field>
          </Section>

          <SheetFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="active:scale-[0.96] transition-transform">
              {form.formState.isSubmitting ? "Saving…" : editing ? "Save changes" : "Add employee"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default EmployeeFormDrawer;
