-- Same-org integrity for cycle_participants, including PostgREST inserts that
-- skip launch_appraisal_cycle. SECURITY DEFINER so the check can read
-- employees.organization_id; EXECUTE is revoked from API roles.

CREATE OR REPLACE FUNCTION public.guard_participant_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org uuid;
  emp_org uuid;
  mgr_org uuid;
  rev_org uuid;
BEGIN
  SELECT c.organization_id INTO v_org
  FROM public.appraisal_cycles c
  WHERE c.id = NEW.cycle_id;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'SIA_NOT_FOUND: cycle does not exist';
  END IF;

  SELECT e.organization_id INTO emp_org
  FROM public.employees e
  WHERE e.id = NEW.employee_id;
  IF emp_org IS NULL THEN
    RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: employee does not exist';
  END IF;
  IF emp_org IS DISTINCT FROM v_org THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: employee is outside the cycle organization';
  END IF;

  SELECT e.organization_id INTO mgr_org
  FROM public.employees e
  WHERE e.id = NEW.manager_id;
  IF mgr_org IS NULL THEN
    RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: manager does not exist';
  END IF;
  IF mgr_org IS DISTINCT FROM v_org THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: manager is outside the cycle organization';
  END IF;

  IF NEW.extra_reviewer_id IS NOT NULL THEN
    SELECT e.organization_id INTO rev_org
    FROM public.employees e
    WHERE e.id = NEW.extra_reviewer_id;
    IF rev_org IS NULL THEN
      RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: extra reviewer does not exist';
    END IF;
    IF rev_org IS DISTINCT FROM v_org THEN
      RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: extra reviewer is outside the cycle organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_participant_org ON public.cycle_participants;
CREATE TRIGGER guard_participant_org
  BEFORE INSERT OR UPDATE OF cycle_id, employee_id, manager_id, extra_reviewer_id
  ON public.cycle_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_participant_org();

REVOKE ALL ON FUNCTION public.guard_participant_org() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_participant_org() FROM anon, authenticated;