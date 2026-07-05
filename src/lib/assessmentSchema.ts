import { z } from "zod";
import type { Stage } from "@/lib/cycleSchema";

export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

export const RATING_LABELS: Record<number, string> = {
  1: "1 — Needs improvement",
  2: "2 — Below expectations",
  3: "3 — Meets expectations",
  4: "4 — Exceeds expectations",
  5: "5 — Outstanding",
};

export const ratingDraftSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  manager_comment: z.string().trim().max(2000).nullable(),
});

export type RatingDraft = z.infer<typeof ratingDraftSchema>;

/** One editable draft row per goal for a given stage. */
export interface StageDraft {
  [goalId: string]: RatingDraft;
}

export function toRatingUpsertRows(draft: StageDraft, stage: Stage) {
  return Object.entries(draft).map(([goalId, d]) => ({
    goal_id: goalId,
    stage,
    rating: d.rating,
    manager_comment: d.manager_comment && d.manager_comment.trim() ? d.manager_comment.trim() : null,
  }));
}
