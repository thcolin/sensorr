---
target: List rows drag to scroll
total_score: 25
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 0
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/drag-scroll/libs/ui/src/elements/List/List.tsx"
target_fingerprint: "sha256:795d6673cbfba68322d29f0930ec73f0d81231d25da5eabefcb02d42356fa41b"
target_path: /Users/thcolin/orca/workspaces/sensorr/drag-scroll/libs/ui/src/elements/List/List.tsx
timestamp: 2026-09-30T14-12-48Z
slug: libs-ui-src-elements-list-list-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent)

Target: the mouse drag-to-scroll of the horizontal rows (useDragScroll, DragScroll), on branch thcolin/drag-scroll against d8c6fa59.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | grabbing on the row during a drag; body stays auto, the cursor changes when the pointer leaves the row mid-drag |
| 2 | Match System / Real World | 4 | grab/grabbing idiom, iOS constants |
| 3 | User Control and Freedom | 3 | a press or the wheel stops the inertia; the CommandTabs pill slide conflict breaks it |
| 4 | Consistency and Standards | 3 | one hook everywhere; posters and pills keep pointer, two cursors in one row |
| 5 | Error Prevention | 3 | click swallowed, dragstart blocked, 10px threshold; text selection lost in Pretty prose |
| 6 | Recognition Rather Than Recall | 2 | grab shows only in gaps (74% of a home row, 19% of CommandTabs); no edge fade on List rows; macOS overlay scrollbar 0px at rest |
| 7 | Flexibility and Efficiency | 3 | keyboard kept, ArrowRight scrolls a row from a focused poster |
| 8 | Aesthetic and Minimalist Design | 4 | nothing added |
| 9 | Error Recovery | n/a | a gesture with no error state |
| 10 | Help and Documentation | n/a | a gesture in a one-user tool |
| **Total** | | **25/32** | **Good** |

## Design Specificity Verdict
Behavior specific to the product: mouse only, touch PWA untouched, click protected, reduced motion respected. Discovery is the generic part: it rests on the cursor and the cut-off card at the right edge.

Deterministic scan: 0 findings on lines the diff wrote. 13 pre-existing findings in the touched files (design-system-radius x10 advisory, layout-transition Progress.tsx:107). Browser overlay injected on / and /jobs in the B tab, since closed; no finding on the drag rows (sensorr-bjt31x, sensorr-xb115o). No leftover translate, pointer-events or transition on row children.

## Priority Issues
- [P2] Grabbing CommandTabs during the 400ms pressed-pill slide makes the row jump by about 965px: the slide rAF and the drag both write scrollLeft. Fix: cancel the rAF of CommandTabs.tsx:54-80 on pointerdown. Command: /impeccable harden
- [P2] The drag is hard to discover where one aims: grab only in gaps, no edge fade on List rows. Fix proposal: the data-start/data-end mask of Bulk.tsx:294-300 on List rows; a new visual element, outside the contract, Thomas decides. Command: /impeccable clarify
- [P3] Text selection lost in Pretty card prose. Fix proposal: a data-drag-scroll=off opt-out; Thomas decides. Command: /impeccable harden
- [P3] Nested rows (Pretty badges inside a List row) would both move on one pointerdown. Fix: the first handler claims the event. Command: /impeccable harden
- [P3] The grab cursor goes stale: set on pointerenter only, reset to grab unconditionally on release. Fix: same overflow test in both places. Command: /impeccable polish

## Persona Red Flags
- Alex: a fling travels further than the 351px pane (250px of drag, 637px travelled); the pill-then-grab jump.
- Sam: nothing breaks; Enter not swallowed, focus-visible kept, reduced motion honoured.
- Owner clearing the backlog: takes the /jobs and Notifications CommandTabs route most, meets the pill jump most.

## Minor Observations
- A row overflowing by a few pixels still gets grab, rubber band and inertia; acceptable.
- Hover does not come back after release until the mouse moves.
- DESIGN.md Motion (line 690) does not yet describe the inertia and spring constants.
- Spring 400/40 is critically damped.

## Questions to Consider
- Should a fling in a 351px pane glide further than the pane?
- Should the drag signal live on the row's edge rather than on the cursor?
- Is losing text selection on Pretty cards the right default?
