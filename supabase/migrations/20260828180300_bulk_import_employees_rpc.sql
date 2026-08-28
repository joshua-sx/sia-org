-- Import employees and resolve reporting lines atomically. The caller supplies
-- employee data only; tenant ownership always comes from the authenticated
-- user's profile.

CREATE OR REPLACE FUNCTION public.bulk_import_employees(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_duplicate_emails text;
  v_inserted jsonb;
  v_manager_email text;
  v_org uuid;
  v_org_unit_id uuid;
  v_org_unit_org uuid;
  v_ordinal bigint;
  v_row jsonb;
  v_unresolved_managers text[];
BEGIN
  SELECT p.organization_id
  INTO v_org
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND p.role = 'hr_admin';

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: only an HR admin can import employees';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'SIA_INVALID_IMPORT: rows must be a JSON array';
  END IF;

  FOR v_row, v_ordinal IN
    SELECT value, ordinality
    FROM jsonb_array_elements(p_rows) WITH ORDINALITY
  LOOP
    IF jsonb_typeof(v_row) <> 'object' THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % must be an object', v_ordinal;
    END IF;

    IF jsonb_typeof(v_row -> 'first_name') IS DISTINCT FROM 'string'
       OR btrim(v_row ->> 'first_name') = '' THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid first_name', v_ordinal;
    END IF;
    IF jsonb_typeof(v_row -> 'last_name') IS DISTINCT FROM 'string'
       OR btrim(v_row ->> 'last_name') = '' THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid last_name', v_ordinal;
    END IF;
    IF jsonb_typeof(v_row -> 'email') IS DISTINCT FROM 'string'
       OR btrim(v_row ->> 'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid email', v_ordinal;
    END IF;

    IF (v_row ? 'employee_code' AND jsonb_typeof(v_row -> 'employee_code') NOT IN ('string', 'null'))
       OR (v_row ? 'job_title' AND jsonb_typeof(v_row -> 'job_title') NOT IN ('string', 'null'))
       OR (v_row ? 'location' AND jsonb_typeof(v_row -> 'location') NOT IN ('string', 'null'))
       OR (v_row ? 'phone' AND jsonb_typeof(v_row -> 'phone') NOT IN ('string', 'null'))
       OR (v_row ? 'manager_email' AND jsonb_typeof(v_row -> 'manager_email') NOT IN ('string', 'null')) THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid text field', v_ordinal;
    END IF;

    IF v_row ? 'org_unit_id' AND jsonb_typeof(v_row -> 'org_unit_id') NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid org_unit_id', v_ordinal;
    END IF;
    IF NULLIF(btrim(v_row ->> 'org_unit_id'), '') IS NOT NULL THEN
      BEGIN
        v_org_unit_id := (btrim(v_row ->> 'org_unit_id'))::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid org_unit_id', v_ordinal;
      END;

      SELECT ou.organization_id
      INTO v_org_unit_org
      FROM public.org_units AS ou
      WHERE ou.id = v_org_unit_id;

      IF v_org_unit_org IS NULL THEN
        RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % references an unknown org unit', v_ordinal;
      END IF;
      IF v_org_unit_org IS DISTINCT FROM v_org THEN
        RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: row % references an org unit outside your organization', v_ordinal;
      END IF;
    END IF;

    IF v_row ? 'start_date' AND jsonb_typeof(v_row -> 'start_date') NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid start_date', v_ordinal;
    END IF;
    IF NULLIF(btrim(v_row ->> 'start_date'), '') IS NOT NULL THEN
      BEGIN
        PERFORM (btrim(v_row ->> 'start_date'))::date;
      EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN
        RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid start_date', v_ordinal;
      END;
    END IF;

    IF COALESCE(v_row ->> 'employment_type', 'full_time')
       NOT IN ('full_time', 'part_time', 'contractor', 'intern') THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid employment_type', v_ordinal;
    END IF;
    IF COALESCE(v_row ->> 'employment_status', 'active')
       NOT IN ('active', 'on_leave', 'terminated') THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid employment_status', v_ordinal;
    END IF;

    v_manager_email := NULLIF(lower(btrim(v_row ->> 'manager_email')), '');
    IF v_manager_email IS NOT NULL
       AND v_manager_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % has an invalid manager_email', v_ordinal;
    END IF;
    IF v_manager_email IS NOT NULL
       AND v_manager_email = lower(btrim(v_row ->> 'email')) THEN
      RAISE EXCEPTION 'SIA_INVALID_IMPORT: row % cannot assign the employee as their own manager', v_ordinal;
    END IF;
  END LOOP;

  SELECT string_agg(email_normalized, ', ' ORDER BY email_normalized)
  INTO v_duplicate_emails
  FROM (
    SELECT lower(btrim(value ->> 'email')) AS email_normalized
    FROM jsonb_array_elements(p_rows)
    GROUP BY lower(btrim(value ->> 'email'))
    HAVING count(*) > 1
  ) AS duplicates;

  IF v_duplicate_emails IS NOT NULL THEN
    RAISE EXCEPTION 'SIA_DUPLICATE_IMPORT_EMAIL: duplicate employee email(s): %', v_duplicate_emails;
  END IF;

  WITH input AS (
    SELECT
      ordinality,
      btrim(value ->> 'first_name') AS first_name,
      btrim(value ->> 'last_name') AS last_name,
      lower(btrim(value ->> 'email')) AS email,
      NULLIF(btrim(value ->> 'employee_code'), '') AS employee_code,
      NULLIF(btrim(value ->> 'job_title'), '') AS job_title,
      NULLIF(btrim(value ->> 'org_unit_id'), '')::uuid AS org_unit_id,
      COALESCE(value ->> 'employment_type', 'full_time')::public.employment_type AS employment_type,
      COALESCE(value ->> 'employment_status', 'active')::public.employment_status AS employment_status,
      NULLIF(btrim(value ->> 'start_date'), '')::date AS start_date,
      NULLIF(btrim(value ->> 'location'), '') AS location,
      NULLIF(btrim(value ->> 'phone'), '') AS phone
    FROM jsonb_array_elements(p_rows) WITH ORDINALITY
  ),
  prepared AS MATERIALIZED (
    SELECT gen_random_uuid() AS id, input.*
    FROM input
  ),
  inserted AS (
    INSERT INTO public.employees (
      id,
      organization_id,
      first_name,
      last_name,
      email,
      employee_code,
      job_title,
      org_unit_id,
      employment_type,
      employment_status,
      start_date,
      location,
      phone
    )
    SELECT
      p.id,
      v_org,
      p.first_name,
      p.last_name,
      p.email,
      p.employee_code,
      p.job_title,
      p.org_unit_id,
      p.employment_type,
      p.employment_status,
      p.start_date,
      p.location,
      p.phone
    FROM prepared AS p
    ORDER BY p.ordinality
    RETURNING *
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY p.ordinality), '[]'::jsonb)
  INTO v_inserted
  FROM inserted AS e
  JOIN prepared AS p ON p.id = e.id;

  WITH input AS (
    SELECT
      lower(btrim(value ->> 'email')) AS email_normalized,
      NULLIF(lower(btrim(value ->> 'manager_email')), '') AS manager_email_normalized
    FROM jsonb_array_elements(p_rows)
  )
  UPDATE public.employees AS employee
  SET manager_id = manager.id
  FROM input
  JOIN public.employees AS manager
    ON manager.organization_id = v_org
   AND lower(btrim(manager.email)) = input.manager_email_normalized
  WHERE employee.organization_id = v_org
    AND lower(btrim(employee.email)) = input.email_normalized
    AND input.manager_email_normalized IS NOT NULL
    AND employee.id <> manager.id;

  WITH requested_managers AS (
    SELECT
      NULLIF(lower(btrim(value ->> 'manager_email')), '') AS email_normalized,
      min(ordinality) AS first_ordinal
    FROM jsonb_array_elements(p_rows) WITH ORDINALITY
    GROUP BY NULLIF(lower(btrim(value ->> 'manager_email')), '')
  )
  SELECT COALESCE(array_agg(rm.email_normalized ORDER BY rm.first_ordinal), ARRAY[]::text[])
  INTO v_unresolved_managers
  FROM requested_managers AS rm
  WHERE rm.email_normalized IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.employees AS manager
      WHERE manager.organization_id = v_org
        AND lower(btrim(manager.email)) = rm.email_normalized
    );

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'unresolved_managers', to_jsonb(v_unresolved_managers)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_import_employees(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_import_employees(jsonb) TO authenticated;
