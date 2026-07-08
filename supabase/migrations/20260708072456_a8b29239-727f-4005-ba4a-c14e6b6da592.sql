
-- 1. Prevent users from escalating their own role or moving orgs
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'SIA_FORBIDDEN: users cannot change their own role';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'SIA_FORBIDDEN: users cannot change their own organization';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'SIA_FORBIDDEN: profile id is immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Restrict org updates to hr_admin only
DROP POLICY IF EXISTS org_update ON public.organizations;
DROP POLICY IF EXISTS org_update_via_profile ON public.organizations;

CREATE POLICY org_update ON public.organizations
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    id = current_user_org_id()
    AND current_user_role() = 'hr_admin'
  )
  WITH CHECK (
    id = current_user_org_id()
    AND current_user_role() = 'hr_admin'
  );

-- 3. Lock down SECURITY DEFINER function EXECUTE grants
-- Auth hook: only the auth admin role should invoke it
REVOKE EXECUTE ON FUNCTION public.custom_jwt_claims(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.custom_jwt_claims(jsonb) TO supabase_auth_admin;

-- Trigger functions: never called directly
REVOKE EXECUTE ON FUNCTION public.guard_goal_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_participant_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_rating_writes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_org_unit_path() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cascade_org_unit_path() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

-- Helper functions used inline in RLS: revoke from anon, keep for authenticated
REVOKE EXECUTE ON FUNCTION public.current_user_org_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_employee_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cycle_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.participant_org(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.goal_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager_of_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_employee_of_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_extra_reviewer_of_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.participant_final_submitted(uuid) FROM PUBLIC, anon;

-- RPC: signed-in users only
REVOKE EXECUTE ON FUNCTION public.submit_assessment_stage(uuid, text) FROM PUBLIC, anon;
