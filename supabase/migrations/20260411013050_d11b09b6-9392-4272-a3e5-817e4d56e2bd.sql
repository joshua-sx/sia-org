
-- Enable ltree extension
CREATE EXTENSION IF NOT EXISTS ltree;

-- org_unit_types table
CREATE TABLE public.org_unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, level),
  UNIQUE(organization_id, name)
);

-- org_units table
CREATE TABLE public.org_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.org_units(id) ON DELETE CASCADE,
  unit_type_id UUID NOT NULL REFERENCES public.org_unit_types(id),
  name TEXT NOT NULL,
  path ltree NOT NULL DEFAULT '',
  depth INTEGER GENERATED ALWAYS AS (nlevel(path) - 1) STORED,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_org_units_org ON public.org_units(organization_id);
CREATE INDEX idx_org_units_parent ON public.org_units(organization_id, parent_id);
CREATE INDEX idx_org_units_path_gist ON public.org_units USING GIST (path);
CREATE INDEX idx_org_units_path_btree ON public.org_units USING BTREE (path);

-- Trigger function to compute path from parent_id chain
CREATE OR REPLACE FUNCTION public.compute_org_unit_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_path ltree;
  new_path ltree;
  label text;
BEGIN
  -- Convert UUID to valid ltree label (replace hyphens with underscores)
  label := replace(NEW.id::text, '-', '_');

  IF NEW.parent_id IS NULL THEN
    new_path := label::ltree;
  ELSE
    SELECT path INTO parent_path FROM public.org_units WHERE id = NEW.parent_id;
    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent unit not found: %', NEW.parent_id;
    END IF;
    new_path := parent_path || label::ltree;
  END IF;

  NEW.path := new_path;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compute_org_unit_path
  BEFORE INSERT OR UPDATE OF parent_id ON public.org_units
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_org_unit_path();

-- Cascade path updates to children when a node's parent changes
CREATE OR REPLACE FUNCTION public.cascade_org_unit_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.path IS DISTINCT FROM NEW.path THEN
    UPDATE public.org_units
    SET parent_id = parent_id  -- triggers recompute via the BEFORE trigger
    WHERE parent_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cascade_org_unit_path
  AFTER UPDATE OF path ON public.org_units
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_org_unit_path();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_org_units_updated_at
  BEFORE UPDATE ON public.org_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: org_unit_types
ALTER TABLE public.org_unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_unit_types FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_types ON public.org_unit_types
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (organization_id = (SELECT ((auth.jwt()->>'organization_id')::uuid)))
  WITH CHECK (organization_id = (SELECT ((auth.jwt()->>'organization_id')::uuid)));

CREATE POLICY hr_admin_full_access_types ON public.org_unit_types
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_admin');

CREATE POLICY read_org_structure_types ON public.org_unit_types
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- RLS: org_units
ALTER TABLE public.org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_units FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_units ON public.org_units
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (organization_id = (SELECT ((auth.jwt()->>'organization_id')::uuid)))
  WITH CHECK (organization_id = (SELECT ((auth.jwt()->>'organization_id')::uuid)));

CREATE POLICY hr_admin_full_access_units ON public.org_units
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_admin');

CREATE POLICY read_org_structure_units ON public.org_units
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
