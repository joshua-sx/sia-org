-- Snapshot org interim/final weights onto the cycle at launch so mid-cycle org
-- changes do not affect overall score calculation for in-flight cycles.

ALTER TABLE public.appraisal_cycles
  ADD COLUMN IF NOT EXISTS interim_weight_pct integer,
  ADD COLUMN IF NOT EXISTS final_weight_pct integer;

DO $$ BEGIN
  ALTER TABLE public.appraisal_cycles
    ADD CONSTRAINT chk_cycle_stage_weights
    CHECK (
      (interim_weight_pct IS NULL AND final_weight_pct IS NULL)
      OR (
        interim_weight_pct IS NOT NULL
        AND final_weight_pct IS NOT NULL
        AND interim_weight_pct + final_weight_pct = 100
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.appraisal_cycles ac
SET
  interim_weight_pct = o.interim_weight_pct,
  final_weight_pct = o.final_weight_pct
FROM public.organizations o
WHERE ac.organization_id = o.id
  AND ac.status IN ('active', 'completed')
  AND ac.interim_weight_pct IS NULL;

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
  v_iw integer;
  v_fw integer;
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

  SELECT interim_weight_pct, final_weight_pct INTO v_iw, v_fw
  FROM public.organizations
  WHERE id = v_org;

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
  SET status = 'active',
      interim_weight_pct = v_iw,
      final_weight_pct = v_fw
  WHERE id = p_cycle_id
  RETURNING * INTO c;
  PERFORM set_config('sia.launch_override', 'off', true);

  RETURN c;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_assessment_stage(p_participant_id uuid, p_stage text)
RETURNS public.cycle_participants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  cp public.cycle_participants;
  c public.appraisal_cycles;
  v_goal_count integer;
  v_weight_sum integer;
  v_unrated integer;
  v_score numeric(4,2);
  v_iw integer;
  v_fw integer;
BEGIN
  IF p_stage NOT IN ('interim','final') THEN
    RAISE EXCEPTION 'SIA_INVALID_STAGE: stage must be interim or final';
  END IF;

  SELECT * INTO cp FROM public.cycle_participants WHERE id = p_participant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SIA_NOT_FOUND: participant does not exist';
  END IF;

  IF public.participant_employee_is_terminated(cp.id) THEN
    RAISE EXCEPTION 'SIA_EMPLOYEE_TERMINATED: this participant is no longer active in the organization';
  END IF;

  SELECT * INTO c FROM public.appraisal_cycles WHERE id = cp.cycle_id;

  IF c.organization_id IS DISTINCT FROM public.current_user_org_id() THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: participant is outside your organization';
  END IF;
  IF NOT (public.is_manager_of_participant(cp.id) OR public.current_user_role() = 'hr_admin') THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: only the manager or HR can submit';
  END IF;
  IF c.status <> 'active' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_ACTIVE: the cycle is not active';
  END IF;

  IF p_stage = 'interim' THEN
    IF cp.interim_submitted_at IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_STAGE_LOCKED: interim assessment already submitted';
    END IF;
    IF now()::date < c.interim_window_start OR now()::date > c.interim_window_end THEN
      RAISE EXCEPTION 'SIA_WINDOW_CLOSED: outside the interim assessment window';
    END IF;
  ELSE
    IF cp.final_submitted_at IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_STAGE_LOCKED: final assessment already submitted';
    END IF;
    IF cp.interim_submitted_at IS NULL THEN
      RAISE EXCEPTION 'SIA_INTERIM_NOT_SUBMITTED: submit the interim assessment first';
    END IF;
    IF now()::date < c.final_window_start OR now()::date > c.final_window_end THEN
      RAISE EXCEPTION 'SIA_WINDOW_CLOSED: outside the final assessment window';
    END IF;
    IF c.interim_weight_pct IS NULL OR c.final_weight_pct IS NULL THEN
      RAISE EXCEPTION 'SIA_NOT_SCORED: cycle scoring weights were not snapshotted at launch';
    END IF;
  END IF;

  SELECT count(*), COALESCE(sum(weight), 0)
  INTO v_goal_count, v_weight_sum
  FROM public.goals WHERE participant_id = cp.id;
  IF v_goal_count = 0 THEN
    RAISE EXCEPTION 'SIA_NO_GOALS: the participant has no goals';
  END IF;
  IF v_weight_sum <> 100 THEN
    RAISE EXCEPTION 'SIA_WEIGHTS_NOT_100: goal weights must sum to 100 (currently %)', v_weight_sum;
  END IF;

  PERFORM 1
  FROM public.goal_ratings r
  JOIN public.goals g ON g.id = r.goal_id
  WHERE g.participant_id = cp.id
    AND r.stage = p_stage
  FOR UPDATE OF r;

  SELECT count(*)
  INTO v_unrated
  FROM public.goals g
  LEFT JOIN public.goal_ratings r
    ON r.goal_id = g.id AND r.stage = p_stage AND r.rating IS NOT NULL
  WHERE g.participant_id = cp.id AND r.id IS NULL;
  IF v_unrated > 0 THEN
    RAISE EXCEPTION 'SIA_RATINGS_INCOMPLETE: % goal(s) still unrated for this stage', v_unrated;
  END IF;

  SELECT round(sum(r.rating * g.weight)::numeric / 100, 2)
  INTO v_score
  FROM public.goals g
  JOIN public.goal_ratings r ON r.goal_id = g.id AND r.stage = p_stage
  WHERE g.participant_id = cp.id;

  PERFORM set_config('sia.submit_override', 'on', true);
  IF p_stage = 'interim' THEN
    UPDATE public.cycle_participants
    SET interim_score = v_score, interim_submitted_at = now()
    WHERE id = cp.id
    RETURNING * INTO cp;
  ELSE
    v_iw := c.interim_weight_pct;
    v_fw := c.final_weight_pct;
    UPDATE public.cycle_participants
    SET final_score = v_score,
        overall_score = round(cp.interim_score * v_iw / 100.0 + v_score * v_fw / 100.0, 2),
        final_submitted_at = now()
    WHERE id = cp.id
    RETURNING * INTO cp;
  END IF;
  PERFORM set_config('sia.submit_override', 'off', true);

  RETURN cp;
END;
$$;

REVOKE ALL ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) TO authenticated, service_role;
