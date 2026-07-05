
-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contractor','intern');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_status AS ENUM ('active','on_leave','terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_code text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  job_title text,
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  employment_status public.employment_status NOT NULL DEFAULT 'active',
  start_date date,
  end_date date,
  location text,
  phone text,
  notes text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_org ON public.employees(organization_id);
CREATE INDEX idx_employees_unit ON public.employees(organization_id, org_unit_id);
CREATE INDEX idx_employees_manager ON public.employees(organization_id, manager_id);
CREATE UNIQUE INDEX uq_employees_email_per_org ON public.employees(organization_id, lower(email));
CREATE UNIQUE INDEX uq_employees_code_per_org ON public.employees(organization_id, employee_code) WHERE employee_code IS NOT NULL;

-- 3. GRANTs (before RLS enable)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

-- 4. RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_employees_in_org ON public.employees
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id());

CREATE POLICY hr_admin_manage_employees ON public.employees
  FOR ALL TO authenticated
  USING (
    organization_id = public.current_user_org_id()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'hr_admin'
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'hr_admin'
  );

CREATE POLICY tenant_isolation_employees ON public.employees
  AS RESTRICTIVE
  FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    OR organization_id = NULLIF(auth.jwt() ->> 'organization_id','')::uuid
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    OR organization_id = NULLIF(auth.jwt() ->> 'organization_id','')::uuid
  );

-- 5. updated_at trigger
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Onboarding progress flags on organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS structure_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS people_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cycle_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS structure_skipped boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS people_skipped boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cycle_skipped boolean NOT NULL DEFAULT false;

-- Backfill: any org that already has org_unit_types counts as structure_complete
UPDATE public.organizations o
SET structure_complete = true
WHERE EXISTS (SELECT 1 FROM public.org_unit_types t WHERE t.organization_id = o.id);
