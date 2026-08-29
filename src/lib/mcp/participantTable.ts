import type { Database } from "@/integrations/supabase/types";

/** Employees read scores via masked view; managers and HR use base table. */
export function participantTableForRole(
  role: string | undefined,
): "cycle_participants" | "cycle_participants_employee_read" {
  return role === "employee" ? "cycle_participants_employee_read" : "cycle_participants";
}

export type ParticipantRow = Database["public"]["Tables"]["cycle_participants"]["Row"];
