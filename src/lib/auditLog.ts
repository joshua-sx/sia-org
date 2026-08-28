import type { AuditEvent } from "@/hooks/useCycleAudit";
import { downloadCsv, filenameSlug, rowsToCsv } from "@/lib/csvExport";

/** Human labels for the stable action codes emitted by the audit triggers. */
const ACTION_LABELS: Record<string, string> = {
  "cycle.created": "Cycle created",
  "cycle.launched": "Cycle launched",
  "cycle.closed": "Cycle closed",
  "cycle.status_changed": "Cycle status changed",
  "cycle.dates_changed": "Cycle dates changed",
  "cycle.deleted": "Cycle deleted",
  "participant.added": "Participant added",
  "participant.removed": "Participant removed",
  "participant.manager_changed": "Manager reassigned",
  "participant.reviewer_changed": "Reviewer changed",
  "assessment.interim_submitted": "Interim submitted",
  "assessment.final_submitted": "Final submitted",
  "review.acknowledged": "Review acknowledged",
  "goal.created": "Goal added",
  "goal.updated": "Goal updated",
  "goal.deleted": "Goal removed",
  "rating.set": "Rating set",
  "rating.changed": "Rating changed",
  "rating.deleted": "Rating removed",
  "rating.manager_comment_changed": "Manager comment edited",
  "rating.reviewer_comment_changed": "Reviewer comment edited",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export type AuditTone = "critical" | "milestone" | "neutral";

/**
 * Rating changes and forced closes are the events an HR admin has to be able
 * to defend later, so they are visually separated from routine activity.
 */
export function auditTone(event: AuditEvent): AuditTone {
  if (event.action === "rating.changed" || event.action === "rating.deleted") return "critical";
  if (event.action === "cycle.closed" && event.metadata?.forced === true) return "critical";
  if (
    event.action === "cycle.launched" ||
    event.action === "cycle.closed" ||
    event.action === "assessment.final_submitted" ||
    event.action === "review.acknowledged"
  ) {
    return "milestone";
  }
  return "neutral";
}

export const AUDIT_FILTERS = ["all", "ratings", "milestones", "people"] as const;
export type AuditFilter = (typeof AUDIT_FILTERS)[number];

export const AUDIT_FILTER_LABELS: Record<AuditFilter, string> = {
  all: "All activity",
  ratings: "Ratings & scores",
  milestones: "Milestones",
  people: "People changes",
};

export function filterAuditEvents(events: AuditEvent[], filter: AuditFilter): AuditEvent[] {
  switch (filter) {
    case "ratings":
      return events.filter(
        (e) => e.action.startsWith("rating.") || e.action.startsWith("assessment."),
      );
    case "milestones":
      return events.filter((e) => e.action.startsWith("cycle.") || e.action === "review.acknowledged");
    case "people":
      return events.filter((e) => e.action.startsWith("participant."));
    default:
      return events;
  }
}

export function formatAuditTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The audit trail is only useful off-platform if HR can hand it over. */
export function exportAuditCsv(cycleName: string, events: AuditEvent[]) {
  const csv = rowsToCsv(
    ["timestamp", "action", "summary", "actor_email", "actor_role", "entity_type", "details"],
    events.map((e) => [
      e.created_at,
      actionLabel(e.action),
      e.summary ?? "",
      e.actor_email ?? "system",
      e.actor_role ?? "",
      e.entity_type,
      JSON.stringify(e.metadata ?? {}),
    ]),
  );
  downloadCsv(`${filenameSlug(cycleName)}-audit-trail.csv`, csv);
}
