CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.current_user_employee_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.employees WHERE profile_id = auth.uid() AND organization_id = public.current_user_org_id() LIMIT 1 $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS interim_weight_pct integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS final_weight_pct integer NOT NULL DEFAULT 70;

DO $$ BEGIN
  ALTER TABLE public.organizations ADD CONSTRAINT chk_org_stage_weights CHECK (interim_weight_pct + final_weight_pct = 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.appraisal_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed')),
  goal_window_start date NOT NULL,
  goal_window_end date NOT NULL,
  interim_window_start date NOT NULL,
  interim_window_end date NOT NULL,
  final_window_start date NOT NULL,
  final_window_end date NOT NULL,
  acknowledgement_due date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_cycle_windows_ordered CHECK (
    goal_window_start <= goal_window_end
    AND goal_window_end <= interim_window_start
    AND interim_window_start <= interim_window_end
    AND interim_window_end <= final_window_start
    AND final_window_start <= final_window_end
    AND final_window_end <= acknowledgement_due
  )
);

CREATE TABLE public.cycle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.appraisal_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.employees(id),
  extra_reviewer_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  interim_submitted_at timestamptz,
  final_submitted_at timestamptz,
  interim_score numeric(4,2),
  final_score numeric(4,2),
  overall_score numeric(4,2),
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, employee_id)
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.cycle_participants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  weight integer NOT NULL CHECK (weight BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goal_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('interim','final')),
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  manager_comment text,
  reviewer_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, stage)
);

CREATE INDEX idx_cycles_org ON public.appraisal_cycles(organization_id);
CREATE INDEX idx_participants_cycle ON public.cycle_participants(cycle_id);
CREATE INDEX idx_participants_employee ON public.cycle_participants(employee_id);
CREATE INDEX idx_participants_manager ON public.cycle_participants(manager_id);
CREATE INDEX idx_goals_participant ON public.goals(participant_id);
CREATE INDEX idx_ratings_goal ON public.goal_ratings(goal_id);

CREATE OR REPLACE FUNCTION public.cycle_org(p_cycle_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT organization_id FROM public.appraisal_cycles WHERE id = p_cycle_id $$;

CREATE OR REPLACE FUNCTION public.participant_org(p_participant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT c.organization_id FROM public.cycle_participants cp JOIN public.appraisal_cycles c ON c.id = cp.cycle_id WHERE cp.id = p_participant_id $$;

CREATE OR REPLACE FUNCTION public.goal_participant(p_goal_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT participant_id FROM public.goals WHERE id = p_goal_id $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appraisal_cycles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_ratings TO authenticated;
GRANT ALL ON public.appraisal_cycles, public.cycle_participants, public.goals, public.goal_ratings TO service_role;

ALTER TABLE public.appraisal_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_cycles_in_org ON public.appraisal_cycles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id());

CREATE POLICY hr_admin_manage_cycles ON public.appraisal_cycles
  FOR ALL TO authenticated
  USING (organization_id = public.current_user_org_id() AND public.current_user_role() = 'hr_admin')
  WITH CHECK (organization_id = public.current_user_org_id() AND public.current_user_role() = 'hr_admin');

CREATE POLICY hr_admin_manage_participants ON public.cycle_participants
  FOR ALL TO authenticated
  USING (public.cycle_org(cycle_id) = public.current_user_org_id() AND public.current_user_role() = 'hr_admin')
  WITH CHECK (public.cycle_org(cycle_id) = public.current_user_org_id() AND public.current_user_role() = 'hr_admin');

CREATE POLICY hr_admin_manage_goals ON public.goals
  FOR ALL TO authenticated
  USING (public.participant_org(participant_id) = public.current_user_org_id() AND public.current_user_role() = 'hr_admin')
  WITH CHECK (public.participant_org(participant_id) = public.current_user_org_id() AND public.current_user_role() = 'hr_admin');

CREATE POLICY hr_admin_manage_ratings ON public.goal_ratings
  FOR ALL TO authenticated
  USING (public.participant_org(public.goal_participant(goal_id)) = public.current_user_org_id() AND public.current_user_role() = 'hr_admin')
  WITH CHECK (public.participant_org(public.goal_participant(goal_id)) = public.current_user_org_id() AND public.current_user_role() = 'hr_admin');

CREATE POLICY tenant_isolation_cycles ON public.appraisal_cycles
  AS RESTRICTIVE FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY tenant_isolation_participants ON public.cycle_participants
  AS RESTRICTIVE FOR ALL
  USING (public.cycle_org(cycle_id) = public.current_user_org_id())
  WITH CHECK (public.cycle_org(cycle_id) = public.current_user_org_id());

CREATE POLICY tenant_isolation_goals ON public.goals
  AS RESTRICTIVE FOR ALL
  USING (public.participant_org(participant_id) = public.current_user_org_id())
  WITH CHECK (public.participant_org(participant_id) = public.current_user_org_id());

CREATE POLICY tenant_isolation_ratings ON public.goal_ratings
  AS RESTRICTIVE FOR ALL
  USING (public.participant_org(public.goal_participant(goal_id)) = public.current_user_org_id())
  WITH CHECK (public.participant_org(public.goal_participant(goal_id)) = public.current_user_org_id());

CREATE TRIGGER update_appraisal_cycles_updated_at
  BEFORE UPDATE ON public.appraisal_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cycle_participants_updated_at
  BEFORE UPDATE ON public.cycle_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_ratings_updated_at
  BEFORE UPDATE ON public.goal_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();