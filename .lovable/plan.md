# Onboarding: honest assessment and repair plan

I traced the whole flow — signup edge function, `useOnboarding`, the setup dashboard, both step pages, the wizard, and the live database. The visual layer is genuinely good. The problem is that the flow's *logic* and its *promise* disagree, and one foundational thing is missing entirely.

## What is actually wrong

### 1. The flow exits after step 2 of 4

`useOnboarding.ts` defines four steps — Account, Structure, People, Launch — and every progress indicator counts to 4. But setup is considered finished the moment Structure is done:

```ts
const setupComplete = !!organization && (structureDone || !!organization?.setup_complete);
const isOnboarding = !!organization && !setupComplete;
```

So when the structure wizard finishes it marks Structure complete and navigates to `/org/employees` — and on arrival the progress strip, the sticky Back/Continue footer and the skip control have all unmounted, because onboarding just "ended". The dashboard simultaneously flips to "You're all set. Ready to run your first appraisal cycle." while People and Launch are still untouched. `markComplete("cycle")` — the only code that ever sets `setup_complete` — is unreachable.

The live data matches: 3 organizations have completed Structure, 1 has `setup_complete`.

This is the disconnected feeling. The user is dropped out of a guided flow mid-sentence.

### 2. Imported employees can never sign in

Nothing in the product ever writes `employees.profile_id`. There is no invitation table, no invite function, no email. `signup` and `complete-signup` only ever create an `hr_admin` with a brand-new organization.

Live: 17 employee records, 3 linked to accounts — and those 3 were hand-seeded for the demo. Profile roles: 4 hr_admin, 1 manager, 1 employee.

Everything downstream assumes those accounts exist. Managers can't set goals, employees can't acknowledge, and `send_cycle_nudge` rejects almost every recipient with "no account". Onboarding collects the org chart and then has no way to turn it into users.

### 3. Foundational information onboarding never asks for

- **Scoring model** — `interim_weight_pct` / `final_weight_pct` decide every final score, but they're only editable in a settings card deep inside appraisals. New orgs launch cycles on defaults they never saw.
- **Review cadence / fiscal year** — every cycle's four date windows are typed from scratch, with nothing to anchor them.
- **Who else is HR or a manager** — the founder is alone in the org with no way to add a colleague.
- **The appraisal model itself** — nowhere does onboarding explain goals → interim → final → acknowledge → close. People are asked to build a hierarchy before they know what it's for.

### 4. Four competing progress indicators

`OnboardingPipeline` renders in the setup dashboard hero *and* in the top strip; `OnboardingStepHeader` adds per-step criteria; the footer adds a blocking hint; the dashboard adds a fifth checklist. Same state, five surfaces.

## What I recommend building

### Phase 1 — Make the flow finish (correctness)

- Keep Structure as the only *required* step, but stop equating it with completion. Setup ends when the user reaches an explicit finish (all steps done or deliberately skipped), not when Structure saves.
- Have the structure wizard hand off *inside* onboarding: complete Structure, stay in the flow, land on People with the strip and footer intact.
- Add a real completion screen (`StepSuccess` already exists and is used by the wizard) before the dashboard swap, and make the dashboard's "You're all set" copy conditional on genuinely being set.
- Collapse the progress UI to two surfaces: the pipeline in the strip, per-step criteria in the step header. Remove the duplicate pipeline from the setup dashboard hero and the checklist duplication.

### Phase 2 — Employee invitations (the real gap)

- New `employee_invitations` table (org-scoped, token, role, expiry, status) with RLS and grants.
- `invite-employees` edge function: creates auth users for selected employees, links `employees.profile_id`, creates their `profiles` row with the right role, and sends the invite.
- `accept-invitation` path so a manager or employee lands in the right org with the right role — not a new org, which is what happens today.
- UI in the People step: after import, a "Send invitations" panel with per-person status (not invited / invited / active) and bulk send.

### Phase 3 — Ask for what the product needs

Add a short **Review model** step between People and Launch:

- Interim / final weight split, written to `organizations`.
- Review cadence (annual / semi-annual / quarterly) and fiscal-year start, used to prefill cycle date windows.
- Optional: invite a second HR admin.

Precede it with a one-screen explainer of how a cycle runs, so the structure and people work has visible purpose.

## Technical notes

- `useOnboarding.ts` — change the `setupComplete` derivation, add an explicit `onboarding_complete` concept; the `organizations` skip/complete flags already exist for all three steps.
- `OrgStructure.tsx:141` — wizard `onComplete` currently navigates outside the flow.
- Phase 2 requires migrations (invitations table + grants + RLS) and two edge functions; `send_cycle_nudge` already returns `SIA_NO_ACCOUNT`, which becomes correct once invitations exist.
- Phase 3 reuses `useOrgScoringSettings` and `orgScoringSchema` — no new backend needed beyond cadence columns on `organizations`.
- Side note: the People step is still `--accent-yellow` in `useOnboarding.ts`, `AppSidebar.tsx` and `OrgEmployees.tsx`, despite the earlier yellow-to-purple decision.

## Suggested order

1. Phase 1 (flow correctness) — small, no schema change, fixes the incoherence you're feeling.
2. Phase 2 (invitations) — largest, but it's what makes the rest of the product actually usable by anyone but the founder.
3. Phase 3 (review model step) — small, best done after 1.

Tell me which phase to start with, or approve to begin with Phase 1.
