-- One active appraisal cycle per organization. The launch RPC still raises
-- SIA_CYCLE_ALREADY_ACTIVE as a friendly error; this index is the concurrency
-- guarantee.

CREATE UNIQUE INDEX IF NOT EXISTS appraisal_cycles_one_active_per_org
  ON public.appraisal_cycles (organization_id)
  WHERE status = 'active';
