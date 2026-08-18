-- Restrictive org-unit isolation uses current_user_org_id() only.
-- The previous JWT OR helper union let a mismatched JWT claim and
-- profile org span two tenants on SELECT (and HR writes).
--
-- Missing JWT organization_id is now fine: the helper still allows
-- the caller's own org. Appraisal tables already isolate this way.

DROP POLICY IF EXISTS tenant_isolation_types ON public.org_unit_types;
CREATE POLICY tenant_isolation_types ON public.org_unit_types
  AS RESTRICTIVE
  FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS tenant_isolation_units ON public.org_units;
CREATE POLICY tenant_isolation_units ON public.org_units
  AS RESTRICTIVE
  FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());
