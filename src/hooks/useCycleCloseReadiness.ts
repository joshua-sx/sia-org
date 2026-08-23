import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mirrors public.cycle_close_readiness — the database is the single source of
 * truth for whether a cycle can be closed, so the UI never invents its own
 * rule and then disagrees with the RPC.
 */
export interface CycleCloseReadiness {
  cycle_id: string;
  status: string;
  participants: number;
  interim_submitted: number;
  final_submitted: number;
  acknowledged: number;
  missing_final: number;
  missing_acknowledgement: number;
  can_close: boolean;
  requires_force: boolean;
}

export function useCycleCloseReadiness(cycleId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["cycle_close_readiness", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cycle_close_readiness", {
        p_cycle_id: cycleId as string,
      });
      if (error) throw error;
      return (data ?? null) as unknown as CycleCloseReadiness | null;
    },
    enabled: !!cycleId && !!organization,
  });
}
