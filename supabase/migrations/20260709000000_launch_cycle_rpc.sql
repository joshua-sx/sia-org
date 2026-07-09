
-- Atomic cycle launch: bulk-insert cycle_participants and flip the cycle to
-- active in a single transaction. Replaces the old client-side two-step
-- insert-then-update (see useAppraisalCycles.ts) which could leave
-- participants inserted against a cycle still marked draft on partial failure.

CREATE OR REPLACE FUNCTION public.launch_appraisal_cycle(p_cycle_id uuid, p_participants jsonb)
RETURNS public.appraisal_cycles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.appraisal_cycles;
  v_org uuid;
  v_active_count integer;
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

  IF c.status <> 'draft' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_DRAFT: only a draft cycle can be launched';
  END IF;

  IF jsonb_array_length(p_participants) = 0 THEN
    RAISE EXCEPTION 'SIA_NO_PARTICIPANTS: no participants to launch with';
  END IF;

  SELECT count(*) INTO v_active_count
  FROM public.appraisal_cycles
  WHERE organization_id = v_org AND status = 'active';
  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'SIA_CYCLE_ALREADY_ACTIVE: another cycle is already active';
  END IF;

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
