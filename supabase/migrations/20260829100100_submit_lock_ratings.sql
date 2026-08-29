-- Lock goal_ratings rows for the stage before the completeness check and score
-- read so concurrent rating edits cannot race submit_assessment_stage.

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
    SELECT interim_weight_pct, final_weight_pct INTO v_iw, v_fw
    FROM public.organizations WHERE id = c.organization_id;
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
