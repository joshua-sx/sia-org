-- Same-org + active-employee checks inside launch_appraisal_cycle.
-- SECURITY DEFINER bypasses RLS, so client-supplied employee/manager UUIDs
-- must be validated against current_user_org_id() here, not in the UI.
-- Lock the organization row so two concurrent launches cannot both see
-- v_active_count = 0 (the unique index in the follow-up migration is the
-- hard guarantee).

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

  UPDATE public.appraisal_cycles
  SET status = 'active'
  WHERE id = p_cycle_id
  RETURNING * INTO c;

  RETURN c;
END;
$$;

REVOKE ALL ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) TO authenticated;