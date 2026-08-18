-- Close the org-structure write hole: any org member could INSERT/UPDATE/DELETE
-- org_unit_types and org_units because tenant_isolation_*_via_profile was
-- PERMISSIVE FOR ALL (org match only, no role check).
--
-- After this migration:
--   SELECT  — still open to every org member via read_org_structure_*
--   writes — hr_admin only, and only inside current_user_org_id()
--
-- Also GRANT EXECUTE on the RLS helpers. 20260708072456 revoked PUBLIC/anon
-- without re-granting authenticated; policies in this file call those helpers.

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

DROP POLICY IF EXISTS tenant_isolation_types_via_profile ON public.org_unit_types;
DROP POLICY IF EXISTS tenant_isolation_units_via_profile ON public.org_units;

DROP POLICY IF EXISTS hr_admin_full_access_types ON public.org_unit_types;
CREATE POLICY hr_admin_full_access_types ON public.org_unit_types
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'hr_admin'
    AND organization_id = public.current_user_org_id()
  )
  WITH CHECK (
    public.current_user_role() = 'hr_admin'
    AND organization_id = public.current_user_org_id()
  );

DROP POLICY IF EXISTS hr_admin_full_access_units ON public.org_units;
CREATE POLICY hr_admin_full_access_units ON public.org_units
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'hr_admin'
    AND organization_id = public.current_user_org_id()
  )
  WITH CHECK (
    public.current_user_role() = 'hr_admin'
    AND organization_id = public.current_user_org_id()
  );
