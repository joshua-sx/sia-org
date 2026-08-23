-- 1. Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.appraisal_cycles(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.cycle_participants(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'nudge',
  task_kind text,
  title text NOT NULL,
  body text,
  link text,
  sender_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name text,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_kind_check CHECK (kind IN ('nudge','system')),
  CONSTRAINT notifications_task_kind_check CHECK (task_kind IS NULL OR task_kind IN ('goals','interim','final','acknowledgement'))
);

CREATE INDEX idx_notifications_recipient ON public.notifications (recipient_profile_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications (recipient_profile_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_cycle ON public.notifications (cycle_id, participant_id, task_kind, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Tenant isolation
CREATE POLICY tenant_isolation_notifications ON public.notifications
AS RESTRICTIVE FOR ALL
USING (organization_id = public.current_user_org_id())
WITH CHECK (organization_id = public.current_user_org_id());

-- Recipients read their own
CREATE POLICY notifications_read_own ON public.notifications
FOR SELECT TO authenticated
USING (recipient_profile_id = auth.uid());

-- HR admins read everything in their org (nudge history / accountability)
CREATE POLICY notifications_read_hr ON public.notifications
FOR SELECT TO authenticated
USING (public.current_user_role() = 'hr_admin' AND organization_id = public.current_user_org_id());

-- Recipients may only flip read_at on their own rows
CREATE POLICY notifications_mark_read ON public.notifications
FOR UPDATE TO authenticated
USING (recipient_profile_id = auth.uid())
WITH CHECK (recipient_profile_id = auth.uid());

-- Guard: the only client-mutable column is read_at; inserts/deletes are RPC/service only
CREATE OR REPLACE FUNCTION public.guard_notification_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'SIA_IMMUTABLE: notifications cannot be deleted';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.recipient_profile_id IS DISTINCT FROM OLD.recipient_profile_id
     OR NEW.cycle_id IS DISTINCT FROM OLD.cycle_id
     OR NEW.participant_id IS DISTINCT FROM OLD.participant_id
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.task_kind IS DISTINCT FROM OLD.task_kind
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.sender_profile_id IS DISTINCT FROM OLD.sender_profile_id
     OR NEW.sender_name IS DISTINCT FROM OLD.sender_name
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'SIA_IMMUTABLE: only read_at can be changed on a notification';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_notification_writes
BEFORE UPDATE OR DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.guard_notification_writes();

-- 2. Send a nudge
CREATE OR REPLACE FUNCTION public.send_cycle_nudge(
  p_participant_id uuid,
  p_task_kind text
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cp public.cycle_participants;
  c  public.appraisal_cycles;
  v_is_hr boolean;
  v_is_manager boolean;
  v_recipient uuid;
  v_employee_name text;
  v_sender_name text;
  v_due date;
  v_outstanding boolean;
  v_last timestamptz;
  v_title text;
  v_body text;
  v_link text;
  v_row public.notifications;
BEGIN
  IF p_task_kind NOT IN ('goals','interim','final','acknowledgement') THEN
    RAISE EXCEPTION 'SIA_INVALID_TASK: unknown task type';
  END IF;

  SELECT * INTO cp FROM public.cycle_participants WHERE id = p_participant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SIA_NOT_FOUND: participant does not exist';
  END IF;

  SELECT * INTO c FROM public.appraisal_cycles WHERE id = cp.cycle_id;
  IF c.organization_id IS DISTINCT FROM public.current_user_org_id() THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: participant is outside your organization';
  END IF;

  v_is_hr := public.current_user_role() = 'hr_admin';
  v_is_manager := public.is_manager_of_participant(cp.id);
  IF NOT (v_is_hr OR v_is_manager) THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: only HR or the assigned manager can send a reminder';
  END IF;

  IF c.status <> 'active' THEN
    RAISE EXCEPTION 'SIA_CYCLE_NOT_ACTIVE: reminders can only be sent while the cycle is running';
  END IF;

  SELECT (e.first_name || ' ' || e.last_name) INTO v_employee_name
  FROM public.employees e WHERE e.id = cp.employee_id;

  -- Who owes the work, and is it still outstanding?
  IF p_task_kind = 'acknowledgement' THEN
    SELECT e.profile_id INTO v_recipient FROM public.employees e WHERE e.id = cp.employee_id;
    v_due := c.acknowledgement_due;
    v_outstanding := cp.acknowledged_at IS NULL AND cp.overall_score IS NOT NULL;
    IF cp.overall_score IS NULL THEN
      RAISE EXCEPTION 'SIA_NOT_SCORED: there is nothing to acknowledge yet';
    END IF;
  ELSE
    SELECT e.profile_id INTO v_recipient FROM public.employees e WHERE e.id = cp.manager_id;
    IF p_task_kind = 'goals' THEN
      v_due := c.goal_window_end;
      SELECT COALESCE(sum(weight), 0) <> 100 INTO v_outstanding
      FROM public.goals WHERE participant_id = cp.id;
    ELSIF p_task_kind = 'interim' THEN
      v_due := c.interim_window_end;
      v_outstanding := cp.interim_submitted_at IS NULL;
    ELSE
      v_due := c.final_window_end;
      v_outstanding := cp.final_submitted_at IS NULL;
    END IF;
  END IF;

  IF v_recipient IS NULL THEN
    RAISE EXCEPTION 'SIA_NO_ACCOUNT: that person has no sign-in account yet, so they cannot be reminded';
  END IF;

  IF NOT v_outstanding THEN
    RAISE EXCEPTION 'SIA_ALREADY_DONE: that task is already complete';
  END IF;

  -- 24h cooldown per participant + task
  SELECT max(created_at) INTO v_last
  FROM public.notifications
  WHERE participant_id = cp.id AND task_kind = p_task_kind AND kind = 'nudge';

  IF v_last IS NOT NULL AND v_last > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'SIA_NUDGE_COOLDOWN: a reminder for this task was already sent in the last 24 hours';
  END IF;

  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = auth.uid();

  v_title := CASE p_task_kind
    WHEN 'goals' THEN format('Set goals for %s', v_employee_name)
    WHEN 'interim' THEN format('Interim assessment due for %s', v_employee_name)
    WHEN 'final' THEN format('Final assessment due for %s', v_employee_name)
    ELSE format('Acknowledge your %s review', c.name)
  END;

  v_body := format('%s sent a reminder. Due %s in the "%s" cycle.',
                   COALESCE(v_sender_name, 'Someone'), to_char(v_due, 'DD Mon YYYY'), c.name);

  v_link := CASE p_task_kind
    WHEN 'goals' THEN '/appraisals/goals'
    WHEN 'acknowledgement' THEN '/appraisals/my-review'
    ELSE '/appraisals/assessments'
  END;

  INSERT INTO public.notifications (
    organization_id, recipient_profile_id, cycle_id, participant_id,
    kind, task_kind, title, body, link, sender_profile_id, sender_name
  ) VALUES (
    c.organization_id, v_recipient, c.id, cp.id,
    'nudge', p_task_kind, v_title, v_body, v_link, auth.uid(), v_sender_name
  )
  RETURNING * INTO v_row;

  PERFORM public.log_audit_event(
    c.organization_id, 'nudge.sent', 'cycle_participant', cp.id, c.id, cp.employee_id,
    format('Reminder sent to %s about %s for %s',
           COALESCE((SELECT full_name FROM public.profiles WHERE id = v_recipient), 'a colleague'),
           p_task_kind, v_employee_name),
    jsonb_build_object('task_kind', p_task_kind, 'recipient_profile_id', v_recipient, 'due_date', v_due)
  );

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.send_cycle_nudge(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_cycle_nudge(uuid, text) TO authenticated, service_role;

-- 3. Recent nudge history for a cycle (drives per-row cooldown state in the UI)
CREATE OR REPLACE FUNCTION public.cycle_nudge_history(p_cycle_id uuid)
RETURNS TABLE (participant_id uuid, task_kind text, last_sent_at timestamptz, times_sent integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT n.participant_id, n.task_kind, max(n.created_at), count(*)::int
  FROM public.notifications n
  JOIN public.appraisal_cycles c ON c.id = n.cycle_id
  WHERE n.cycle_id = p_cycle_id
    AND n.kind = 'nudge'
    AND c.organization_id = public.current_user_org_id()
    AND (public.current_user_role() = 'hr_admin' OR public.is_manager_of_participant(n.participant_id))
  GROUP BY n.participant_id, n.task_kind
$$;

REVOKE ALL ON FUNCTION public.cycle_nudge_history(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cycle_nudge_history(uuid) TO authenticated, service_role;