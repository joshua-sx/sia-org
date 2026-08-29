import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listOrgUnitsTool from "./tools/list-org-units";
import listUnitTypesTool from "./tools/list-unit-types";
import listPeopleTool from "./tools/list-people";
import listProfilesTool from "./tools/list-profiles";
import getOrgChartTool from "./tools/get-org-chart";
import getDirectReportsTool from "./tools/get-direct-reports";
import getPersonTool from "./tools/get-person";
import getActiveCycleTool from "./tools/get-active-cycle";
import getMyGoalsTool from "./tools/get-my-goals";
import getTeamGoalsTool from "./tools/get-team-goals";
import getMyAppraisalTool from "./tools/get-my-appraisal";
import getAppraisalHistoryTool from "./tools/get-appraisal-history";
import getPendingReviewsTool from "./tools/get-pending-reviews";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sia-mcp",
  title: "Sia — Organizational intelligence",
  version: "0.2.0",
  instructions: `Sia structures your organization so AI can understand it. These read-only tools expose people, org structure, goals, and appraisals scoped to the authenticated user's permissions (RLS).

Start with \`whoami\` to see identity and linked employee record.
Org structure: \`get_org_chart\`, \`list_org_units\`, \`list_unit_types\`, \`list_people\`, \`get_direct_reports\`, \`get_person\`.
Appraisals: \`get_active_cycle\`, \`get_my_goals\`, \`get_team_goals\`, \`get_my_appraisal\`, \`get_appraisal_history\`, \`get_pending_reviews\`.
Signed-in app users: \`list_profiles\`.

ChatGPT asks; Sia decides what the user may see. No write tools.`,
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoamiTool,
    getOrgChartTool,
    listOrgUnitsTool,
    listUnitTypesTool,
    listPeopleTool,
    listProfilesTool,
    getDirectReportsTool,
    getPersonTool,
    getActiveCycleTool,
    getMyGoalsTool,
    getTeamGoalsTool,
    getMyAppraisalTool,
    getAppraisalHistoryTool,
    getPendingReviewsTool,
  ],
});
