---
target: SortableSelect prefer ranks
total_score: 19
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/policy-ranks/libs/ui/src/inputs/Select/SortableSelect.tsx"
target_fingerprint: "sha256:8784a2702208eb6f9e157903a346903022dd688aff3b3a40ebd5520e61e1fb1f"
target_path: /Users/thcolin/orca/workspaces/sensorr/policy-ranks/libs/ui/src/inputs/Select/SortableSelect.tsx
timestamp: 2026-09-28T12-06-36Z
slug: libs-ui-src-inputs-select-sortableselect-tsx
closed: true
---
Method: dual-agent (A: design review, B: detector + browser)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Dragged chip stays in place at 40% opacity, nothing follows the pointer |
| 2 | Match system / real world | 3 | "Same rank" matches scoring; the box never says what it is worth |
| 3 | User control and freedom | 3 | Drag out of the box ungroups, touch too |
| 4 | Consistency and standards | 2 | Box border uses `primary` at rest; DESIGN.md reserves it for selection |
| 5 | Error prevention | 2 | Insertion bar hides on the group's outer border |
| 6 | Recognition rather than recall | 1 | Nothing says the chip centre groups; help text (Policies.tsx:60,72) describes strict order |
| 7 | Flexibility and efficiency | 2 | Mouse/touch only by owner's decision; no multi-merge |
| 8 | Aesthetic and minimalist | 3 | Dense, house style |
| 9 | Error recovery | n/a | No error states |
| 10 | Help and documentation | 1 | Score paragraph does not explain a shared rank |
| **Total** | | **19/36** | Acceptable |

## Design specificity
Concept is product-specific (a policy rank, drawn around existing chips); execution generic (bright green rectangle, no tie to points). Detector: 2 advisory `design-system-radius` at SortableSelect.tsx:75,92 (inherited 2px). Overlay ~2050 hits, nearly all pre-existing: `undersized-ui-text` on the documented `mono-strong` chip label (false positive against DESIGN.md), `low-contrast` on the off ＊ toggle (2.2:1, real, pre-existing), white on prefer greens (2.8:1, pre-existing).

## Priority issues
- [P1] No drag preview: nothing follows the pointer. Fix: dnd-kit `DragOverlay` rendering the active chip.
- [P1] Insertion bar invisible at a group's outer edge (`::before` sits on the box border, same colour). Fix: offset it outside the box.
- [P1] A wrapped group reads as two groups (open-ended fragments, broken alignment). Fix: render each rank as one inline-flex wrapper so the border wraps as a whole, or a tonal fill.
- [P2] Box weight/token: `primary` border at rest, hardcoded 2px radius. Fix: neutral/tonal token, theme radius.
- [P2] Gesture and meaning undiscoverable. Fix: extend Policies.tsx:60 and :72 help text; drop the dead drag-time `title`.

## Persona red flags
- Alex: cannot merge two ranks in one gesture; no per-rank points shown.
- Sam: no keyboard path (accepted); membership is border-only.
- Owner on PWA: wrapped fragments mislead on the Language axis.

## Minor observations
- Cursor `pointer`, never `grab`.
- Dashed outline overlaps the box border inside a group.
- Chip gap 3px inside a box vs 7px between free chips.

## Questions to consider
- Show each rank's points as a mono label on the box?
- A "join previous" hit area between chips instead of a drag?
- Tiers as rows on the language axis?
