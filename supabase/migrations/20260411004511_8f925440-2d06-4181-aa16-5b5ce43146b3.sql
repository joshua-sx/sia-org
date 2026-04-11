
-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  industry TEXT NOT NULL,
  setup_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hr_admin', 'manager', 'employee')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_profiles_role ON public.profiles(organization_id, role);

-- Enable and force RLS on both tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY org_read ON public.organizations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (id = (SELECT (auth.jwt()->>'organization_id')::uuid));

CREATE POLICY org_update ON public.organizations
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id = (SELECT (auth.jwt()->>'organization_id')::uuid))
  WITH CHECK (id = (SELECT (auth.jwt()->>'organization_id')::uuid));

-- RLS policies for profiles
CREATE POLICY profiles_read ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (organization_id = (SELECT (auth.jwt()->>'organization_id')::uuid));

CREATE POLICY profiles_update ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- JWT custom claims hook function
CREATE OR REPLACE FUNCTION public.custom_jwt_claims(event JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE
  user_profile RECORD;
  claims JSONB;
BEGIN
  SELECT organization_id, role
  INTO user_profile
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_profile IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}',
      to_jsonb(user_profile.organization_id::text));
    claims := jsonb_set(claims, '{user_role}',
      to_jsonb(user_profile.role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
