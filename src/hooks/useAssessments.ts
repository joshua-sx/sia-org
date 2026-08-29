import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Stage } from "@/lib/cycleSchema";
import { toRatingUpsertRows, type StageDraft } from "@/lib/assessmentSchema";

export interface GoalRating {
  id: string;
  goal_id: string;
  stage: Stage;
  rating: number | null;
  manager_comment: string | null;
  reviewer_comment: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Ratings for one participant (both stages). Drafts save via upsert on
 * UNIQUE(goal_id, stage); submitting goes through the submit_assessment_stage
 * RPC, which computes and locks the stage score server-side.
 */
export function useAssessments(participantId: string | null | undefined, goalIds: string[]) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["goal_ratings", participantId, goalIds],
    queryFn: async () => {
      if (goalIds.length === 0) return [] as GoalRating[];
      const { data, error } = await supabase
        .from("goal_ratings")
        .select("*")
        .in("goal_id", goalIds);
      if (error) throw error;
      return (data ?? []) as GoalRating[];
    },
    enabled: !!participantId && goalIds.length > 0,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goal_ratings", participantId, goalIds] });
    qc.invalidateQueries({ queryKey: ["cycle_participants"] });
  };

  const saveDraft = useMutation({
    mutationFn: async ({ draft, stage }: { draft: StageDraft; stage: Stage }) => {
      const rows = toRatingUpsertRows(draft, stage);
      if (rows.length === 0) return;
      const { error } = await supabase
        .from("goal_ratings")
        .upsert(rows, { onConflict: "goal_id,stage" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const submitStage = useMutation({
    mutationFn: async (stage: Stage) => {
      const { data, error } = await supabase.rpc("submit_assessment_stage", {
        p_participant_id: participantId!,
        p_stage: stage,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const saveReviewerComment = useMutation({
    mutationFn: async ({ ratingId, comment }: { ratingId: string; comment: string }) => {
      const { error } = await supabase
        .from("goal_ratings")
        .update({ reviewer_comment: comment.trim() ? comment.trim() : null })
        .eq("id", ratingId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, saveDraft, submitStage, saveReviewerComment };
}
