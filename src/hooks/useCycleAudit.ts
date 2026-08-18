import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * The audit log is append-only (see the audit_events migration): the database
 * blocks UPDATE and DELETE for everyone, writes happen only through
 * SECURITY DEFINER triggers, and RLS restricts reads to HR admins of the
 * owning organisation. The client therefore only ever reads.
 */
export interface AuditEvent {
  id: string;
  organization_id: string;
  actor_profile_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  cycle_id: string | null;
  employee_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useCycleAudit(cycleId: string | undefined, enabled = true) {
  const { profile, organization } = useAuth();
  const isHr = profile?.role === "hr_admin";

  return useQuery({
    queryKey: ["audit_events", organization?.id, cycleId],
    queryFn: async () => {
      let q = supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cycleId) q = q.eq("cycle_id", cycleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AuditEvent[];
    },
    enabled: enabled && isHr && !!organization,
  });
}
