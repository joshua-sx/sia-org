-- Employee score masking (hide until final submit) and acknowledgement window.

DROP POLICY IF EXISTS employee_read_own_participant ON public.cycle_participants;

CREATE OR REPLACE VIEW public.cycle_participants_employee_read
WITH (security_barrier = true) AS
SELECT
  id,
  cycle_id,
  employee_id,
  manager_id,
  extra_reviewer_id,
  interim_submitted_at,
  final_submitted_at,
  CASE WHEN final_submitted_at IS NOT NULL THEN interim_score END AS interim_score,
  CASE WHEN final_submitted_at IS NOT NULL THEN final_score END AS final_score,
  CASE WHEN final_submitted_at IS NOT NULL THEN overall_score END AS overall_score,
  acknowledged_at,
  created_at,
  updated_at
FROM public.cycle_participants;

GRANT SELECT ON public.cycle_participants_employee_read TO authenticated;

ALTER VIEW public.cycle_participants_employee_read SET (security_invoker = false);

CREATE POLICY employee_read_own_participant ON public.cycle_participants_employee_read
  FOR SELECT TO authenticated
  USING (public.is_employee_of_participant(id));

CREATE OR REPLACE FUNCTION public.guard_participant_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  c public.appraisal_cycles;
BEGIN
  IF current_setting('sia.submit_override', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.interim_submitted_at IS NOT NULL OR NEW.final_submitted_at IS NOT NULL
       OR NEW.interim_score IS NOT NULL OR NEW.final_score IS NOT NULL
       OR NEW.overall_score IS NOT NULL OR NEW.acknowledged_at IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: scores and timestamps are system-managed';
    END IF;
    RETURN NEW;
  END IF;

  IF public.participant_employee_is_terminated(OLD.id) THEN
    RAISE EXCEPTION 'SIA_EMPLOYEE_TERMINATED: this participant is no longer active in the organization';
  END IF;

  IF NEW.cycle_id IS DISTINCT FROM OLD.cycle_id OR NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: cycle and employee are immutable';
  END IF;
  IF NEW.interim_submitted_at IS DISTINCT FROM OLD.interim_submitted_at
     OR NEW.final_submitted_at IS DISTINCT FROM OLD.final_submitted_at
     OR NEW.interim_score IS DISTINCT FROM OLD.interim_score
     OR NEW.final_score IS DISTINCT FROM OLD.final_score
     OR NEW.overall_score IS DISTINCT FROM OLD.overall_score THEN
    RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: scores and submit timestamps are set by submit_assessment_stage';
  END IF;

  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
    IF public.current_user_role() <> 'hr_admin' THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: only HR can reassign the manager';
    END IF;
    IF OLD.final_submitted_at IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_STAGE_LOCKED: manager cannot change after final submission';
    END IF;
  END IF;

  IF NEW.extra_reviewer_id IS DISTINCT FROM OLD.extra_reviewer_id THEN
    IF NOT (public.is_manager_of_participant(OLD.id) OR public.current_user_role() = 'hr_admin') THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: only the manager or HR can set the extra reviewer';
    END IF;
    IF OLD.final_submitted_at IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_STAGE_LOCKED: reviewer cannot change after final submission';
    END IF;
  END IF;

  IF NEW.acknowledged_at IS DISTINCT FROM OLD.acknowledged_at THEN
    IF NOT public.is_employee_of_participant(OLD.id) THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: only the employee can acknowledge their review';
    END IF;
    IF OLD.acknowledged_at IS NOT NULL OR NEW.acknowledged_at IS NULL THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: acknowledgement cannot be changed once set';
    END IF;
    IF OLD.overall_score IS NULL THEN
      RAISE EXCEPTION 'SIA_NOT_SCORED: cannot acknowledge before the overall score exists';
    END IF;
    SELECT * INTO c FROM public.appraisal_cycles WHERE id = OLD.cycle_id;
    IF c.status <> 'active' THEN
      RAISE EXCEPTION 'SIA_CYCLE_NOT_ACTIVE: acknowledgement is only open while the cycle is active';
    END IF;
    IF now()::date > c.acknowledgement_due THEN
      RAISE EXCEPTION 'SIA_ACK_WINDOW_CLOSED: the acknowledgement period has ended';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_participant_writes() FROM PUBLIC, anon, authenticated;
