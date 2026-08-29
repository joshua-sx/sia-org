import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createMcpSupabase, EMPLOYEE_SELECT, getCallerEmployee } from "../supabase";
import { mcpError, mcpJson } from "../response";

export default defineTool({
  name: "get_person",
  title: "Get person",
  description:
    "Look up a person by employee id, email, or name. Omit filters to return the signed-in user's employee record. Includes job title, org unit, manager, and active-cycle goal titles.",
  inputSchema: {
    employee_id: z.string().uuid().optional().describe("Employee record id."),
    email: z.string().email().optional().describe("Employee email."),
    name: z.string().min(1).optional().describe("Partial name match (first or last)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ employee_id, email, name }, ctx) => {
    const supabase = createMcpSupabase(ctx);
    if (!supabase) return mcpError("Not authenticated");

    let query = supabase.from("employees").select(EMPLOYEE_SELECT);

    if (employee_id) {
      query = query.eq("id", employee_id);
    } else if (email) {
      query = query.ilike("email", email);
    } else if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
    } else {
      const caller = await getCallerEmployee(supabase, ctx.getUserId());
      if (!caller) return mcpError("No employee record linked to your profile.");
      query = query.eq("id", caller.id);
    }

    const { data: people, error } = await query.limit(employee_id || email || !name ? 1 : 10);
    if (error) return mcpError(error.message);
    if (!people?.length) return mcpJson({ people: [], active_goals: [] });

    const person = people.length === 1 ? people[0] : null;
    const targetId = person?.id ?? people[0]?.id;

    let activeGoals: { title: string; weight: number }[] = [];
    if (targetId) {
      const { data: cycle } = await supabase
        .from("appraisal_cycles")
        .select("id")
        .eq("status", "active")
        .maybeSingle();

      if (cycle) {
        const { data: participant } = await supabase
          .from("cycle_participants")
          .select("id")
          .eq("cycle_id", cycle.id)
          .eq("employee_id", targetId)
          .maybeSingle();

        if (participant) {
          const { data: goals } = await supabase
            .from("goals")
            .select("title, weight")
            .eq("participant_id", participant.id)
            .order("created_at");
          activeGoals = goals ?? [];
        }
      }
    }

    return mcpJson({
      people,
      active_goals: activeGoals,
    });
  },
});
