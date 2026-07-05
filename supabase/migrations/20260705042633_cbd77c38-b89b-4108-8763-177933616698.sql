
-- Helper: get current user's organization from their profile (bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Profiles: allow user to always read their own row
DROP POLICY IF EXISTS profiles_read_self ON public.profiles;
CREATE POLICY profiles_read_self ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Organizations: allow reading via profile-derived org id
DROP POLICY IF EXISTS org_read_via_profile ON public.organizations;
CREATE POLICY org_read_via_profile ON public.organizations
  FOR SELECT
  USING (id = public.current_user_org_id());

DROP POLICY IF EXISTS org_update_via_profile ON public.organizations;
CREATE POLICY org_update_via_profile ON public.organizations
  FOR UPDATE
  USING (id = public.current_user_org_id());

-- Org unit types: tenant isolation via profile-derived org id
DROP POLICY IF EXISTS tenant_isolation_types_via_profile ON public.org_unit_types;
CREATE POLICY tenant_isolation_types_via_profile ON public.org_unit_types
  FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

-- Org units: tenant isolation via profile-derived org id
DROP POLICY IF EXISTS tenant_isolation_units_via_profile ON public.org_units;
CREATE POLICY tenant_isolation_units_via_profile ON public.org_units
  FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());
