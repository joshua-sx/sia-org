# Onboarding: one four-step flow (Setup → Structure → People → Cycle)

Rebuild authenticated onboarding as a single continuous journey. Auth is not a step. The setup-checklist Dashboard is removed from the flow; the real Dashboard appears only after onboarding finishes.

## Flow

```text
sign in / sign up (email or Google)
        ↓
1 Setup      /onboarding/setup     blue    admin name + org details
2 Structure  /org/structure        red     template + units
3 People     /org/employees        purple  CSV or manual
4 Cycle      /appraisals           green   timeline + scoring → Draft → Finish setup
        ↓
Dashboard (real product nav restored)
```

## Shared onboarding chrome

One header on all four screens: accent eyebrow (SETUP / STRUCTURE / PEOPLE / CYCLE), four compact progress segments, heading, one supporting sentence, then content. All visible "Step X of 4", "Hierarchy 1 of 3", "Structure · Review 3 of 3" text is removed; a screen-reader-only "Step 2 of 4: Structure" label replaces it. Segments carry completed / current / upcoming states with a non-color cue (check glyph + `aria-current`), not color alone.

One shared action footer replaces the full-width CTA: Back and the primary action adjacent, right-aligned on desktop, ~40px high, content-width with ~120px minimum on the primary, 8–12px gap. Setup omits Back entirely. Verbs: Continue (steps 1–3), Create cycle, Finish setup. Disabled primaries carry an accessible tooltip (hover, focus, touch) naming the first unresolved requirement — no persistent requirement sentences under the content.

## Step 1 — Setup

Today's `/complete-signup` screen moves into the onboarding shell as the first step. Full name splits into First name and Last name (side by side on desktop), then Organization name full width, then Country and Industry side by side. Google-provided names prefill both fields and stay editable. The backend keeps `full_name`; the two fields are joined at the API call, so no migration. Per-field validation copy, errors under each field, `aria-invalid` + `aria-describedby`. On success go straight to Structure.

## Step 2 — Structure

Keeps templates (Government, Corporate, Healthcare, Education, Flat, Custom), custom hierarchy, unit builder and preview. The internal 3-step wizard becomes progressive disclosure: "Choose a structure", then "Add organization units" revealed after a choice. Whole template cards are selectable with default/hover/focus/selected/disabled states and a structural selected border; the Setup industry marks one card "Recommended" without auto-selecting it. Two task checks: structure selected, at least one unit added. Continue stays disabled until existing minimums are met, with the tooltip "Choose a structure and add at least one unit to continue."

## Step 3 — People

Keeps the two choices (Upload a CSV — recommended; Add manually) and Download CSV template. Once people exist, the empty-state cards collapse into a compact toolbar above the table. Removes "Add at least 1 employee to continue.", "No one is emailed until you launch a cycle." and "Back to Org Structure". An info icon beside the supporting copy plus the disabled-Continue tooltip carry the blocking requirement, including the existing manager-relationship rule when it is what blocks. No change to employee or manager validation rules.

## Step 4 — Cycle

One cycle-building experience on the page: no "New cycle" button, no separate org-scoring card, no empty-state duplicate CTA. Two sections with completion indicators:

- **Timeline** (open by default): cycle name plus the existing seven date fields grouped by stage — Goal setting, Interim review, Final review, Employee acknowledgement — each with a one-line explanation. Inline chronological validation replaces the generic toast.
- **Scoring** (secondary until Timeline is valid): interim 30 / final 70 defaults, both editable, total shown, must equal 100%. Reuses the existing org scoring values and calculations; no other org settings exposed.

Primary action "Create cycle" is disabled until an employee exists, name is present, dates are valid and ordered, and scoring totals 100%. Creation produces a **Draft** only — no launch, invites, tasks or emails. Then the screen shows "Your first cycle is ready" with a summary (name, each window, acknowledgement due, scoring split, status Draft), a quiet "Edit cycle" action, and a "Finish setup" footer action that marks onboarding complete and routes to the real Dashboard.

Onboarding readiness changes so a valid draft cycle satisfies the Cycle step (today it requires a launched cycle). This is the only intentional behavior change.

## Sidebar

While onboarding is incomplete the sidebar reads Setup / Structure / People / Cycle, with completed steps revisitable and upcoming steps locked until prerequisites are met. After completion it returns to Dashboard / Structure / Employees / Appraisals.

## Technical notes

- New: `src/pages/OnboardingSetup.tsx` (step 1), a shared footer component, and a cycle builder component under `src/components/appraisals/`.
- Rewritten: `OnboardingStepFrame` (header + segments + shared footer, no full-width CTA, no detached back link), `useOnboarding` (four-step model, draft-cycle readiness, `finishSetup` → Dashboard), `onboardingCopy.ts`, `AppSidebar`, `OrgStructure` + `SetupWizard` (progressive disclosure), `OrgEmployees`, `AppraisalCycles`.
- Removed from the flow: `SetupDashboard` as an onboarding screen; `/dashboard` redirects to the current step while onboarding is incomplete.
- `CycleFormModal` stays for post-onboarding cycle creation; the onboarding builder reuses `cycleFormSchema` and `useAppraisalCycles`.
- Page titles: "Set up workspace | SIA", "Set up structure | SIA", "Add people | SIA", "Create cycle | SIA". Onboarding routes stay out of the sitemap.
- Motion: CSS transitions ≤150ms on specific properties, no `transition: all`, `active:scale-[0.96]`, Framer Motion only for the custom-hierarchy reveal and Timeline→Scoring transition with `AnimatePresence initial={false}` and spring duration 0.3 / bounce 0.
- No changes to auth providers, RLS, tenant isolation, scoring math, launch behavior, notifications, or marketing pages.
- Verification: full keyboard walkthrough of both signup paths, all Back/Continue actions, validation and tooltip states, CSV and manual People paths, invalid/valid timelines, scoring under/over/equal 100%, draft status and no notification rows, then lint, tests and build.
