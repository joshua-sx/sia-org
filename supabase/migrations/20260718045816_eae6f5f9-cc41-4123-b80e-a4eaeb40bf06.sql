CREATE OR REPLACE FUNCTION public._seed_submit_and_ack(
  p_participant_id uuid,
  p_stage text,
  p_ack boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cp public.cycle_participants;
  c  public.appraisal_cycles;
  v_score numeric(4,2);
  v_iw int;
  v_fw int;
BEGIN
  SELECT * INTO cp FROM public.cycle_participants WHERE id = p_participant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'seed: participant not found'; END IF;
  SELECT * INTO c FROM public.appraisal_cycles WHERE id = cp.cycle_id;

  SELECT round(sum(r.rating * g.weight)::numeric / 100, 2) INTO v_score
  FROM public.goals g
  JOIN public.goal_ratings r ON r.goal_id = g.id AND r.stage = p_stage
  WHERE g.participant_id = cp.id;

  PERFORM set_config('sia.submit_override', 'on', true);
  IF p_stage = 'interim' THEN
    UPDATE public.cycle_participants
    SET interim_score = v_score, interim_submitted_at = now()
    WHERE id = cp.id;
  ELSIF p_stage = 'final' THEN
    SELECT interim_weight_pct, final_weight_pct INTO v_iw, v_fw
    FROM public.organizations WHERE id = c.organization_id;
    UPDATE public.cycle_participants
    SET final_score = v_score,
        overall_score = round(cp.interim_score * v_iw / 100.0 + v_score * v_fw / 100.0, 2),
        final_submitted_at = now()
    WHERE id = cp.id;
  END IF;
  IF p_ack THEN
    UPDATE public.cycle_participants SET acknowledged_at = now() WHERE id = cp.id;
  END IF;
  PERFORM set_config('sia.submit_override', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public._seed_submit_and_ack(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._seed_submit_and_ack(uuid, text, boolean) TO service_role;