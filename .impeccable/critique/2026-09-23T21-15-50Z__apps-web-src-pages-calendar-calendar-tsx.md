---
target: Calendar Credits field
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/calendar-roles/apps/web/src/pages/Calendar/Calendar.tsx"
target_fingerprint: "sha256:8a9bfe1cfdcfa1fdd2240879585edb7808ccbbfa358a11d522d2175d3d19f35b"
target_path: /Users/thcolin/orca/workspaces/sensorr/calendar-roles/apps/web/src/pages/Calendar/Calendar.tsx
timestamp: 2026-09-23T21-15-50Z
slug: apps-web-src-pages-calendar-calendar-tsx
---
Method: dual-agent (A: design review, code and reference captures only, the live tab never loaded because two 4201 tabs held Chrome's 6 connections · B: detector plus live browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | stale counts while loading, full month refetch on every refine |
| 2 | Match System / Real World | 4 | TMDB departments verbatim |
| 3 | User Control and Freedom | 2 | reset hidden on the field title |
| 4 | Consistency and Standards | 3 | same component as Followed |
| 5 | Error Prevention | 2 | zero-count options are checkable |
| 6 | Recognition Rather Than Recall | 2 | top-10 billing, Self and 40 min rules invisible |
| 7 | Flexibility and Efficiency | 2 | 12 tab stops, no "only this one" |
| 8 | Aesthetic and Minimalist Design | 3 | 9 dead (0) rows |
| 9 | Error Recovery | 1 | empty state blames the follow list |
| 10 | Help and Documentation | 2 | intro did not name the field |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict
Authored for this product: reuses FilterKnownForDepartment, TMDB vocabulary and the green filter panel. Detector: `impeccable detect` returned [] on Calendar.tsx and FilterKnownForDepartment.tsx. Browser scan (210 findings desktop, 160 at 390 px) has none inside the Credits field; all come from pre-existing panel contrast (white on #01d076, 2.0:1), loading cards and the backdrop.

## Priority Issues
- [P1] Every Credits or Released change refetched the whole month (discover pages plus about 140 detail calls). Fix: derive refinements from fetched movies in a useMemo keyed on refinements. /impeccable optimize
- [P1] Keyboard focus invisible on every checkbox: input.reset sets outline none and Option.tsx restores nothing. Fix: spread-only halo on :focus-visible. /impeccable harden
- [P2] Counts stale or (0) during loading, then the list re-sorts by count. Fix: clear statistics when a load starts. /impeccable clarify
- [P2] Hidden rules: 40 min floor, top-10 billing, Self exclusion, "none checked" shows more than all checked. Fix: name the field in the intro, optionally a hint line. /impeccable clarify
- [P3] Dead (0) options and an empty state that says "follow more people" when the cause is the checkboxes. /impeccable distill

## Persona Red Flags
- Alex: waited a full reload per refine; three unticks for "only Directing".
- Sam: invisible focus, no fieldset/legend, counts at 2.04:1 in 0.75em text, mouse-only reset span.
- Owner-admin: "Acting" silently narrower than TMDB's Acting (top-10, not Self).

## Minor Observations
- At 390 px option labels run about 10px past the field edge (Options width), no clipping.
- Counts overlap across departments, their sum exceeds Results.

## Questions to Consider
- Is Credits a filter or a definition that belongs in Settings?
- Should billing cutoff and runtime floor be visible values?
