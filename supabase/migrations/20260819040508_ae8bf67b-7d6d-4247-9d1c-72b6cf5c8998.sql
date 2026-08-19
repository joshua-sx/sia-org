REVOKE ALL ON FUNCTION public.guard_notification_writes() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.audit_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RAISE EXCEPTION 'SIA_AUDIT_IMMUTABLE: audit events cannot be modified or deleted';
END;
$function$;

REVOKE ALL ON FUNCTION public.audit_events_immutable() FROM PUBLIC, anon, authenticated;