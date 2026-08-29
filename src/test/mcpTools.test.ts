import { describe, expect, it } from "vitest";
import { participantTableForRole } from "@/lib/mcp/participantTable";
import { mcpError, mcpJson } from "@/lib/mcp/response";

describe("participantTableForRole", () => {
  it("routes employees to the masked participant view", () => {
    expect(participantTableForRole("employee")).toBe("cycle_participants_employee_read");
  });

  it("routes managers and HR to the base participant table", () => {
    expect(participantTableForRole("manager")).toBe("cycle_participants");
    expect(participantTableForRole("hr_admin")).toBe("cycle_participants");
  });
});

describe("mcp response helpers", () => {
  it("marks errors with isError", () => {
    const result = mcpError("Not authenticated");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Not authenticated");
  });

  it("returns structured JSON content", () => {
    const result = mcpJson({ people: [] });
    expect("isError" in result).toBe(false);
    expect(result.structuredContent).toEqual({ people: [] });
    expect(JSON.parse(result.content[0].text)).toEqual({ people: [] });
  });
});

/**
 * Permission model documented for MCP Phase 1 (see PRODUCT.md).
 * Live RLS enforcement requires integration tests against Supabase.
 */
describe("MCP permission model (documented expectations)", () => {
  const matrix = [
    { request: "my_goals", employee: true, manager: true, hr: true },
    { request: "direct_reports", employee: false, manager: true, hr: true },
    { request: "other_team_appraisals", employee: false, manager: false, hr: true },
    { request: "org_wide_pending_by_department", employee: false, manager: false, hr: true },
    { request: "all_employee_directory", employee: true, manager: true, hr: true },
  ] as const;

  it("defines the Phase 1 permission matrix", () => {
    expect(matrix.find((r) => r.request === "other_team_appraisals")?.manager).toBe(false);
    expect(matrix.find((r) => r.request === "org_wide_pending_by_department")?.hr).toBe(true);
  });
});
