
-- Appraisal cycles: role policies, write-guard triggers, submit RPC.
-- Depends on 20260705120000_appraisal_cycles_schema.sql.
--
-- Enforcement summary ("never do" list):
--   1. Scores and submit timestamps are only written by submit_assessment_stage
--      (guard trigger rejects direct writes; the RPC sets a transaction-local
--      override flag).
--   2. Goal/rating writes are rejected outside the stage window, when the
--      cycle is not active, or after the stage is submitted.
--   3. Only the participant's manager (or hr_admin) writes goals and ratings.
--   4. The extra reviewer can only change reviewer_comment.
--   5. Employees can read ratings/comments only after final submission.
--   6. Acknowledge requires overall_score to be present.

-- 1. Relationship helpers (SECURITY DEFINER: bypass RLS, no recursion)

CREATE OR REPLACE FUNCTION public.is_manager_of_participant(p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cycle_participants cp
    JOIN public.employees e ON e.id = cp.manager_id
    WHERE cp.id = p_participant_id AND e.profile_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_employee_of_participant(p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cycle_participants cp
    JOIN public.employees e ON e.id = cp.employee_id
    WHERE cp.id = p_participant_id AND e.profile_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_extra_reviewer_of_participant(p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cycle_participants cp
    JOIN public.employees e ON e.id = cp.extra_reviewer_id
    WHERE cp.id = p_participant_id AND e.profile_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.participant_final_submitted(p_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT final_submitted_at IS NOT NULL
  FROM public.cycle_participants
  WHERE id = p_participant_id
$$;

-- 2. Role policies

-- cycle_participants
CREATE POLICY manager_read_participants ON public.cycle_participants
  FOR SELECT TO authenticated
  USING (public.is_manager_of_participant(id));

CREATE POLICY employee_read_own_participant ON public.cycle_participants
  FOR SELECT TO authenticated
  USING (public.is_employee_of_participant(id));

CREATE POLICY reviewer_read_participants ON public.cycle_participants
  FOR SELECT TO authenticated
  USING (public.is_extra_reviewer_of_participant(id));

-- Column discipline for these UPDATE grants lives in guard_participant_writes:
-- managers may only change extra_reviewer_id, employees only acknowledged_at.
CREATE POLICY manager_update_participants ON public.cycle_participants
  FOR UPDATE TO authenticated
  USING (public.is_manager_of_participant(id))
  WITH CHECK (public.is_manager_of_participant(id));

CREATE POLICY employee_update_own_participant ON public.cycle_participants
  FOR UPDATE TO authenticated
  USING (public.is_employee_of_participant(id))
  WITH CHECK (public.is_employee_of_participant(id));

-- goals (employee + reviewer read throughout; manager manages)
CREATE POLICY manager_manage_goals ON public.goals
  FOR ALL TO authenticated
  USING (public.is_manager_of_participant(participant_id))
  WITH CHECK (public.is_manager_of_participant(participant_id));

CREATE POLICY employee_read_own_goals ON public.goals
  FOR SELECT TO authenticated
  USING (public.is_employee_of_participant(participant_id));

CREATE POLICY reviewer_read_goals ON public.goals
  FOR SELECT TO authenticated
  USING (public.is_extra_reviewer_of_participant(participant_id));

-- goal_ratings
CREATE POLICY manager_manage_ratings ON public.goal_ratings
  FOR ALL TO authenticated
  USING (public.is_manager_of_participant(public.goal_participant(goal_id)))
  WITH CHECK (public.is_manager_of_participant(public.goal_participant(goal_id)));

CREATE POLICY reviewer_read_ratings ON public.goal_ratings
  FOR SELECT TO authenticated
  USING (public.is_extra_reviewer_of_participant(public.goal_participant(goal_id)));

CREATE POLICY reviewer_update_ratings ON public.goal_ratings
  FOR UPDATE TO authenticated
  USING (public.is_extra_reviewer_of_participant(public.goal_participant(goal_id)))
  WITH CHECK (public.is_extra_reviewer_of_participant(public.goal_participant(goal_id)));

CREATE POLICY employee_read_own_ratings_after_final ON public.goal_ratings
  FOR SELECT TO authenticated
  USING (
    public.is_employee_of_participant(public.goal_participant(goal_id))
    AND public.participant_final_submitted(public.goal_participant(goal_id))
  );

-- 3. Write-guard triggers

-- Goals: only while the cycle is active, inside the goal window, and before
-- any assessment stage has been submitted.
CREATE OR REPLACE FUNCTION public.guard_goal_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_id uuid;
  cp public.cycle_participants;
  c public.appraisal_cycles;
BEGIN
  v_participant_id := COALESCE(NEW.participant_id, OLD.participant_id);
  IF TG_OP = 'UPDATE' AND NEW.participant_id IS DISTINCT FROM OLD.participant_id THEN
    RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: goals cannot be moved between participants';
  END IF;

  SELECT * INTO cp FROM public.cycle_participants WHERE id = v_participant_id;
  SELECT * INTO c FROM public.appraisal_cycles WHERE id = cp.cycle_id;

  IF c.status <> 'active' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_ACTIVE: goals can only change while the cycle is active';
  END IF;
  IF cp.interim_submitted_at IS NOT NULL OR cp.final_submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'SIA_STAGE_LOCKED: goals are locked once an assessment is submitted';
  END IF;
  IF now()::date < c.goal_window_start OR now()::date > c.goal_window_end THEN
    RAISE EXCEPTION 'SIA_WINDOW_CLOSED: outside the goal-setting window';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER guard_goal_writes
  BEFORE INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.guard_goal_writes();

-- Ratings: manager-lane changes (rating/manager_comment, insert, delete)
-- require the participant's manager or hr_admin, an unsubmitted stage, and
-- the stage window. Reviewer-lane changes (reviewer_comment) require the
-- extra reviewer or hr_admin, and are open while the cycle is active until
-- the employee acknowledges.
CREATE OR REPLACE FUNCTION public.guard_rating_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_id uuid;
  v_stage text;
  cp public.cycle_participants;
  c public.appraisal_cycles;
  v_mgr_change boolean;
  v_rev_change boolean;
  v_is_manager boolean;
  v_is_hr boolean;
BEGIN
  v_goal_id := COALESCE(NEW.goal_id, OLD.goal_id);
  v_stage := COALESCE(NEW.stage, OLD.stage);
  IF TG_OP = 'UPDATE' AND (NEW.goal_id IS DISTINCT FROM OLD.goal_id OR NEW.stage IS DISTINCT FROM OLD.stage) THEN
    RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: goal_id and stage are immutable';
  END IF;

  SELECT * INTO cp FROM public.cycle_participants WHERE id = public.goal_participant(v_goal_id);
  SELECT * INTO c FROM public.appraisal_cycles WHERE id = cp.cycle_id;

  IF c.status <> 'active' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_ACTIVE: assessments can only change while the cycle is active';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_mgr_change := NEW.rating IS DISTINCT FROM OLD.rating
      OR NEW.manager_comment IS DISTINCT FROM OLD.manager_comment;
    v_rev_change := NEW.reviewer_comment IS DISTINCT FROM OLD.reviewer_comment;
  ELSIF TG_OP = 'INSERT' THEN
    v_mgr_change := true;
    v_rev_change := NEW.reviewer_comment IS NOT NULL;
  ELSE
    v_mgr_change := true;
    v_rev_change := false;
  END IF;

  v_is_manager := public.is_manager_of_participant(cp.id);
  v_is_hr := public.current_user_role() = 'hr_admin';

  IF v_mgr_change THEN
    IF NOT (v_is_manager OR v_is_hr) THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: only the manager can change ratings and manager comments';
    END IF;
    IF (v_stage = 'interim' AND cp.interim_submitted_at IS NOT NULL)
       OR (v_stage = 'final' AND cp.final_submitted_at IS NOT NULL) THEN
      RAISE EXCEPTION 'SIA_STAGE_LOCKED: this assessment stage has been submitted';
    END IF;
    IF (v_stage = 'interim' AND (now()::date < c.interim_window_start OR now()::date > c.interim_window_end))
       OR (v_stage = 'final' AND (now()::date < c.final_window_start OR now()::date > c.final_window_end)) THEN
      RAISE EXCEPTION 'SIA_WINDOW_CLOSED: outside this stage''s assessment window';
    END IF;
  END IF;

  IF v_rev_change THEN
    IF NOT (public.is_extra_reviewer_of_participant(cp.id) OR v_is_hr) THEN
      RAISE EXCEPTION 'SIA_COLUMN_FORBIDDEN: only the extra reviewer can change reviewer comments';
    END IF;
    IF cp.acknowledged_at IS NOT NULL THEN
      RAISE EXCEPTION 'SIA_STAGE_LOCKED: the review has been acknowledged';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER guard_rating_writes
  BEFORE INSERT OR UPDATE OR DELETE ON public.goal_ratings
  FOR EACH ROW EXECUTE FUNCTION public.guard_rating_writes();

-- Participants: clients may never touch scores or submit timestamps
-- (only the RPC can, via the transaction-local override). Managers may set
-- extra_reviewer_id pre-final; hr_admin may reassign manager_id pre-final;
-- the employee may set acknowledged_at once the overall score exists.
CREATE OR REPLACE FUNCTION public.guard_participant_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_participant_writes
  BEFORE INSERT OR UPDATE ON public.cycle_participants
  FOR EACH ROW EXECUTE FUNCTION public.guard_participant_writes();

-- 4. Submit RPC — the only path that computes/stores scores and stamps
-- submission timestamps.
--
-- Scoring (mirrored by src/lib/scoring.ts — keep the test vectors in
-- src/test/scoring.test.ts in sync with this math):
--   stage_score   = round(sum(rating * weight) / 100, 2)
--   overall_score = round(interim_score * iw/100 + final_score * fw/100, 2)
-- Shared vectors:
--   weights 50/30/20, ratings 4,3,2            -> 3.30
--   weights 60/40,   ratings 5,4               -> 4.60
--   weights 33/33/34, ratings 3,4,5            -> 4.01
--   overall(3.30, 4.10, 30, 70)                -> 3.86
--   overall(4.01, 3.33, 30, 70)  (3.534)       -> 3.53
--   overall(4.05, 3.20, 30, 70)  (3.455, half) -> 3.46  (round half up)
CREATE OR REPLACE FUNCTION public.submit_assessment_stage(p_participant_id uuid, p_stage text)
RETURNS public.cycle_participants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.submit_assessment_stage(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_assessment_stage(uuid, text) TO authenticated;
