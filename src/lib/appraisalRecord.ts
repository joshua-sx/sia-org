import type { AppraisalCycle } from "@/hooks/useAppraisalCycles";
import type { CycleParticipant } from "@/hooks/useCycleParticipants";
import type { Goal } from "@/hooks/useGoals";
import type { GoalRating } from "@/hooks/useAssessments";
import { RATING_LABELS } from "@/lib/assessmentSchema";
import { STAGE_LABELS, type Stage } from "@/lib/cycleSchema";
import { formatScore } from "@/lib/scoring";

export interface AppraisalRecordData {
  organizationName: string;
  cycle: AppraisalCycle;
  participant: CycleParticipant;
  goals: Goal[];
  ratings: GoalRating[];
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ratingFor(ratings: GoalRating[], goalId: string, stage: Stage): GoalRating | undefined {
  return ratings.find((r) => r.goal_id === goalId && r.stage === stage);
}

function buildRecordHtml(data: AppraisalRecordData): string {
  const { organizationName, cycle, participant, goals, ratings } = data;
  const employee = participant.employee;
  const manager = participant.manager;
  const employeeName = `${employee.first_name} ${employee.last_name}`.trim();
  const managerName = `${manager.first_name} ${manager.last_name}`.trim();

  const goalRows = goals
    .map((goal) => {
      const interim = ratingFor(ratings, goal.id, "interim");
      const final = ratingFor(ratings, goal.id, "final");
      const interimRating =
        interim?.rating != null ? RATING_LABELS[interim.rating] ?? String(interim.rating) : "—";
      const finalRating =
        final?.rating != null ? RATING_LABELS[final.rating] ?? String(final.rating) : "—";
      return `
        <tr>
          <td>${escapeHtml(goal.title)}</td>
          <td>${goal.weight}%</td>
          <td>${escapeHtml(interimRating)}</td>
          <td>${escapeHtml(finalRating)}</td>
        </tr>
        ${
          interim?.manager_comment || final?.manager_comment || interim?.reviewer_comment || final?.reviewer_comment
            ? `<tr class="comments"><td colspan="4">
                ${interim?.manager_comment ? `<p><strong>Interim (manager):</strong> ${escapeHtml(interim.manager_comment)}</p>` : ""}
                ${final?.manager_comment ? `<p><strong>Final (manager):</strong> ${escapeHtml(final.manager_comment)}</p>` : ""}
                ${interim?.reviewer_comment ? `<p><strong>Interim (reviewer):</strong> ${escapeHtml(interim.reviewer_comment)}</p>` : ""}
                ${final?.reviewer_comment ? `<p><strong>Final (reviewer):</strong> ${escapeHtml(final.reviewer_comment)}</p>` : ""}
              </td></tr>`
            : ""
        }`;
    })
    .join("");

  const ackLine = participant.acknowledged_at
    ? `Acknowledged ${new Date(participant.acknowledged_at).toLocaleString()}`
    : "Not yet acknowledged";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(employeeName)} — ${escapeHtml(cycle.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; margin: 40px; line-height: 1.5; font-size: 13px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
    .meta { color: #444; margin-bottom: 24px; }
    .meta p { margin: 2px 0; }
    .scores { display: flex; gap: 24px; margin: 16px 0; }
    .score { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
    .score span { display: block; font-size: 11px; color: #666; text-transform: uppercase; }
    .score strong { font-size: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
    tr.comments td { background: #fafafa; font-size: 12px; border-top: none; }
    tr.comments p { margin: 4px 0; }
    .footer { margin-top: 32px; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>
  <h1>Appraisal record</h1>
  <p class="meta"><strong>${escapeHtml(organizationName)}</strong> · ${escapeHtml(cycle.name)}</p>

  <h2>Employee</h2>
  <div class="meta">
    <p><strong>Name:</strong> ${escapeHtml(employeeName)}</p>
    <p><strong>Job title:</strong> ${escapeHtml(employee.job_title ?? "—")}</p>
    <p><strong>Manager:</strong> ${escapeHtml(managerName)}</p>
    <p><strong>Review period:</strong> ${cycle.goal_window_start} → ${cycle.final_window_end}</p>
  </div>

  <h2>Scores</h2>
  <div class="scores">
    <div class="score"><span>Interim</span><strong>${formatScore(participant.interim_score)}</strong></div>
    <div class="score"><span>Final</span><strong>${formatScore(participant.final_score)}</strong></div>
    <div class="score"><span>Overall</span><strong>${formatScore(participant.overall_score)}</strong></div>
  </div>

  <h2>Goals &amp; ratings</h2>
  <table>
    <thead>
      <tr>
        <th>Goal</th>
        <th>Weight</th>
        <th>${escapeHtml(STAGE_LABELS.interim)}</th>
        <th>${escapeHtml(STAGE_LABELS.final)}</th>
      </tr>
    </thead>
    <tbody>
      ${goalRows || `<tr><td colspan="4">No goals recorded.</td></tr>`}
    </tbody>
  </table>

  <div class="footer">
    <p>${escapeHtml(ackLine)}</p>
    <p>Generated ${new Date().toLocaleString()} · SIA</p>
  </div>
</body>
</html>`;
}

/** Open a print-ready appraisal record in a new window (save as PDF via the browser). */
export function printAppraisalRecord(data: AppraisalRecordData) {
  const html = buildRecordHtml(data);
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) throw new Error("Pop-up blocked — allow pop-ups to export the PDF.");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
}
