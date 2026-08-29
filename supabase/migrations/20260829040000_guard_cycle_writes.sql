-- Enforce the appraisal-cycle state machine at the database boundary.
-- Draft cycles are editable and deletable. Once launched, dates are frozen,
-- active cycles can only be completed by close_cycle, and completed cycles
-- remain immutable.

CREATE OR REPLACE FUNCTION public.guard_cycle_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION 'SIA_CYCLE_NOT_DRAFT: new cycles must start as drafts';
    END IF;
    IF NEW.closed_at IS NOT NULL OR NEW.closed_by IS NOT NULL OR NEW.close_note IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: closure metadata is system-managed';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION 'SIA_DELETE_DRAFT_ONLY: only draft cycles can be deleted';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: a cycle cannot move between organizations';
  END IF;

  IF OLD.status = 'completed' THEN
    RAISE EXCEPTION 'SIA_CYCLE_CLOSED: a completed cycle cannot be changed';
  END IF;

  IF OLD.status <> 'draft'
     AND (
       NEW.goal_window_start,
       NEW.goal_window_end,
       NEW.interim_window_start,
       NEW.interim_window_end,
       NEW.final_window_start,
       NEW.final_window_end,
       NEW.acknowledgement_due
     ) IS DISTINCT FROM (
       OLD.goal_window_start,
       OLD.goal_window_end,
       OLD.interim_window_start,
       OLD.interim_window_end,
       OLD.final_window_start,
       OLD.final_window_end,
       OLD.acknowledgement_due
     ) THEN
    RAISE EXCEPTION 'SIA_CYCLE_WINDOWS_LOCKED: cycle dates cannot change after launch';
  END IF;

  IF (
    NEW.closed_at,
    NEW.closed_by,
    NEW.close_note
  ) IS DISTINCT FROM (
    OLD.closed_at,
    OLD.closed_by,
    OLD.close_note
  ) AND current_setting('sia.close_override', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: closure metadata is set by close_cycle';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'draft' AND NEW.status = 'active' THEN
      IF current_setting('sia.launch_override', true) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION 'SIA_LAUNCH_VIA_RPC: use the launch cycle action to activate a cycle';
      END IF;
    ELSIF OLD.status = 'active' AND NEW.status = 'completed' THEN
      IF current_setting('sia.close_override', true) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION 'SIA_CLOSE_VIA_RPC: use the close cycle action to complete a cycle';
      END IF;
    ELSE
      RAISE EXCEPTION 'SIA_INVALID_CYCLE_TRANSITION: cannot move a cycle from % to %',
        OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_cycle_writes ON public.appraisal_cycles;
CREATE TRIGGER guard_cycle_writes
  BEFORE INSERT OR UPDATE OR DELETE ON public.appraisal_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_cycle_writes();

REVOKE ALL ON FUNCTION public.guard_cycle_writes() FROM PUBLIC, anon, authenticated;

-- launch_appraisal_cycle is the sole path allowed to perform draft -> active.
-- This replaces the Phase 2 body only to add a transaction-local override
-- around its status update.
CREATE OR REPLACE FUNCTION public.launch_appraisal_cycle(p_cycle_id uuid, p_participants jsonb)
RETURNS public.appraisal_cycles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  c public.appraisal_cycles;
  v_org uuid;
  v_active_count integer;
  rec record;
  emp public.employees;
  mgr public.employees;
BEGIN
  IF public.current_user_role() <> 'hr_admin' THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: only HR can launch a cycle';
  END IF;

  SELECT * INTO c FROM public.appraisal_cycles WHERE id = p_cycle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SIA_NOT_FOUND: cycle does not exist';
  END IF;

  v_org := public.current_user_org_id();
  IF c.organization_id IS DISTINCT FROM v_org THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: cycle is outside your organization';
  END IF;

  PERFORM 1 FROM public.organizations WHERE id = v_org FOR UPDATE;

  IF c.status <> 'draft' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_DRAFT: only a draft cycle can be launched';
  END IF;

  IF jsonb_typeof(p_participants) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_participants) = 0 THEN
    RAISE EXCEPTION 'SIA_NO_PARTICIPANTS: no participants to launch with';
  END IF;

  SELECT count(*) INTO v_active_count
  FROM public.appraisal_cycles
  WHERE organization_id = v_org AND status = 'active';
  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'SIA_CYCLE_ALREADY_ACTIVE: another cycle is already active';
  END IF;

  FOR rec IN
    SELECT
      (elem->>'employee_id')::uuid AS employee_id,
      (elem->>'manager_id')::uuid AS manager_id
    FROM jsonb_array_elements(p_participants) AS elem
  LOOP
    IF rec.employee_id IS NULL OR rec.manager_id IS NULL THEN
      RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: employee_id and manager_id are required';
    END IF;
    IF rec.employee_id = rec.manager_id THEN
      RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: employee cannot be their own manager';
    END IF;

    SELECT * INTO emp FROM public.employees WHERE id = rec.employee_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: employee does not exist';
    END IF;
    IF emp.organization_id IS DISTINCT FROM v_org THEN
      RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: employee is outside your organization';
    END IF;
    IF emp.employment_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'SIA_EMPLOYEE_NOT_ACTIVE: only active employees can be launched';
    END IF;

    SELECT * INTO mgr FROM public.employees WHERE id = rec.manager_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'SIA_INVALID_PARTICIPANT: manager does not exist';
    END IF;
    IF mgr.organization_id IS DISTINCT FROM v_org THEN
      RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: manager is outside your organization';
    END IF;
    IF mgr.employment_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'SIA_EMPLOYEE_NOT_ACTIVE: only active employees can be launched';
    END IF;
  END LOOP;

  INSERT INTO public.cycle_participants (cycle_id, employee_id, manager_id)
  SELECT p_cycle_id,
         (elem->>'employee_id')::uuid,
         (elem->>'manager_id')::uuid
  FROM jsonb_array_elements(p_participants) AS elem;

  PERFORM set_config('sia.launch_override', 'on', true);
  UPDATE public.appraisal_cycles
  SET status = 'active'
  WHERE id = p_cycle_id
  RETURNING * INTO c;
  PERFORM set_config('sia.launch_override', 'off', true);

  RETURN c;
END;
$$;

REVOKE ALL ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) TO authenticated, service_role;
