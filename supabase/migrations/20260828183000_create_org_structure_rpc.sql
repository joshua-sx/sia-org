-- Create hierarchy levels and an optional nested unit tree as one
-- tenant-authorized transaction.

CREATE OR REPLACE FUNCTION public.create_org_structure(
  p_levels jsonb,
  p_units jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_bad_path text;
  v_duplicate_name text;
  v_flat_units jsonb;
  v_level_count integer;
  v_level_index integer;
  v_level_name text;
  v_level_names text[];
  v_org uuid;
  v_type_id uuid;
  v_type_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  SELECT p.organization_id
  INTO v_org
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND p.role = 'hr_admin';

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'SIA_NOT_AUTHORIZED: only an HR admin can create an organization structure';
  END IF;

  IF p_levels IS NULL
     OR jsonb_typeof(p_levels) <> 'array'
     OR jsonb_array_length(p_levels) = 0 THEN
    RAISE EXCEPTION 'SIA_INVALID_ORG_STRUCTURE: levels must be a nonempty JSON array';
  END IF;

  v_level_count := jsonb_array_length(p_levels);
  IF v_level_count > 5 THEN
    RAISE EXCEPTION 'SIA_INVALID_ORG_STRUCTURE: levels cannot contain more than 5 entries';
  END IF;

  FOR v_level_name, v_level_index IN
    SELECT value ->> 'name', ordinality::integer
    FROM jsonb_array_elements(p_levels) WITH ORDINALITY
  LOOP
    IF jsonb_typeof(p_levels -> (v_level_index - 1)) <> 'object'
       OR jsonb_typeof((p_levels -> (v_level_index - 1)) -> 'name') IS DISTINCT FROM 'string'
       OR jsonb_typeof((p_levels -> (v_level_index - 1)) -> 'level') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION
        'SIA_INVALID_ORG_STRUCTURE: level % must be an object with sequential level % and a name',
        v_level_index,
        v_level_index;
    END IF;

    IF ((p_levels -> (v_level_index - 1)) ->> 'level') !~ '^[1-5]$' THEN
      RAISE EXCEPTION
        'SIA_INVALID_ORG_STRUCTURE: level % must use sequential level %',
        v_level_index,
        v_level_index;
    END IF;

    IF (((p_levels -> (v_level_index - 1)) ->> 'level')::integer) <> v_level_index THEN
      RAISE EXCEPTION
        'SIA_INVALID_ORG_STRUCTURE: level % must use sequential level %',
        v_level_index,
        v_level_index;
    END IF;

    v_level_name := btrim(v_level_name);
    IF v_level_name = ''
       OR char_length(v_level_name) > 100
       OR v_level_name ~ '[[:cntrl:]]' THEN
      RAISE EXCEPTION
        'SIA_INVALID_ORG_STRUCTURE: level % name must contain 1 to 100 printable characters',
        v_level_index;
    END IF;

    v_level_names := array_append(v_level_names, lower(v_level_name));
  END LOOP;

  SELECT duplicate_name
  INTO v_duplicate_name
  FROM (
    SELECT name AS duplicate_name
    FROM unnest(v_level_names) AS names(name)
    GROUP BY name
    HAVING count(*) > 1
    ORDER BY name
    LIMIT 1
  ) AS duplicate_levels;

  IF v_duplicate_name IS NOT NULL THEN
    RAISE EXCEPTION
      'SIA_INVALID_ORG_STRUCTURE: duplicate level name "%"',
      v_duplicate_name;
  END IF;

  IF p_units IS NULL OR jsonb_typeof(p_units) <> 'array' THEN
    RAISE EXCEPTION 'SIA_INVALID_ORG_STRUCTURE: units must be a JSON array';
  END IF;

  WITH RECURSIVE unit_tree AS (
    SELECT
      root.value AS node,
      1 AS depth,
      ''::text AS parent_key,
      lpad(root.ordinality::text, 10, '0') AS ordinal_key,
      jsonb_build_array(lower(btrim(root.value ->> 'name'))) AS name_path
    FROM jsonb_array_elements(p_units) WITH ORDINALITY AS root(value, ordinality)

    UNION ALL

    SELECT
      child.value,
      parent.depth + 1,
      parent.ordinal_key,
      parent.ordinal_key || '.' || lpad(child.ordinality::text, 10, '0'),
      parent.name_path || jsonb_build_array(lower(btrim(child.value ->> 'name')))
    FROM unit_tree AS parent
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(parent.node -> 'children') = 'array'
          THEN parent.node -> 'children'
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS child(value, ordinality)
  )
  SELECT ordinal_key
  INTO v_bad_path
  FROM unit_tree
  WHERE jsonb_typeof(node) <> 'object'
     OR jsonb_typeof(node -> 'name') IS DISTINCT FROM 'string'
     OR btrim(node ->> 'name') = ''
     OR char_length(btrim(node ->> 'name')) > 100
     OR btrim(node ->> 'name') ~ '[[:cntrl:]]'
     OR jsonb_typeof(node -> 'children') IS DISTINCT FROM 'array'
     OR depth > v_level_count
  ORDER BY ordinal_key
  LIMIT 1;

  IF v_bad_path IS NOT NULL THEN
    RAISE EXCEPTION
      'SIA_INVALID_ORG_STRUCTURE: unit at position % must have a 1 to 100 character printable name and a children array within the configured levels',
      v_bad_path;
  END IF;

  WITH RECURSIVE unit_tree AS (
    SELECT
      root.value AS node,
      ''::text AS parent_key,
      lpad(root.ordinality::text, 10, '0') AS ordinal_key,
      jsonb_build_array(lower(btrim(root.value ->> 'name'))) AS name_path
    FROM jsonb_array_elements(p_units) WITH ORDINALITY AS root(value, ordinality)

    UNION ALL

    SELECT
      child.value,
      parent.ordinal_key,
      parent.ordinal_key || '.' || lpad(child.ordinality::text, 10, '0'),
      parent.name_path || jsonb_build_array(lower(btrim(child.value ->> 'name')))
    FROM unit_tree AS parent
    CROSS JOIN LATERAL jsonb_array_elements(parent.node -> 'children')
      WITH ORDINALITY AS child(value, ordinality)
  ),
  duplicate_units AS (
    SELECT min(ordinal_key) AS duplicate_path
    FROM unit_tree
    GROUP BY parent_key, lower(btrim(node ->> 'name'))
    HAVING count(*) > 1

    UNION ALL

    SELECT min(ordinal_key)
    FROM unit_tree
    GROUP BY name_path
    HAVING count(*) > 1
  )
  SELECT min(duplicate_path)
  INTO v_bad_path
  FROM duplicate_units;

  IF v_bad_path IS NOT NULL THEN
    RAISE EXCEPTION
      'SIA_INVALID_ORG_STRUCTURE: duplicate sibling or unit path at position %',
      v_bad_path;
  END IF;

  -- Build stable IDs before inserting so each depth can resolve its parent.
  WITH RECURSIVE unit_tree AS (
    SELECT
      root.value AS node,
      1 AS depth,
      gen_random_uuid() AS unit_id,
      NULL::uuid AS parent_id,
      lpad(root.ordinality::text, 10, '0') AS ordinal_key
    FROM jsonb_array_elements(p_units) WITH ORDINALITY AS root(value, ordinality)

    UNION ALL

    SELECT
      child.value,
      parent.depth + 1,
      gen_random_uuid(),
      parent.unit_id,
      parent.ordinal_key || '.' || lpad(child.ordinality::text, 10, '0')
    FROM unit_tree AS parent
    CROSS JOIN LATERAL jsonb_array_elements(parent.node -> 'children')
      WITH ORDINALITY AS child(value, ordinality)
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', unit_id,
        'parent_id', parent_id,
        'depth', depth,
        'name', btrim(node ->> 'name'),
        'ordinal_key', ordinal_key
      )
      ORDER BY ordinal_key
    ),
    '[]'::jsonb
  )
  INTO v_flat_units
  FROM unit_tree;

  -- Serialize structure creation per tenant and reject replacement/append races.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_org::text, 0));

  IF EXISTS (
    SELECT 1
    FROM public.org_unit_types AS existing
    WHERE existing.organization_id = v_org
  ) THEN
    RAISE EXCEPTION 'SIA_ORG_STRUCTURE_EXISTS: this organization already has hierarchy levels';
  END IF;

  FOR v_level_name, v_level_index IN
    SELECT btrim(value ->> 'name'), ordinality::integer
    FROM jsonb_array_elements(p_levels) WITH ORDINALITY
    ORDER BY ordinality
  LOOP
    INSERT INTO public.org_unit_types (organization_id, name, level)
    VALUES (v_org, v_level_name, v_level_index)
    RETURNING id INTO v_type_id;

    v_type_ids := array_append(v_type_ids, v_type_id);
  END LOOP;

  FOR v_level_index IN 1..v_level_count LOOP
    INSERT INTO public.org_units (
      id,
      organization_id,
      parent_id,
      unit_type_id,
      name
    )
    SELECT
      (unit ->> 'id')::uuid,
      v_org,
      NULLIF(unit ->> 'parent_id', '')::uuid,
      v_type_ids[v_level_index],
      unit ->> 'name'
    FROM jsonb_array_elements(v_flat_units) AS units(unit)
    WHERE (unit ->> 'depth')::integer = v_level_index
    ORDER BY unit ->> 'ordinal_key';
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.create_org_structure(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_org_structure(jsonb, jsonb) TO authenticated;
