# Animation implementation plans

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | Animate organization detail selection | MEDIUM | DONE |
| 002 | Animate People attention resolution | MEDIUM | DONE |
| 003 | Animate notification badge state | LOW | DONE |
| 004 | Animate the onboarding structure preview | LOW | DONE |
| 005 | Animate appraisal phase state changes | LOW | DONE |

## Recommended execution order

Execute 001 through 005 in numeric order. They share no behavioral dependencies, but all must reuse the same two established easing curves and the existing `usePrefersReducedMotion` hook. Keep core navigation, search results, hierarchy expansion, and operational data lists static.
