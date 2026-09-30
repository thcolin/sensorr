---
target: Entities row paging chevrons
total_score: 27
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/drag-scroll/libs/ui/src/layout/Entities/Entities.tsx"
target_fingerprint: "sha256:6583f59cd8beb7ac1017af662dcc0b06b846812a64f524e4409255deaa827f6f"
target_path: /Users/thcolin/orca/workspaces/sensorr/drag-scroll/libs/ui/src/layout/Entities/Entities.tsx
timestamp: 2026-09-30T15-07-11Z
slug: libs-ui-src-layout-entities-entities-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent)

Target: the paging chevrons of the titled rows and the background-only grab, `git diff 154ec22c`.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | disabled at each end; a click during a drag glide is lost |
| 2 | Match System / Real World | 4 | the pair reads as page, the step lands exactly |
| 3 | User Control and Freedom | 3 | a press stops paging, the wheel does not |
| 4 | Consistency and Standards | 3 | same look as the phone chevron; DESIGN.md has no round action exception |
| 5 | Error Prevention | 3 | the two hit areas overlap by 10px |
| 6 | Recognition Rather Than Recall | 2 | the grab area is 16 to 31% of a row |
| 7 | Flexibility and Efficiency | 3 | the last forward click on the mixed row moves 16px |
| 8 | Aesthetic and Minimalist Design | 4 | small, grey, hidden when the row does not overflow |
| 9 | Error Recovery | n/a | no error state |
| 10 | Help and Documentation | 2 | DESIGN.md describes neither the chevrons nor the background rule |
| **Total** | | **27/36** | **Good** |

## Design Specificity Verdict
Reuses the phone title chevron (1.5em gray round). Deterministic scan: CLI clean on Entities.tsx and List.tsx; browser overlay, no finding on the chevrons or the heads. Glyph contrast 13.94:1 enabled, 2.58:1 disabled; focus ring shows; vertical offset +0.35px; hidden at 390px.

## Priority Issues
- [P1] A chevron click during a drag glide is undone: two animations write scrollLeft. Fix: the hook owns scrollLeft and exposes a glide that Entities and CommandTabs call. Command: /impeccable harden
- [P1] Focus is lost at an end: the focused button becomes disabled. Fix: aria-disabled. Command: /impeccable harden
- [P2] The last forward click on the mixed row moves 16px, More's own padding. Fix: snap to the end within a quarter view. Command: /impeccable polish
- [P2] 24 buttons named Scroll left / Scroll right. Fix: name the pair by the row's title. Command: /impeccable audit
- [P3] Hit areas overlap, no :active, DESIGN.md silent. Command: /impeccable polish

## Persona Red Flags
- Alex: the click lost during a glide.
- Sam: focus drops to BODY at each end; identical names.
- Owner on the phone PWA: unaffected.

## Minor Observations
- Edges do not update on a container resize without a window resize.
- Forward and backward pages do not share boundaries.

## Questions to Consider
- Should forward and backward share page boundaries?
