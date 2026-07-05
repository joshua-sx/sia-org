import { z } from "zod";

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contractor", "intern"] as const;
export const EMPLOYMENT_STATUSES = ["active", "on_leave", "terminated"] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contractor: "Contractor",
  intern: "Intern",
};

export const EMPLOYMENT_STATUS_LABELS: Record<(typeof EMPLOYMENT_STATUSES)[number], string> = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Terminated",
};

export const employeeFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
  employee_code: z.string().trim().max(60).optional().or(z.literal("")),
  job_title: z.string().trim().max(120).optional().or(z.literal("")),
  org_unit_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  employment_type: z.enum(EMPLOYMENT_TYPES),
  employment_status: z.enum(EMPLOYMENT_STATUSES),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function emptyEmployeeForm(): EmployeeFormValues {
  return {
    first_name: "",
    last_name: "",
    email: "",
    employee_code: "",
    job_title: "",
    org_unit_id: null,
    manager_id: null,
    employment_type: "full_time",
    employment_status: "active",
    start_date: "",
    end_date: "",
    location: "",
    phone: "",
    notes: "",
  };
}

/** Clean form -> DB payload (empty strings become null). */
export function toDbPayload(v: EmployeeFormValues) {
  const clean = (s?: string | null) => (s && s.trim() ? s.trim() : null);
  return {
    first_name: v.first_name.trim(),
    last_name: v.last_name.trim(),
    email: v.email.trim().toLowerCase(),
    employee_code: clean(v.employee_code),
    job_title: clean(v.job_title),
    org_unit_id: v.org_unit_id || null,
    manager_id: v.manager_id || null,
    employment_type: v.employment_type,
    employment_status: v.employment_status,
    start_date: clean(v.start_date),
    end_date: clean(v.end_date),
    location: clean(v.location),
    phone: clean(v.phone),
    notes: clean(v.notes),
  };
}
