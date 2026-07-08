import { useAuth } from "@/contexts/AuthContext";
import { useAppraisalCycles } from "@/hooks/useAppraisalCycles";
import { useCycleParticipants } from "@/hooks/useCycleParticipants";
import { useGoals } from "@/hooks/useGoals";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { ProgressTracker } from "@/components/appraisals/ProgressTracker";
import { participantTrackerSteps } from "@/lib/trackerSteps";
import { weightSum } from "@/lib/scoring";

/**
 * "Your appraisal" status card on the home screen for non-HR users who are
 * participants in the active cycle. Pure status — the one action the employee
 * owns links out to My Review, where the acknowledgement actually happens.
 */
export function DashboardAppraisalCard({ className }: { className?: string }) {
  const { profile } = useAuth();
  const isHr = profile?.role === "hr_admin";
  const { activeCycle } = useAppraisalCycles();
  const { myEmployee } = useMyEmployee();
  const { data: participants = [] } = useCycleParticipants(isHr ? undefined : activeCycle?.id);
  const myParticipant =
    !isHr && myEmployee ? participants.find((p) => p.employee_id === myEmployee.id) ?? null : null;
  const { data: goals = [] } = useGoals(myParticipant?.id);

  if (isHr || !activeCycle || !myParticipant) return null;

  return (
    <div className={className}>
      <ProgressTracker
        title="Your appraisal"
        steps={participantTrackerSteps(myParticipant, weightSum(goals), {
          acknowledgeAction: { label: "Open review", href: "/appraisals/my-review" },
        })}
      />
    </div>
  );
}

export default DashboardAppraisalCard;
