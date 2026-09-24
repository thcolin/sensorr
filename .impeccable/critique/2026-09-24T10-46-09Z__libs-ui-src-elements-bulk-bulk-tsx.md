---
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/bulk-selection/libs/ui/src/elements/Bulk/Bulk.tsx"
target_fingerprint: "sha256:cd62dc47b8e78566e8df43ac8ba767a2f9b0ecdfc1683e714a33df156c768d4b"
target_path: /Users/thcolin/orca/workspaces/sensorr/bulk-selection/libs/ui/src/elements/Bulk/Bulk.tsx
timestamp: 2026-09-24T10-46-09Z
slug: libs-ui-src-elements-bulk-bulk-tsx
---
Method: dual-agent (A: design review · B: detector + browser), run one after the other and isolated, because two tabs on :4202 exhaust Chrome's connections.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The count lives only in the controls bar and turns into "Unselect All" once everything is selected |
| 2 | Match system / real world | 3 | Emoji and policy names in the owner's words; "Proposal" in Library, "Swaps" elsewhere |
| 3 | User control and freedom | 2 | 5 s undo in Swaps, native `confirm()` without undo in Library |
| 4 | Consistency and standards | 2 | Two safety models for one bar; `role=toolbar` without arrow keys |
| 5 | Error prevention | 1 | Select All then Accept moves 3 114 swaps in two clicks, red ones included |
| 6 | Recognition rather than recall | 3 | Values visible; the current value of the selection is not |
| 7 | Flexibility and efficiency | 1 | No shortcut; the portaled bar is tab stop 452 of 457 |
| 8 | Aesthetic and minimalist design | 3 | One line, quiet; `primary` and `primaryDark` barely differ |
| 9 | Error recovery | 2 | A failed batch reselects; no offline `disabled` in Library |
| 10 | Help and documentation | 2 | Only the `title` "Cancel (Esc)" |
| **Total** | | **21/40** | Acceptable |

Applicable max: 40, no heuristic scored n/a.

## Design specificity
Wears the app's clothes (controls-bar green, balance-strip separator, emoji, Sort by label/value type) on a category-standard idiom. The specific decision sits next to it: the balance re-scoped to the selection.

Detector: 8 findings. 3 design-system-font on `fontFamily: 'body'` are false positives (token = Open Sans). 5 design-system-radius (`1em`, `1px`, `2px`) are outside the diff. Browser: one finding inside `[data-bulk]`, cramped-padding, false positive.

## Priority issues
- [P0] Library at 390px: the `bulk` field is outside the grid (`Library.tsx:86`), so a checked poster shows no bar. /impeccable adapt
- [P1] Loading placeholders are selectable: `select-null` (`Poster.tsx:130`) puts `null` in the selection and opens the bar on "1 Selected". Pre-existing, made visible by the bar.
- [P1] The count disappears when everything is selected: "Unselect All" replaces "N Selected" (`Library.tsx:239`, `Proposals.tsx:548`).
- [P1] No proportional friction on mass irreversible writes, and two models: broken `confirm()` copy in Library, flat 5 s undo in Swaps. /impeccable harden
- [P2] Keyboard: `role=toolbar` without roving arrows, no `aria-live` on the count.
- [P2] Offline: disabled segments at 1.37:1, no reason given.

## Minor
- React warning: `active` passed to `CheckIcon` (`Proposals.tsx:1084`), in the diff.
- "State" label white on `primaryDark`: 2.4:1, same pairing as the rest of the app.
- Chevron points up while the family opens in place.
- In Swaps the bar covers the last row's size pills; the list has no bottom padding for it.

Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3
