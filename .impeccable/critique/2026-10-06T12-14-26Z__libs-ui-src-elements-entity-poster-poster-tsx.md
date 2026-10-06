---
target: Poster long press
total_score: 21
max_score: 36
na_heuristics: 9
p0_count: 1
p1_count: 1
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/appui-long/libs/ui/src/elements/Entity/Poster/Poster.tsx"
target_fingerprint: "sha256:acec894d34e2d933f33bc475eff746af9d86fea0896394eff36794ef5ac744d0"
target_path: /Users/thcolin/orca/workspaces/sensorr/appui-long/libs/ui/src/elements/Entity/Poster/Poster.tsx
timestamp: 2026-10-06T12-14-26Z
slug: libs-ui-src-elements-entity-poster-poster-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | A checked poster hides its green check under the ratings badge |
| 2 | Match System / Real World | 3 | Long press to select follows the Photos grammar of iOS and Android |
| 3 | User Control and Freedom | 3 | `n ✕` empties the selection, focus clears on any touch or scroll |
| 4 | Consistency and Standards | 2 | Same hold selects on a grid and focuses in a row; the tap that dismisses a focus also opens the touched poster |
| 5 | Error Prevention | 3 | `window.confirm` before State and Lists |
| 6 | Recognition Rather Than Recall | 2 | Nothing hints at the long press; unchecked boxes show a tick |
| 7 | Flexibility and Efficiency | 3 | Tap to toggle once the selection is open |
| 8 | Aesthetic and Minimalist Design | 3 | Focus is restrained; the expanded ratings pill overlaps the neighbour |
| 9 | Error Recovery | n/a | No error path in this change, the metadata toasts cover it |
| 10 | Help and Documentation | 1 | Hidden gesture, no first-use hint |
| **Total** | | **21/36** | **Acceptable (58%)** |

## Design Specificity Verdict

LLM: specific to the product. The focus shows what a desktop hover shows (ratings, credits) and reuses the poster glow DESIGN.md sanctions; the clear segment reuses the `Bulk` pill and its `clear` icon.

Deterministic scan: CLI `detect` on Poster.tsx, Bulk.tsx, withBulk.tsx: 0 findings (the detector does not read theme-ui `sx`). Browser injection: undersized-ui-text on poster meta (year, genres, percentages, 7.66 to 10 px), pre-existing and outside this change; text-occlusion 12 in the checked state, which matches the P0 below; buried-raster on Home (fade-in, false positive); tight-leading on injected script/style (false positive).

## Priority Issues

- [P0] A checked poster hides its check. The `transform: scale(1.05)` on the poster wrapper becomes the containing block of the `position: fixed` checkbox, which lands under the ratings badge (`elementFromPoint` hits the badge). Fix: scale without moving the checkbox, or position it so the transform does not shift it. /impeccable polish
- [P1] Unchecked reads as checked: in selection mode every unchecked box shows a white tick on gray (`Option` checkbox). Existing Library look, outside the long-press change. /impeccable clarify
- [P2] The tap that dismisses a focus also opens the touched neighbour's drawer. /impeccable polish
- [P2] Focused ratings pill overlaps the neighbour's badge, and focus hides the state badge (as the desktop hover does). /impeccable layout
- [P3] The gesture is invisible, no first-use hint. /impeccable onboard

## Persona Red Flags

Casey: same hold means select on Discover and preview on Home; credit avatars sit just above the title and are person links.
Alex: no range selection, no select-all outside Library, shows bulk-changed one at a time with no progress.
Sam: focus is touch-only with no ARIA; `onContextMenu` preventDefault on the link removes native link actions; `✕` has a correct `aria-label`.

## Minor Observations

- Wrapper and link both animate transform over 600 ms with no `prefers-reduced-motion` guard.
- Credit avatars spill past the row's left edge on the first poster.
- The bulk bar covers the titles of the last visible row.

## Questions to Consider

- Should a row's long press select too, so the gesture means one thing everywhere?
- Would a checked poster read better by dimming the unchecked ones?
