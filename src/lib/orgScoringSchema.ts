import { z } from "zod";

export const orgScoringFormSchema = z
  .object({
    interim_weight_pct: z.coerce
      .number({ message: "Interim weight is required" })
      .int("Whole percentages only")
      .min(0, "At least 0%")
      .max(100, "At most 100%"),
    final_weight_pct: z.coerce
      .number({ message: "Final weight is required" })
      .int("Whole percentages only")
      .min(0, "At least 0%")
      .max(100, "At most 100%"),
  })
  .superRefine((v, ctx) => {
    if (v.interim_weight_pct + v.final_weight_pct !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Interim and final weights must add up to 100%",
        path: ["final_weight_pct"],
      });
    }
  });

export type OrgScoringFormValues = z.infer<typeof orgScoringFormSchema>;

export function emptyOrgScoringForm(): OrgScoringFormValues {
  return { interim_weight_pct: 30, final_weight_pct: 70 };
}

export function toOrgScoringDbPayload(v: OrgScoringFormValues) {
  return {
    interim_weight_pct: v.interim_weight_pct,
    final_weight_pct: v.final_weight_pct,
  };
}
