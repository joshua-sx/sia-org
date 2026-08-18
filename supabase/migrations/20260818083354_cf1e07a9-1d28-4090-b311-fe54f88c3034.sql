-- 1. Closure metadata
ALTER TABLE public.appraisal_cycles
  ADD COLUMN closed_at timestamp with time zone,
  ADD COLUMN closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN close_note text;

-- 2. A completed cycle is permanently frozen and cannot be reopened or deleted
CREATE OR REPLACE FUNCTION public.guard_cycle_closure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      RAISE EXCEPTION 'SIA_CYCLE_CLOSED: a completed cycle cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'completed' THEN
    IF current_setting('sia.close_override', true) <> 'on' THEN
      RAISE EXCEPTION 'SIA_CYCLE_CLOSED: this cycle is closed and can no longer be changed';
    END IF;
  END IF;

  IF NEW.status = 'completed' AND OLD.status <> 'completed'
     AND current_setting('sia.close_override', true) <> 'on' THEN
    RAISE EXCEPTION 'SIA_CLOSE_VIA_RPC: use the close cycle action to close a cycle';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_cycle_closure
  BEFORE UPDATE OR DELETE ON public.appraisal_cycles
  FOR EACH ROW EXECUTE FUNCTION public.guard_cycle_closure();

-- 3. Close a cycle
CREATE OR REPLACE FUNCTION public.close_cycle(
  p_cycle_id uuid,
  p_force boolean DEFAULT false,
  p_note text DEFAULT NULL
)
RETURNS appraisal_cycles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c public.appraisal_cycles;
  v_total integer;
  v_unsubmitted integer;
  v_unacknowledged integer;
BEGIN
  SELECT * INTO c FROM public.appraisal_cycles WHERE id = p_cycle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SIA_NOT_FOUND: cycle does not exist';
  END IF;

  IF c.organization_id IS DISTINCT FROM public.current_user_org_id() THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: cycle is outside your organization';
  END IF;

  IF public.current_user_role() <> 'hr_admin' THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: only HR admins can close a cycle';
  END IF;

  IF c.status = 'completed' THEN
    RAISE EXCEPTION 'SIA_CYCLE_CLOSED: this cycle is already closed';
  END IF;

  IF c.status <> 'active' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_ACTIVE: only a running cycle can be closed';
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE final_submitted_at IS NULL),
         count(*) FILTER (WHERE acknowledged_at IS NULL)
    INTO v_total, v_unsubmitted, v_unacknowledged
  FROM public.cycle_participants WHERE cycle_id = c.id;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'SIA_NO_PARTICIPANTS: this cycle has no participants';
  END IF;

  IF v_unsubmitted > 0 AND NOT p_force THEN
    RAISE EXCEPTION 'SIA_FINALS_INCOMPLETE: % of % participant(s) have no final assessment', v_unsubmitted, v_total;
  END IF;

  IF p_force AND (p_note IS NULL OR btrim(p_note) = '') THEN
    RAISE EXCEPTION 'SIA_REASON_REQUIRED: a written reason is required to force-close a cycle';
  END IF;

  PERFORM set_config('sia.close_override', 'on', true);
  UPDATE public.appraisal_cycles
  SET status = 'completed',
      closed_at = now(),
      closed_by = auth.uid(),
      close_note = NULLIF(btrim(COALESCE(p_note, '')), '')
  WHERE id = c.id
  RETURNING * INTO c;
  PERFORM set_config('sia.close_override', 'off', true);

  PERFORM public.log_audit_event(
    c.organization_id, 'cycle.closed', 'appraisal_cycle', c.id, c.id, NULL,
    format('Cycle "%s" closed%s', c.name, CASE WHEN p_force THEN ' (forced)' ELSE '' END),
    jsonb_build_object(
      'forced', p_force,
      'note', c.close_note,
      'participants', v_total,
      'missing_final_assessments', v_unsubmitted,
      'unacknowledged_reviews', v_unacknowledged
    )
  );

  RETURN c;
END;
$$;

REVOKE ALL ON FUNCTION public.close_cycle(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_cycle(uuid, boolean, text) TO authenticated, service_role;

-- 4. Readiness summary so the UI can show what is blocking a close
CREATE OR REPLACE FUNCTION public.cycle_close_readiness(p_cycle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c public.appraisal_cycles;
  v_total integer;
  v_interim integer;
  v_final integer;
  v_ack integer;
BEGIN
  SELECT * INTO c FROM public.appraisal_cycles WHERE id = p_cycle_id;
  IF NOT FOUND OR c.organization_id IS DISTINCT FROM public.current_user_org_id() THEN
    RETURN NULL;
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE interim_submitted_at IS NOT NULL),
         count(*) FILTER (WHERE final_submitted_at IS NOT NULL),
         count(*) FILTER (WHERE acknowledged_at IS NOT NULL)
    INTO v_total, v_interim, v_final, v_ack
  FROM public.cycle_participants WHERE cycle_id = c.id;

  RETURN jsonb_build_object(
    'cycle_id', c.id,
    'status', c.status,
    'participants', v_total,
    'interim_submitted', v_interim,
    'final_submitted', v_final,
    'acknowledged', v_ack,
    'missing_final', v_total - v_final,
    'missing_acknowledgement', v_total - v_ack,
    'can_close', c.status = 'active' AND v_total > 0 AND v_total = v_final,
    'requires_force', c.status = 'active' AND v_total > 0 AND v_total <> v_final
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cycle_close_readiness(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cycle_close_readiness(uuid) TO authenticated, service_role;

-- 5. Tighten access to internal helpers (trigger + claim functions are never called directly)
REVOKE ALL ON FUNCTION public.audit_events_immutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_cycle_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_participant_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_goal_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_rating_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_cycle_closure() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._seed_submit_and_ack(uuid, text, boolean) FROM PUBLIC, anon, authenticated;