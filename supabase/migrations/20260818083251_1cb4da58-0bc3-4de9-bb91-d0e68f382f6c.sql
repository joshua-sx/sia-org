-- 1. Append-only audit log
CREATE TABLE public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  cycle_id uuid REFERENCES public.appraisal_cycles(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_org_created_idx ON public.audit_events (organization_id, created_at DESC);
CREATE INDEX audit_events_cycle_idx ON public.audit_events (cycle_id, created_at DESC);
CREATE INDEX audit_events_employee_idx ON public.audit_events (employee_id, created_at DESC);

-- 2. Grants: read-only for authenticated; writes happen through SECURITY DEFINER triggers
GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

-- 3. RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_audit_events ON public.audit_events
  AS RESTRICTIVE FOR ALL TO public
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY hr_admin_read_audit_events ON public.audit_events
  FOR SELECT TO authenticated
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'hr_admin'
  );

-- 4. Immutability: block UPDATE/DELETE for everyone, including definer code
CREATE OR REPLACE FUNCTION public.audit_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'SIA_AUDIT_IMMUTABLE: audit events cannot be modified or deleted';
END;
$$;

CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.audit_events_immutable();

CREATE TRIGGER audit_events_no_delete
  BEFORE DELETE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.audit_events_immutable();

-- 5. Writer helper (SECURITY DEFINER so it bypasses the read-only grant)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_organization_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_cycle_id uuid DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_email text;
  v_role text;
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email, role INTO v_email, v_role
  FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_events (
    organization_id, actor_profile_id, actor_email, actor_role,
    action, entity_type, entity_id, cycle_id, employee_id, summary, metadata
  ) VALUES (
    p_organization_id, auth.uid(), v_email, v_role,
    p_action, p_entity_type, p_entity_id, p_cycle_id, p_employee_id, p_summary,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(uuid, text, text, uuid, uuid, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, uuid, uuid, uuid, text, jsonb) TO service_role;

-- 6. Cycle lifecycle auditing
CREATE OR REPLACE FUNCTION public.audit_cycle_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.organization_id, 'cycle.created', 'appraisal_cycle', NEW.id, NEW.id, NULL,
      format('Cycle "%s" created', NEW.name),
      jsonb_build_object('status', NEW.status, 'name', NEW.name)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      OLD.organization_id, 'cycle.deleted', 'appraisal_cycle', OLD.id, NULL, NULL,
      format('Cycle "%s" deleted', OLD.name),
      jsonb_build_object('status', OLD.status, 'name', OLD.name)
    );
    RETURN OLD;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_audit_event(
      NEW.organization_id,
      CASE WHEN NEW.status = 'active' THEN 'cycle.launched'
           WHEN NEW.status = 'closed' THEN 'cycle.closed'
           ELSE 'cycle.status_changed' END,
      'appraisal_cycle', NEW.id, NEW.id, NULL,
      format('Cycle "%s" moved from %s to %s', NEW.name, OLD.status, NEW.status),
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;

  IF (NEW.goal_window_start, NEW.goal_window_end, NEW.interim_window_start, NEW.interim_window_end,
      NEW.final_window_start, NEW.final_window_end, NEW.acknowledgement_due)
     IS DISTINCT FROM
     (OLD.goal_window_start, OLD.goal_window_end, OLD.interim_window_start, OLD.interim_window_end,
      OLD.final_window_start, OLD.final_window_end, OLD.acknowledgement_due) THEN
    PERFORM public.log_audit_event(
      NEW.organization_id, 'cycle.dates_changed', 'appraisal_cycle', NEW.id, NEW.id, NULL,
      format('Cycle "%s" dates updated', NEW.name),
      jsonb_build_object(
        'from', jsonb_build_object(
          'goal_window_start', OLD.goal_window_start, 'goal_window_end', OLD.goal_window_end,
          'interim_window_start', OLD.interim_window_start, 'interim_window_end', OLD.interim_window_end,
          'final_window_start', OLD.final_window_start, 'final_window_end', OLD.final_window_end,
          'acknowledgement_due', OLD.acknowledgement_due),
        'to', jsonb_build_object(
          'goal_window_start', NEW.goal_window_start, 'goal_window_end', NEW.goal_window_end,
          'interim_window_start', NEW.interim_window_start, 'interim_window_end', NEW.interim_window_end,
          'final_window_start', NEW.final_window_start, 'final_window_end', NEW.final_window_end,
          'acknowledgement_due', NEW.acknowledgement_due)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_cycle_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.appraisal_cycles
  FOR EACH ROW EXECUTE FUNCTION public.audit_cycle_changes();

-- 7. Participant lifecycle auditing
CREATE OR REPLACE FUNCTION public.audit_participant_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org uuid;
  v_emp text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT organization_id INTO v_org FROM public.appraisal_cycles WHERE id = OLD.cycle_id;
    SELECT first_name || ' ' || last_name INTO v_emp FROM public.employees WHERE id = OLD.employee_id;
    PERFORM public.log_audit_event(
      v_org, 'participant.removed', 'cycle_participant', OLD.id, OLD.cycle_id, OLD.employee_id,
      format('%s removed from the cycle', COALESCE(v_emp, 'Employee')), '{}'::jsonb
    );
    RETURN OLD;
  END IF;

  SELECT organization_id INTO v_org FROM public.appraisal_cycles WHERE id = NEW.cycle_id;
  SELECT first_name || ' ' || last_name INTO v_emp FROM public.employees WHERE id = NEW.employee_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      v_org, 'participant.added', 'cycle_participant', NEW.id, NEW.cycle_id, NEW.employee_id,
      format('%s added to the cycle', COALESCE(v_emp, 'Employee')),
      jsonb_build_object('manager_id', NEW.manager_id, 'extra_reviewer_id', NEW.extra_reviewer_id)
    );
    RETURN NEW;
  END IF;

  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
    PERFORM public.log_audit_event(
      v_org, 'participant.manager_changed', 'cycle_participant', NEW.id, NEW.cycle_id, NEW.employee_id,
      format('Manager reassigned for %s', COALESCE(v_emp, 'Employee')),
      jsonb_build_object('from', OLD.manager_id, 'to', NEW.manager_id)
    );
  END IF;

  IF NEW.extra_reviewer_id IS DISTINCT FROM OLD.extra_reviewer_id THEN
    PERFORM public.log_audit_event(
      v_org, 'participant.reviewer_changed', 'cycle_participant', NEW.id, NEW.cycle_id, NEW.employee_id,
      format('Extra reviewer changed for %s', COALESCE(v_emp, 'Employee')),
      jsonb_build_object('from', OLD.extra_reviewer_id, 'to', NEW.extra_reviewer_id)
    );
  END IF;

  IF NEW.interim_submitted_at IS DISTINCT FROM OLD.interim_submitted_at AND NEW.interim_submitted_at IS NOT NULL THEN
    PERFORM public.log_audit_event(
      v_org, 'assessment.interim_submitted', 'cycle_participant', NEW.id, NEW.cycle_id, NEW.employee_id,
      format('Interim assessment submitted for %s', COALESCE(v_emp, 'Employee')),
      jsonb_build_object('interim_score', NEW.interim_score)
    );
  END IF;

  IF NEW.final_submitted_at IS DISTINCT FROM OLD.final_submitted_at AND NEW.final_submitted_at IS NOT NULL THEN
    PERFORM public.log_audit_event(
      v_org, 'assessment.final_submitted', 'cycle_participant', NEW.id, NEW.cycle_id, NEW.employee_id,
      format('Final assessment submitted for %s', COALESCE(v_emp, 'Employee')),
      jsonb_build_object('final_score', NEW.final_score, 'overall_score', NEW.overall_score)
    );
  END IF;

  IF NEW.acknowledged_at IS DISTINCT FROM OLD.acknowledged_at AND NEW.acknowledged_at IS NOT NULL THEN
    PERFORM public.log_audit_event(
      v_org, 'review.acknowledged', 'cycle_participant', NEW.id, NEW.cycle_id, NEW.employee_id,
      format('%s acknowledged their review', COALESCE(v_emp, 'Employee')),
      jsonb_build_object('overall_score', NEW.overall_score)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_participant_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.cycle_participants
  FOR EACH ROW EXECUTE FUNCTION public.audit_participant_changes();

-- 8. Goal auditing
CREATE OR REPLACE FUNCTION public.audit_goal_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pid uuid;
  v_org uuid;
  v_cycle uuid;
  v_emp uuid;
BEGIN
  v_pid := COALESCE(NEW.participant_id, OLD.participant_id);
  SELECT cp.cycle_id, cp.employee_id, c.organization_id
    INTO v_cycle, v_emp, v_org
  FROM public.cycle_participants cp
  JOIN public.appraisal_cycles c ON c.id = cp.cycle_id
  WHERE cp.id = v_pid;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      v_org, 'goal.created', 'goal', NEW.id, v_cycle, v_emp,
      format('Goal "%s" added (%s%%)', NEW.title, NEW.weight),
      jsonb_build_object('title', NEW.title, 'weight', NEW.weight)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      v_org, 'goal.deleted', 'goal', OLD.id, v_cycle, v_emp,
      format('Goal "%s" removed', OLD.title),
      jsonb_build_object('title', OLD.title, 'weight', OLD.weight)
    );
    RETURN OLD;
  END IF;

  IF (NEW.title, NEW.description, NEW.weight) IS DISTINCT FROM (OLD.title, OLD.description, OLD.weight) THEN
    PERFORM public.log_audit_event(
      v_org, 'goal.updated', 'goal', NEW.id, v_cycle, v_emp,
      format('Goal "%s" updated', NEW.title),
      jsonb_build_object(
        'from', jsonb_build_object('title', OLD.title, 'description', OLD.description, 'weight', OLD.weight),
        'to', jsonb_build_object('title', NEW.title, 'description', NEW.description, 'weight', NEW.weight)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_goal_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.audit_goal_changes();

-- 9. Rating auditing (the most sensitive change of all)
CREATE OR REPLACE FUNCTION public.audit_rating_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_goal_id uuid;
  v_title text;
  v_pid uuid;
  v_org uuid;
  v_cycle uuid;
  v_emp uuid;
  v_stage text;
BEGIN
  v_goal_id := COALESCE(NEW.goal_id, OLD.goal_id);
  v_stage := COALESCE(NEW.stage, OLD.stage);

  SELECT g.title, g.participant_id INTO v_title, v_pid
  FROM public.goals g WHERE g.id = v_goal_id;

  SELECT cp.cycle_id, cp.employee_id, c.organization_id
    INTO v_cycle, v_emp, v_org
  FROM public.cycle_participants cp
  JOIN public.appraisal_cycles c ON c.id = cp.cycle_id
  WHERE cp.id = v_pid;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      v_org, 'rating.deleted', 'goal_rating', OLD.id, v_cycle, v_emp,
      format('%s rating removed for goal "%s"', initcap(v_stage), COALESCE(v_title, '?')),
      jsonb_build_object('stage', v_stage, 'rating', OLD.rating)
    );
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      v_org, 'rating.set', 'goal_rating', NEW.id, v_cycle, v_emp,
      format('%s rating set to %s for goal "%s"', initcap(v_stage), COALESCE(NEW.rating::text, '—'), COALESCE(v_title, '?')),
      jsonb_build_object('stage', v_stage, 'rating', NEW.rating)
    );
    RETURN NEW;
  END IF;

  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    PERFORM public.log_audit_event(
      v_org, 'rating.changed', 'goal_rating', NEW.id, v_cycle, v_emp,
      format('%s rating for goal "%s" changed from %s to %s',
             initcap(v_stage), COALESCE(v_title, '?'),
             COALESCE(OLD.rating::text, '—'), COALESCE(NEW.rating::text, '—')),
      jsonb_build_object('stage', v_stage, 'from', OLD.rating, 'to', NEW.rating)
    );
  END IF;

  IF NEW.manager_comment IS DISTINCT FROM OLD.manager_comment THEN
    PERFORM public.log_audit_event(
      v_org, 'rating.manager_comment_changed', 'goal_rating', NEW.id, v_cycle, v_emp,
      format('Manager comment updated on goal "%s"', COALESCE(v_title, '?')),
      jsonb_build_object('stage', v_stage)
    );
  END IF;

  IF NEW.reviewer_comment IS DISTINCT FROM OLD.reviewer_comment THEN
    PERFORM public.log_audit_event(
      v_org, 'rating.reviewer_comment_changed', 'goal_rating', NEW.id, v_cycle, v_emp,
      format('Reviewer comment updated on goal "%s"', COALESCE(v_title, '?')),
      jsonb_build_object('stage', v_stage)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_rating_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.goal_ratings
  FOR EACH ROW EXECUTE FUNCTION public.audit_rating_changes();