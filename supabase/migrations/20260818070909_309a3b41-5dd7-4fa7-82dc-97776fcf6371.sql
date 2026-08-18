-- Pin profiles_update so organization_id and role cannot change via RLS
-- even if prevent_profile_privilege_escalation is missing live.
--
-- WITH CHECK cannot see OLD. current_user_org_id() / current_user_role()
-- SELECT the committed profile row (still the old values during this
-- UPDATE), so NEW.organization_id / NEW.role must match the existing
-- profile. Users can still update full_name and email on their own row.
-- The trigger remains as defense in depth.

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND organization_id = public.current_user_org_id()
    AND role = public.current_user_role()
  );