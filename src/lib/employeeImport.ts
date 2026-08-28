import type { Database, Json, Tables } from "@/integrations/supabase/types";

export interface BulkEmployeeImportRow {
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string | null;
  job_title: string | null;
  org_unit_id: string | null;
  employment_type: string;
  employment_status: string;
  start_date: string | null;
  location: string | null;
  phone: string | null;
  manager_email_pending?: string | null;
}

type BulkImportArgs =
  Database["public"]["Functions"]["bulk_import_employees"]["Args"];

export interface BulkEmployeeImportResult {
  inserted: Tables<"employees">[];
  unresolvedManagers: string[];
}

export function toBulkImportArgs(rows: BulkEmployeeImportRow[]): BulkImportArgs {
  return {
    p_rows: rows.map((row) => ({
      first_name: row.first_name,
      last_name: row.last_name,
      email: normalizeEmail(row.email),
      employee_code: row.employee_code,
      job_title: row.job_title,
      org_unit_id: row.org_unit_id,
      employment_type: row.employment_type,
      employment_status: row.employment_status,
      start_date: row.start_date,
      location: row.location,
      phone: row.phone,
      manager_email: normalizeOptionalEmail(row.manager_email_pending),
    })),
  };
}

export function fromBulkImportResult(result: Json): BulkEmployeeImportResult {
  if (!isJsonObject(result)) {
    throw new Error("Employee import returned an invalid result");
  }

  const inserted = result.inserted;
  const unresolvedManagers = result.unresolved_managers;
  if (
    !Array.isArray(inserted) ||
    !inserted.every(isJsonObject) ||
    !Array.isArray(unresolvedManagers) ||
    !unresolvedManagers.every((email) => typeof email === "string")
  ) {
    throw new Error("Employee import returned an invalid result");
  }

  return {
    inserted: inserted as unknown as Tables<"employees">[],
    unresolvedManagers,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOptionalEmail(email?: string | null): string | null {
  if (!email) return null;
  const normalized = normalizeEmail(email);
  return normalized || null;
}

function isJsonObject(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
