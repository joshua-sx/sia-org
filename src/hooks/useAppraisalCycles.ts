import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toCycleDbPayload, type CycleFormValues, type CycleStatus } from "@/lib/cycleSchema";

export interface AppraisalCycle {
  id: string;
  organization_id: string;
  name: string;
  status: CycleStatus;
  goal_window_start: string;
  goal_window_end: string;
  interim_window_start: string;
  interim_window_end: string;
  final_window_start: string;
  final_window_end: string;
  acknowledgement_due: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: string | null;
  close_note: string | null;
  interim_weight_pct: number | null;
  final_weight_pct: number | null;
}

export function useAppraisalCycles() {
  const { organization } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["appraisal_cycles", organization?.id],
    queryFn: async () => {
      if (!organization) return [] as AppraisalCycle[];
      const { data, error } = await supabase
        .from("appraisal_cycles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AppraisalCycle[];
    },
    enabled: !!organization,
  });

  const activeCycle = query.data?.find((c) => c.status === "active") ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["appraisal_cycles"] });

  const createCycle = useMutation({
    mutationFn: async (values: CycleFormValues) => {
      if (!organization) throw new Error("No organization");
      const { data, error } = await supabase
        .from("appraisal_cycles")
        .insert({ ...toCycleDbPayload(values), organization_id: organization.id })
        .select()
        .single();
      if (error) throw error;
      return data as AppraisalCycle;
    },
    onSuccess: invalidate,
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CycleFormValues }) => {
      const { data, error } = await supabase
        .from("appraisal_cycles")
        .update(toCycleDbPayload(values))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AppraisalCycle;
    },
    onSuccess: invalidate,
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appraisal_cycles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /**
   * Launch a draft cycle: bulk-insert the resolved participant list and flip
   * the status to active in one transaction via the launch_appraisal_cycle
   * RPC. Every participant must already have a manager (DB column is NOT
   * NULL) — unmanaged employees are resolved or excluded in the UI before
   * this runs.
   */
  const launchCycle = useMutation({
    mutationFn: async ({
      cycleId,
      participants,
    }: {
      cycleId: string;
      participants: Array<{ employee_id: string; manager_id: string }>;
    }) => {
      if (participants.length === 0) throw new Error("No participants to launch with");
      const { data, error } = await supabase.rpc("launch_appraisal_cycle", {
        p_cycle_id: cycleId,
        p_participants: participants,
      });
      if (error) throw error;
      return data as AppraisalCycle;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["cycle_participants"] });
    },
  });

  /**
   * Closing goes through the close_cycle RPC, never a direct status update:
   * the guard_cycle_closure trigger rejects direct writes so that every
   * closure is validated, attributed and written to the audit log. Once
   * closed, the cycle is permanently frozen and cannot be reopened.
   */
  const completeCycle = useMutation({
    mutationFn: async ({
      cycleId,
      force = false,
      note,
    }: {
      cycleId: string;
      force?: boolean;
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc("close_cycle", {
        p_cycle_id: cycleId,
        p_force: force,
        p_note: note ?? null,
      });
      if (error) throw error;
      return data as unknown as AppraisalCycle;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["cycle_close_readiness"] });
      qc.invalidateQueries({ queryKey: ["audit_events"] });
    },
  });

  return { ...query, activeCycle, createCycle, updateCycle, deleteCycle, launchCycle, completeCycle };
}
