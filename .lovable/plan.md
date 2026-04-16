

# Widen Setup Wizard Container

## Current
`max-w-2xl` = 672px — too narrow for a SaaS wizard with a 2x3 card grid.

## Change
Update the container class in `src/components/org/SetupWizard.tsx` line 138 from `max-w-2xl` to `max-w-4xl` (896px).

This is the standard width used by tools like Notion, Linear, and Stripe for onboarding/settings flows. It gives the 2x3 template grid proper breathing room and looks proportional on 1280px+ screens.

### Optional: go `max-w-5xl` (1024px)
If you want it even wider — closer to a full dashboard content area — I can use `max-w-5xl` instead. Let me know your preference or I'll default to `max-w-4xl`.

## File
| Action | File |
|--------|------|
| Modify | `src/components/org/SetupWizard.tsx` line 138 — change `max-w-2xl` → `max-w-4xl` |

