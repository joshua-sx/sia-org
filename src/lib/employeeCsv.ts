import { EMPLOYMENT_STATUSES, EMPLOYMENT_TYPES } from "./employeeSchema";

export const CSV_COLUMNS = [
  "first_name",
  "last_name",
  "email",
  "employee_code",
  "job_title",
  "department",
  "manager_email",
  "employment_type",
  "employment_status",
  "start_date",
  "location",
  "phone",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

const EXAMPLE_ROW: Record<CsvColumn, string> = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  employee_code: "E-0001",
  job_title: "Senior Engineer",
  department: "Engineering",
  manager_email: "grace@example.com",
  employment_type: "full_time",
  employment_status: "active",
  start_date: "2024-01-15",
  location: "London",
  phone: "+44 20 7946 0000",
};

export function buildTemplateCsv(): string {
  const header = CSV_COLUMNS.join(",");
  const example = CSV_COLUMNS.map((c) => EXAMPLE_ROW[c]).join(",");
  return `${header}\n${example}\n`;
}

export function downloadTemplateCsv() {
  const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "employees-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal RFC4180-ish CSV parser (handles quoted fields, commas in quotes, escaped quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  const push = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      push();
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      push();
      endRow();
      // skip \r\n
      if (c === "\r" && text[i + 1] === "\n") i++;
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    push();
    endRow();
  }
  return rows.filter((r) => r.some((v) => v.trim().length > 0));
}

export interface ParsedEmployeeRow {
  raw: Record<string, string>;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string | null;
  job_title: string | null;
  department: string | null;
  manager_email: string | null;
  employment_type: string;
  employment_status: string;
  start_date: string | null;
  location: string | null;
  phone: string | null;
  errors: string[];
  warnings: string[];
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function validateRow(
  raw: Record<string, string>,
  ctx: {
    departmentNames: Set<string>;
    seenEmails: Set<string>;
    existingEmails: Set<string>;
  }
): ParsedEmployeeRow {
  const get = (k: CsvColumn) => (raw[k] ?? "").trim();
  const errors: string[] = [];
  const warnings: string[] = [];

  const first_name = get("first_name");
  const last_name = get("last_name");
  const email = get("email").toLowerCase();
  const department = get("department");
  const manager_email = get("manager_email").toLowerCase();
  const employment_type = get("employment_type").toLowerCase() || "full_time";
  const employment_status = get("employment_status").toLowerCase() || "active";
  const start_date = get("start_date");

  if (!first_name) errors.push("Missing first name");
  if (!last_name) errors.push("Missing last name");
  if (!email) errors.push("Missing email");
  else if (!isEmail(email)) errors.push("Invalid email");
  else if (ctx.existingEmails.has(email)) errors.push("Email already exists");
  else if (ctx.seenEmails.has(email)) errors.push("Duplicate email in file");

  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(employment_type))
    errors.push(`Invalid employment_type "${employment_type}"`);
  if (!(EMPLOYMENT_STATUSES as readonly string[]).includes(employment_status))
    errors.push(`Invalid employment_status "${employment_status}"`);

  if (department && !ctx.departmentNames.has(department.toLowerCase())) {
    warnings.push(`Department "${department}" not found — will be left blank`);
  }
  if (start_date && Number.isNaN(Date.parse(start_date))) {
    warnings.push(`Unrecognized start_date "${start_date}"`);
  }
  if (manager_email && !isEmail(manager_email)) {
    warnings.push(`Ignoring invalid manager_email "${manager_email}"`);
  }

  if (email && !errors.length) ctx.seenEmails.add(email);

  return {
    raw,
    first_name,
    last_name,
    email,
    employee_code: get("employee_code") || null,
    job_title: get("job_title") || null,
    department: department || null,
    manager_email: manager_email && isEmail(manager_email) ? manager_email : null,
    employment_type,
    employment_status,
    start_date: start_date && !Number.isNaN(Date.parse(start_date)) ? start_date : null,
    location: get("location") || null,
    phone: get("phone") || null,
    errors,
    warnings,
  };
}
