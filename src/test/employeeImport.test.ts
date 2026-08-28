import { describe, expect, it } from "vitest";
import {
  fromBulkImportResult,
  toBulkImportArgs,
  type BulkEmployeeImportRow,
} from "@/lib/employeeImport";
import type { Json, Tables } from "@/integrations/supabase/types";

const row: BulkEmployeeImportRow = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "  ADA@Example.COM ",
  employee_code: "E-0001",
  job_title: "Engineer",
  org_unit_id: "11111111-1111-1111-1111-111111111111",
  employment_type: "full_time",
  employment_status: "active",
  start_date: null,
  location: null,
  phone: "+44 20 7946 0000",
  manager_email_pending: " Grace@Example.COM ",
};

describe("toBulkImportArgs", () => {
  it("normalizes employee and manager emails without adding an organization id", () => {
    expect(toBulkImportArgs([row])).toEqual({
      p_rows: [
        {
          first_name: "Ada",
          last_name: "Lovelace",
          email: "ada@example.com",
          employee_code: "E-0001",
          job_title: "Engineer",
          org_unit_id: "11111111-1111-1111-1111-111111111111",
          employment_type: "full_time",
          employment_status: "active",
          start_date: null,
          location: null,
          phone: "+44 20 7946 0000",
          manager_email: "grace@example.com",
        },
      ],
    });
  });

  it("maps a blank manager email to null", () => {
    const args = toBulkImportArgs([
      { ...row, manager_email_pending: "   " },
    ]);

    expect(args.p_rows).toEqual([
      expect.objectContaining({ manager_email: null }),
    ]);
  });
});

describe("fromBulkImportResult", () => {
  it("maps the RPC snake_case result to the existing UI result shape", () => {
    const employee: Tables<"employees"> = {
      id: "22222222-2222-2222-2222-222222222222",
      organization_id: "33333333-3333-3333-3333-333333333333",
      employee_code: "E-0001",
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      job_title: "Engineer",
      org_unit_id: null,
      manager_id: null,
      employment_type: "full_time",
      employment_status: "active",
      start_date: null,
      end_date: null,
      location: null,
      phone: null,
      notes: null,
      profile_id: null,
      created_at: "2026-08-28T18:00:00Z",
      updated_at: "2026-08-28T18:00:00Z",
    };
    const rpcResult: Json = {
      inserted: [employee],
      unresolved_managers: ["unknown@example.com"],
    };

    expect(fromBulkImportResult(rpcResult)).toEqual({
      inserted: [employee],
      unresolvedManagers: ["unknown@example.com"],
    });
  });

  it("rejects a malformed RPC result instead of silently losing rows", () => {
    expect(() =>
      fromBulkImportResult({
        inserted: [],
        unresolved_managers: [42],
      }),
    ).toThrow("Employee import returned an invalid result");
  });
});
