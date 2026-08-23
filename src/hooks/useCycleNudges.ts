import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NudgeTaskKind = "goals" | "interim" | "final" | "acknowledgement";

export interface NudgeHistoryRow {
  participant_id: string;
  task_kind: string;
  last_sent_at: string;
  times_sent: number;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function nudgeKey(participantId: string, task: string) {
  return `${participantId}:${task}`;
}

/**
 * The 24h cooldown is enforced in the database (send_cycle_nudge raises
 * SIA_NUDGE_COOLDOWN). This history is only used to disable the button early
 * so people aren't invited to trigger an error.
 */
export function useCycleNudges(cycleId: string | undefined) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const history = useQuery({
    queryKey: ["cycle_nudges", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cycle_nudge_history", {
        p_cycle_id: cycleId as string,
      });
      if (error) throw error;
      return (data ?? []) as unknown as NudgeHistoryRow[];
    },
    enabled: !!cycleId && !!organization,
  });

  const sendNudge = useMutation({
    mutationFn: async ({
      participantId,
      taskKind,
    }: {
      participantId: string;
      taskKind: NudgeTaskKind;
    }) => {
      const { data, error } = await supabase.rpc("send_cycle_nudge", {
        p_participant_id: participantId,
        p_task_kind: taskKind,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cycle_nudges", cycleId] });
      void queryClient.invalidateQueries({ queryKey: ["audit_events"] });
    },
  });

  const sentMap = new Map<string, NudgeHistoryRow>();
  (history.data ?? []).forEach((row) => {
    sentMap.set(nudgeKey(row.participant_id, row.task_kind), row);
  });

  const cooldownUntil = (participantId: string, taskKind: string): Date | null => {
    const row = sentMap.get(nudgeKey(participantId, taskKind));
    if (!row) return null;
    const until = new Date(new Date(row.last_sent_at).getTime() + COOLDOWN_MS);
    return until.getTime() > Date.now() ? until : null;
  };

  return {
    history: history.data ?? [],
    sentMap,
    cooldownUntil,
    sendNudge: sendNudge.mutateAsync,
    isSending: sendNudge.isPending,
  };
}
