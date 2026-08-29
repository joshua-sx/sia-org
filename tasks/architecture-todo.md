# SIA Architecture Remediation — Todo

See `tasks/architecture-plan.md` for acceptance criteria, files, and
verification. This list does not replace the interface-design todo in
`tasks/todo.md`.

## Phase 0: Live verification
- [ ] Task 0 — Confirm JWT hook, `pg_policies`, grants, appraisal migration pair, `launch_appraisal_cycle` on Lovable Cloud (requires Lovable Cloud dashboard access)
- [x] Lock window-edit decision: freeze cycle windows after launch (approved 29 Aug 2026)
- [x] Lock ack-after-due: block (approved 29 Aug 2026)
- [x] Lock weight-sum timing: allow ≠ 100 until submit (approved 29 Aug 2026)
- [x] Lock employee `interim_score` visibility: hide until `final_submitted_at` at DB (approved 29 Aug 2026)

## Phase 1: Org-structure privilege holes (`fix/arch-phase-1-org-rls`)
- [x] Task 1 — Drop via_profile FOR ALL; add org to HR WITH CHECK (`20260818010000`)
- [x] Task 2 — Pin `profiles_update` WITH CHECK (`20260818010001`)
- [x] Task 3 — Restrictive unit isolation uses helper only (`20260818010002`)
- [x] Checkpoint A — Phase 1 live on Lovable Cloud (user confirmed 18 Aug 2026)

## Phase 2: Launch and participant integrity (`cursor/arch-phase-2-launch-integrity-bf21`)
- [x] Task 4 — Same-org + active employee checks in `launch_appraisal_cycle` (`20260818020000`)
- [x] Task 5 — Unique partial index: one active cycle per org (`20260818020001`)
- [x] Task 6 — Same-org trigger on `cycle_participants` (`20260818020002`)
- [x] Checkpoint B — Phase 2 live on Lovable Cloud; foreign-org participants and duplicate active cycles rejected (verified 29 Aug 2026)

## Phase 3: Cycle write guards (`fix/arch-phase-3-cycle-guards`)
- [x] Task 7 — `guard_cycle_writes` status machine (`20260829040000`)
- [ ] Checkpoint C — cannot INSERT `status=active`; approval (verify on Lovable Cloud)

## Phase 4: Appraisal workflow contracts (`cursor/arch-remediation-phases-4-6-0950`)
- [x] Task 8 — Freeze terminated participants in guards/RPC (`20260829100000`)
- [x] Task 9 — `FOR UPDATE` on `goal_ratings` during submit (`20260829100100`)
- [x] Task 10 — Employee score visibility + ack window (`20260829100200`)
- [x] Task 11 — Snapshot org scoring weights onto the cycle at launch (`20260829100300`)
- [ ] Checkpoint D — freeze/submit/snapshot verified on staging; approval

## Phase 5: Schema hygiene (`cursor/arch-remediation-phases-4-6-0950`)
- [x] Task 12 — Self-manager CHECK + unique `profile_id` (`20260829110000`)
- [x] Task 13 — FORCE RLS on employees/appraisal; safe `search_path` (`20260829110100`)
- [x] Task 14 — Duplicate migration cleanup (29 Aug 2026, merged from `main`): 8 hand-authored files
      (`20260818010000–02`, `20260818020000–02`, `20260828180300`, `20260828183000`)
      were byte-equivalent re-records of the Cloud-applied copies
      (`20260818070849/070909/070926`, `20260829024246/024321/024344/024444/024530`);
      only the versions present in remote `schema_migrations` were kept.
      Still unrecorded remotely but intentionally retained: `20260705120000`,
      `20260705121000`, `20260709000000` (schema live under an earlier record) and
      `20260829040000_guard_cycle_writes.sql` (Phase 3, not yet applied — `guard_cycle_writes`
      is absent from the live catalog).
- [ ] Checkpoint E — local `db reset` green; approval

## Phase 6: Frontend, types, documentation (`cursor/arch-remediation-phases-4-6-0950`)
- [x] Task 15 — Regenerate types; remove `as never` (`launch_appraisal_cycle` in `types.ts`)
- [x] Task 16 — AuthContext + bulk manager-link error handling
- [x] Task 17 — Move `appraisalRecord` I/O onto a hook
- [x] Task 18 — Query keys, canAcknowledge, SPEC.md alignment
- [ ] Checkpoint F — lint/test/build green; approval

## Phase 7: Signup hardening (optional)
- [ ] Product approval
- [ ] Task 19 — Generic signup errors, explicit `verify_jwt`, password/rate-limit policy
