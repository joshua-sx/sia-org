-- MCP intelligence layer: org chart and pending review RPCs (read-only, permission-scoped).

CREATE OR REPLACE FUNCTION public.mcp_get_org_chart()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org uuid;
BEGIN
  v_org := public.current_user_org_id();
  IF v_org IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'organization_id', v_org,
    'unit_types', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('id', t.id, 'name', t.name, 'level', t.level)
          ORDER BY t.level
        )
        FROM public.org_unit_types t
        WHERE t.organization_id = v_org
      ),
      '[]'::jsonb
    ),
    'units', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'parent_id', u.parent_id,
            'depth', u.depth,
            'is_active', u.is_active,
            'unit_type_id', u.unit_type_id,
            'unit_type_name', ut.name,
            'unit_type_level', ut.level
          )
          ORDER BY u.depth, u.name
        )
        FROM public.org_units u
        JOIN public.org_unit_types ut ON ut.id = u.unit_type_id
        WHERE u.organization_id = v_org
      ),
      '[]'::jsonb
    ),
    'people', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'employee_id', e.id,
            'first_name', e.first_name,
            'last_name', e.last_name,
            'email', e.email,
            'job_title', e.job_title,
            'employment_status', e.employment_status,
            'org_unit_id', e.org_unit_id,
            'org_unit_name', ou.name,
            'manager_id', e.manager_id,
            'manager_name', CASE
              WHEN m.id IS NULL THEN NULL
              ELSE btrim(m.first_name || ' ' || m.last_name)
            END
          )
          ORDER BY e.last_name, e.first_name
        )
        FROM public.employees e
        LEFT JOIN public.org_units ou ON ou.id = e.org_unit_id
        LEFT JOIN public.employees m ON m.id = e.manager_id
        WHERE e.organization_id = v_org
      ),
      '[]'::jsonb
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mcp_get_org_chart() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mcp_get_org_chart() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mcp_get_pending_reviews(p_cycle_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org uuid;
  v_role text;
  v_employee_id uuid;
  c public.appraisal_cycles;
  v_today date := (timezone('UTC', now()))::date;
  v_participants jsonb;
  v_by_department jsonb;
BEGIN
  v_org := public.current_user_org_id();
  IF v_org IS NULL THEN
    RETURN NULL;
  END IF;

  v_role := public.current_user_role();
  SELECT e.id INTO v_employee_id
  FROM public.employees e
  WHERE e.profile_id = auth.uid() AND e.organization_id = v_org;

  IF p_cycle_id IS NOT NULL THEN
    SELECT * INTO c FROM public.appraisal_cycles WHERE id = p_cycle_id;
  ELSE
    SELECT * INTO c FROM public.appraisal_cycles
    WHERE organization_id = v_org AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF NOT FOUND OR c.organization_id IS DISTINCT FROM v_org THEN
    RETURN jsonb_build_object('cycle', NULL, 'participants', '[]'::jsonb, 'by_department', '[]'::jsonb);
  END IF;

  WITH visible AS (
    SELECT cp.*,
           e.first_name,
           e.last_name,
           e.job_title,
           e.employment_status,
           e.org_unit_id,
           ou.name AS unit_name,
           m.first_name AS manager_first,
           m.last_name AS manager_last,
           COALESCE(gw.weight_sum, 0) AS goal_weight_sum
    FROM public.cycle_participants cp
    JOIN public.employees e ON e.id = cp.employee_id
    JOIN public.employees m ON m.id = cp.manager_id
    LEFT JOIN public.org_units ou ON ou.id = e.org_unit_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(g.weight), 0)::integer AS weight_sum
      FROM public.goals g
      WHERE g.participant_id = cp.id
    ) gw ON true
    WHERE cp.cycle_id = c.id
      AND (
        v_role = 'hr_admin'
        OR (v_role = 'manager' AND v_employee_id IS NOT NULL AND cp.manager_id = v_employee_id)
        OR (v_role = 'employee' AND v_employee_id IS NOT NULL AND cp.employee_id = v_employee_id)
      )
  ),
  scored AS (
    SELECT
      v.id AS participant_id,
      v.employee_id,
      btrim(v.first_name || ' ' || v.last_name) AS employee_name,
      v.job_title,
      v.unit_name,
      btrim(v.manager_first || ' ' || v.manager_last) AS manager_name,
      v.employment_status,
      v.goal_weight_sum,
      CASE
        WHEN v.employment_status = 'terminated' THEN 'frozen'
        WHEN v.goal_weight_sum = 100 THEN 'complete'
        WHEN v_today > c.goal_window_end THEN 'overdue'
        WHEN v_today < c.goal_window_start THEN 'not_due'
        ELSE 'pending'
      END AS goals_status,
      CASE
        WHEN v.employment_status = 'terminated' THEN 'frozen'
        WHEN v.interim_submitted_at IS NOT NULL THEN 'complete'
        WHEN v_today > c.interim_window_end THEN 'overdue'
        WHEN v_today < c.interim_window_start THEN 'not_due'
        ELSE 'pending'
      END AS interim_status,
      CASE
        WHEN v.employment_status = 'terminated' THEN 'frozen'
        WHEN v.final_submitted_at IS NOT NULL THEN 'complete'
        WHEN v_today > c.final_window_end THEN 'overdue'
        WHEN v_today < c.final_window_start THEN 'not_due'
        ELSE 'pending'
      END AS final_status,
      CASE
        WHEN v.employment_status = 'terminated' THEN 'frozen'
        WHEN v.acknowledged_at IS NOT NULL THEN 'complete'
        WHEN v.final_submitted_at IS NULL THEN 'not_due'
        WHEN v_today > c.acknowledgement_due THEN 'overdue'
        ELSE 'pending'
      END AS acknowledgement_status
    FROM visible v
  ),
  with_overdue AS (
    SELECT s.*,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN s.goals_status = 'overdue' THEN 'goals' END,
        CASE WHEN s.interim_status = 'overdue' THEN 'interim' END,
        CASE WHEN s.final_status = 'overdue' THEN 'final' END,
        CASE WHEN s.acknowledgement_status = 'overdue' THEN 'acknowledgement' END
      ], NULL) AS overdue_tasks,
      (
        s.goals_status IN ('pending', 'overdue')
        OR s.interim_status IN ('pending', 'overdue')
        OR s.final_status IN ('pending', 'overdue')
        OR s.acknowledgement_status IN ('pending', 'overdue')
      ) AS has_pending
    FROM scored s
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'participant_id', w.participant_id,
      'employee_id', w.employee_id,
      'employee_name', w.employee_name,
      'job_title', w.job_title,
      'unit_name', w.unit_name,
      'manager_name', w.manager_name,
      'goal_weight_sum', w.goal_weight_sum,
      'goals_status', w.goals_status,
      'interim_status', w.interim_status,
      'final_status', w.final_status,
      'acknowledgement_status', w.acknowledgement_status,
      'overdue_tasks', w.overdue_tasks,
      'has_pending', w.has_pending
    )
    ORDER BY w.employee_name
  ), '[]'::jsonb)
  INTO v_participants
  FROM with_overdue w;

  IF v_role = 'hr_admin' THEN
    WITH visible AS (
      SELECT cp.*,
             e.org_unit_id,
             ou.name AS unit_name,
             e.employment_status,
             COALESCE(gw.weight_sum, 0) AS goal_weight_sum
      FROM public.cycle_participants cp
      JOIN public.employees e ON e.id = cp.employee_id
      LEFT JOIN public.org_units ou ON ou.id = e.org_unit_id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(g.weight), 0)::integer AS weight_sum
        FROM public.goals g
        WHERE g.participant_id = cp.id
      ) gw ON true
      WHERE cp.cycle_id = c.id
    ),
    scored AS (
      SELECT
        COALESCE(v.unit_name, 'Unassigned') AS department,
        v.employment_status,
        v.goal_weight_sum,
        v.interim_submitted_at,
        v.final_submitted_at,
        v.acknowledged_at
      FROM visible v
    ),
    dept AS (
      SELECT
        s.department,
        count(*) AS participants,
        count(*) FILTER (
          WHERE s.employment_status <> 'terminated'
            AND (
              (s.goal_weight_sum <> 100 AND v_today > c.goal_window_end)
              OR (s.interim_submitted_at IS NULL AND v_today > c.interim_window_end)
              OR (s.final_submitted_at IS NULL AND v_today > c.final_window_end)
              OR (s.acknowledged_at IS NULL AND s.final_submitted_at IS NOT NULL AND v_today > c.acknowledgement_due)
            )
        ) AS overdue_count
      FROM scored s
      GROUP BY s.department
    )
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'department', d.department,
        'participants', d.participants,
        'overdue_count', d.overdue_count
      )
      ORDER BY d.overdue_count DESC, d.department
    ), '[]'::jsonb)
    INTO v_by_department
    FROM dept d;
  ELSE
    v_by_department := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'cycle', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'status', c.status,
      'goal_window_end', c.goal_window_end,
      'interim_window_end', c.interim_window_end,
      'final_window_end', c.final_window_end,
      'acknowledgement_due', c.acknowledgement_due
    ),
    'caller_role', v_role,
    'participants', v_participants,
    'by_department', v_by_department
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mcp_get_pending_reviews(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mcp_get_pending_reviews(uuid) TO authenticated, service_role;
