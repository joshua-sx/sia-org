import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
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
import UnitPicker from "./UnitPicker";
import { playSuccessCue } from "@/lib/completionSounds";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Employee | null;
  onSaved?: (employee: Employee) => void;
}

const NONE = "__none__";

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
        {label}
        {required && <span className="ml-0.5 text-[hsl(var(--accent-red))]">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[hsl(var(--ink-subtle))]">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmployeeFormModal({ open, onOpenChange, editing, onSaved }: Props) {
  const { createEmployee, updateEmployee, data: employees = [] } = useEmployees();
  const [addedCount, setAddedCount] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const firstNameRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyEmployeeForm(),
  });

  useEffect(() => {
    if (open) {
      setAddedCount(0);
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
              phone: editing.phone ?? "",
            }
          : emptyEmployeeForm()
      );
      // Focus first name after the modal enter animation settles.
      const t = setTimeout(() => firstNameRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [open, editing, form]);

  const save = async (values: EmployeeFormValues, keepOpen: boolean) => {
    try {
      const saved = editing
        ? await updateEmployee.mutateAsync({ id: editing.id, values })
        : await createEmployee.mutateAsync(values);
      playSuccessCue();
      onSaved?.(saved);

      if (keepOpen && !editing) {
        setAddedCount((c) => c + 1);
        setPulseKey((k) => k + 1);
        form.reset(emptyEmployeeForm());
        firstNameRef.current?.focus();
      } else {
        toast.success(editing ? "Employee updated" : "Employee added");
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save employee");
    }
  };

  const submitClose = form.handleSubmit((v) => save(v, false));
  const submitKeep = form.handleSubmit((v) => save(v, true));

  const otherEmployees = employees.filter((e) => e.id !== editing?.id);
  const { register, watch, setValue, formState } = form;
  const errors = formState.errors;
  const first = watch("first_name");
  const last = watch("last_name");
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[hsl(var(--hairline))]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold tabular-nums"
              style={{
                backgroundColor: "hsl(var(--accent-red) / 0.12)",
                color: "hsl(var(--accent-red))",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[17px] font-semibold tracking-[-0.2px]">
                {editing ? "Edit employee" : "Add employee"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editing
                  ? "Update this person's core record."
                  : "The core record. Extra details (dates, location, notes) come later."}
              </DialogDescription>
            </div>
            <AnimatePresence>
              {addedCount > 0 && (
                <motion.div
                  key={pulseKey}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: "hsl(var(--accent-green) / 0.12)",
                    color: "hsl(var(--accent-green))",
                  }}
                >
                  <Check className="h-3 w-3" />
                  <span className="tabular-nums">{addedCount}</span> added
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogHeader>

        <form
          onSubmit={submitClose}
          className="px-6 py-5 max-h-[70vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First name" required error={errors.first_name?.message}>
              <Input
                {...register("first_name")}
                ref={(el) => {
                  register("first_name").ref(el);
                  firstNameRef.current = el;
                }}
                autoComplete="off"
              />
            </Field>
            <Field label="Last name" required error={errors.last_name?.message}>
              <Input {...register("last_name")} autoComplete="off" />
            </Field>

            <Field label="Work email" required error={errors.email?.message}>
              <Input type="email" {...register("email")} autoComplete="off" />
            </Field>
            <Field label="Employee ID" hint="Optional. E.g. E-0001">
              <Input {...register("employee_code")} autoComplete="off" />
            </Field>

            <Field label="Job title">
              <Input placeholder="Senior Engineer" {...register("job_title")} autoComplete="off" />
            </Field>
            <Field label="Employment type">
              <Select
                value={watch("employment_type")}
                onValueChange={(v) => setValue("employment_type", v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Assign to unit" hint="Pick as deep as this person belongs. Ancestors are derived automatically.">
                <UnitPicker
                  value={watch("org_unit_id") ?? null}
                  onChange={(id) => setValue("org_unit_id", id)}
                />
              </Field>
            </div>

            <Field label="Manager">
              <Select
                value={watch("manager_id") ?? NONE}
                onValueChange={(v) => setValue("manager_id", v === NONE ? null : v)}
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

            <Field label="Status">
              <Select
                value={watch("employment_status")}
                onValueChange={(v) => setValue("employment_status", v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{EMPLOYMENT_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Phone" hint="Optional">
                <Input {...register("phone")} autoComplete="off" />
              </Field>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--ink-strong)/0.02)] flex-row justify-between sm:justify-between gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {addedCount > 0 ? "Done" : "Cancel"}
          </Button>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button
                type="button"
                variant="outline"
                onClick={submitKeep}
                disabled={formState.isSubmitting}
              >
                Save & add another
              </Button>
            )}
            <Button
              type="button"
              onClick={submitClose}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? "Saving…" : editing ? "Save changes" : "Save employee"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeFormModal;
