import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listOrgUnitsTool from "./tools/list-org-units";
import listUnitTypesTool from "./tools/list-unit-types";
import listEmployeesTool from "./tools/list-employees";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sia-mcp",
  title: "SIA — Smart Performance Management",
  version: "0.1.0",
  instructions:
    "Tools for SIA, a multi-tenant HR performance management platform. Use `whoami` to see the signed-in user, `list_unit_types` to see hierarchy levels, `list_org_units` to explore the org structure, and `list_employees` to find people in the organization. All reads are scoped to the signed-in user's organization.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listOrgUnitsTool, listUnitTypesTool, listEmployeesTool],
});
