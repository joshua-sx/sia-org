
-- org_unit_types
DROP POLICY IF EXISTS tenant_isolation_types ON public.org_unit_types;
CREATE POLICY tenant_isolation_types ON public.org_unit_types
  AS RESTRICTIVE
  FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    OR organization_id = NULLIF(auth.jwt() ->> 'organization_id', '')::uuid
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    OR organization_id = NULLIF(auth.jwt() ->> 'organization_id', '')::uuid
  );

-- org_units
DROP POLICY IF EXISTS tenant_isolation_units ON public.org_units;
CREATE POLICY tenant_isolation_units ON public.org_units
  AS RESTRICTIVE
  FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    OR organization_id = NULLIF(auth.jwt() ->> 'organization_id', '')::uuid
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    OR organization_id = NULLIF(auth.jwt() ->> 'organization_id', '')::uuid
  );
