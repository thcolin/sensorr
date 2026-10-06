---
target: Poster.tsx badge cutout
total_score: 18
max_score: 24
na_heuristics: 3,5,9,10
p0_count: 0
p1_count: 1
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/encoche-badges/libs/ui/src/elements/Entity/Poster/Poster.tsx"
target_fingerprint: "sha256:ccfb8f71b853dc5a48e1d518f65f9dd9748411a79c305e17b127cac44fc2b0c8"
target_path: /Users/thcolin/orca/workspaces/sensorr/encoche-badges/libs/ui/src/elements/Entity/Poster/Poster.tsx
timestamp: 2026-10-06T15-33-06Z
slug: libs-ui-src-elements-entity-poster-poster-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | the selection aura is broken by a black band under the badges |
| 2 | Match System / Real World | 3 | a notch reads naturally, but it shows black while the light is behind |
| 3 | User Control and Freedom | n/a | visual change only |
| 4 | Consistency and Standards | 3 | guests keep a painted white ring (out of scope) |
| 5 | Error Prevention | n/a | |
| 6 | Recognition Rather Than Recall | 4 | badges unchanged |
| 7 | Flexibility and Efficiency | 3 | hover and checkbox rings merge into one shape |
| 8 | Aesthetic and Minimalist Design | 2 | half-black half-aura ring split at the poster edge |
| 9 | Error Recovery | n/a | |
| 10 | Help and Documentation | n/a | |
| **Total** | | **18/24** | **Good (75%)** |

## Design Specificity Verdict
Cutting the poster fits DESIGN.md's "the poster paints the screen". On the black grid the result is identical to the painted ring. Detector: 0 findings on Poster.tsx. The browser overlay reports pre-existing 10px text (undersized-ui-text), outside this change.

## What's Working
- The hole and the badge agree on every frame: 141 frames on long-press select, largest gap 0.05px; 20 width changes on ratings hover, no gap.
- Crisp edges at DPR 3 on light and dark posters.
- Removing --poster-cutout drops a per-surface setting.

## Priority Issues
- [P1] Inside the poster the ring shows the page's black instead of the aura. The aura is an outer box-shadow on PressableLink's ::after (Poster.tsx:779), which paints nothing under the poster. Fix: filter drop-shadow on PressableLink so the glow follows the cut picture; tested in page (tmp/encoche/pistes-zoom.png). Command: /impeccable polish.
- [P2] After the fix, check no step remains where a ring crosses the poster edge.
- [P2] Focus badge not seen on screen: only on /movie/proposals, look only.
- [P3] Jobs record row (grayLighter) not seen; correct by construction.

## Persona Red Flags
- Casey (mobile): P1 lands on every long-press select or focus.
- Alex: none. Sam: low; the aura doubles the green check and is cut at the corners.

## Minor Observations
- On mobile, a selection opens the ratings with a different value than at rest; predates the branch.
- The Details hero poster's state badge has no ring (different render).

## Questions to Consider
- Should the glow come through the cut, as light behind a punched print would?
