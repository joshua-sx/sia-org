import { z } from "zod";

export const goalFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  weight: z.coerce
    .number({ message: "Weight is required" })
    .int("Whole percentages only")
    .min(1, "At least 1%")
    .max(100, "At most 100%"),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export function emptyGoalForm(): GoalFormValues {
  return { title: "", description: "", weight: 25 };
}

export function toGoalDbPayload(v: GoalFormValues) {
  return {
    title: v.title.trim(),
    description: v.description && v.description.trim() ? v.description.trim() : null,
    weight: v.weight,
  };
}
