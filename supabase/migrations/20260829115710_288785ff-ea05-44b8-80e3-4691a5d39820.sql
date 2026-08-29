DROP POLICY IF EXISTS read_employees_in_org ON public.employees;

CREATE POLICY read_employees_in_org ON public.employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.current_user_org_id()
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('hr_admin', 'manager')
      OR profile_id = auth.uid()
    )
  );

CREATE OR REPLACE VIEW public.employee_directory AS
  SELECT
    e.id,
    e.organization_id,
    e.first_name,
    e.last_name,
    e.email,
    e.job_title,
    e.org_unit_id,
    e.manager_id,
    e.employment_type,
    e.employment_status,
    e.profile_id,
    e.created_at,
    e.updated_at
  FROM public.employees e
  WHERE e.organization_id = public.current_user_org_id();

REVOKE ALL ON public.employee_directory FROM PUBLIC;
REVOKE ALL ON public.employee_directory FROM anon;
GRANT SELECT ON public.employee_directory TO authenticated;
GRANT SELECT ON public.employee_directory TO service_role;