-- Employee hierarchy integrity: no self-manager, one profile per employee row.

DO $$
DECLARE
  v_self_manager_count integer;
  v_dup_profile_count integer;
BEGIN
  SELECT count(*) INTO v_self_manager_count
  FROM public.employees
  WHERE manager_id = id;

  IF v_self_manager_count > 0 THEN
    RAISE EXCEPTION 'Cannot add self-manager constraint: % employee row(s) have manager_id = id', v_self_manager_count;
  END IF;

  SELECT count(*) INTO v_dup_profile_count
  FROM (
    SELECT profile_id
    FROM public.employees
    WHERE profile_id IS NOT NULL
    GROUP BY profile_id
    HAVING count(*) > 1
  ) dup;

  IF v_dup_profile_count > 0 THEN
    RAISE EXCEPTION 'Cannot add unique profile_id constraint: % profile_id value(s) are shared by multiple employees', v_dup_profile_count;
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE public.employees
    ADD CONSTRAINT chk_employees_no_self_manager
    CHECK (manager_id IS NULL OR manager_id <> id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_profile_id
  ON public.employees (profile_id)
  WHERE profile_id IS NOT NULL;
