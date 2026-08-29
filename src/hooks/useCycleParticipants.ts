import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ParticipantPerson {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  employment_status: "active" | "on_leave" | "terminated";
}

export interface CycleParticipant {
  id: string;
  cycle_id: string;
  employee_id: string;
  manager_id: string;
  extra_reviewer_id: string | null;
  interim_submitted_at: string | null;
  final_submitted_at: string | null;
  interim_score: number | null;
  final_score: number | null;
  overall_score: number | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  employee: ParticipantPerson;
  manager: ParticipantPerson;
  extra_reviewer: ParticipantPerson | null;
}

const PARTICIPANT_SELECT = `*,
  employee:employees!cycle_participants_employee_id_fkey(id,first_name,last_name,job_title,employment_status),
  manager:employees!cycle_participants_manager_id_fkey(id,first_name,last_name,job_title,employment_status),
  extra_reviewer:employees!cycle_participants_extra_reviewer_id_fkey(id,first_name,last_name,job_title,employment_status)`;

/**
 * Participants of a cycle. RLS scopes the rows to the caller: hr_admin sees
 * every participant in the org, managers their own reports, employees and
 * extra reviewers the rows they're attached to.
 */
export function useCycleParticipants(cycleId: string | null | undefined) {
  const { organization, profile } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["cycle_participants", cycleId, profile?.role === "employee" ? "employee_read" : "full"],
    queryFn: async () => {
      if (profile?.role === "employee") {
        const { data, error } = await supabase
          .from("cycle_participants_employee_read")
          .select(PARTICIPANT_SELECT)
          .eq("cycle_id", cycleId!)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data ?? []) as unknown as CycleParticipant[];
      }

      const { data, error } = await supabase
        .from("cycle_participants")
        .select(PARTICIPANT_SELECT)
        .eq("cycle_id", cycleId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CycleParticipant[];
    },
    enabled: !!organization && !!cycleId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cycle_participants", cycleId] });

  const setExtraReviewer = useMutation({
    mutationFn: async ({
      participantId,
      reviewerId,
    }: {
      participantId: string;
      reviewerId: string | null;
    }) => {
      const { error } = await supabase
        .from("cycle_participants")
        .update({ extra_reviewer_id: reviewerId })
        .eq("id", participantId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const acknowledge = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from("cycle_participants")
        .update({ acknowledged_at: new Date().toISOString() })
        .eq("id", participantId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, setExtraReviewer, acknowledge };
}
