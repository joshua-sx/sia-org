REVOKE EXECUTE ON FUNCTION public.launch_appraisal_cycle(uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bulk_import_employees(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_org_structure(jsonb, jsonb) FROM anon;