-- FORCE RLS on appraisal workflow tables and pin safe search_path on helpers.

ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_cycles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.goals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.goal_ratings FORCE ROW LEVEL SECURITY;

ALTER FUNCTION public.current_user_org_id() SET search_path = pg_catalog, public;
ALTER FUNCTION public.current_user_role() SET search_path = pg_catalog, public;
ALTER FUNCTION public.current_user_employee_id() SET search_path = pg_catalog, public;
ALTER FUNCTION public.cycle_org(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.participant_org(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.goal_participant(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_manager_of_participant(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_employee_of_participant(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_extra_reviewer_of_participant(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.participant_final_submitted(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.participant_employee_is_terminated(uuid) SET search_path = pg_catalog, public;
