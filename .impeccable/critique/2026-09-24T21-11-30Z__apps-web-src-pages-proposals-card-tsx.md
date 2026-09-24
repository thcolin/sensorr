---
target: open swap card and its Search for releases ticket
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Proposals/Card.tsx"
target_fingerprint: "sha256:212d3725cf64021e02859e23a3cf725725c0740901c6a945c11abebc64033aba"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Proposals/Card.tsx
timestamp: 2026-09-24T21-11-30Z
slug: apps-web-src-pages-proposals-card-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: the open swap card (`UIActive`) and the Jobs "Search for releases" ticket reused under its poster, measured on `d0faca2`.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | A disabled ticket reads "Loading" with animated dots |
| 2 | Match System / Real World | 3 | The ticket fits the VCR world; "Search for" undersells "replace" |
| 3 | User Control and Freedom | 1 | Escape closed the card under the open drawer; Undo toast is good |
| 4 | Consistency and Standards | 2 | Same component as Jobs; browser default focus ring; drawer not a dialog |
| 5 | Error Prevention | 1 | A, R, B reached the card through the drawer (P0) |
| 6 | Recognition Rather Than Recall | 2 | The drawer does not mark the current proposal |
| 7 | Flexibility and Efficiency | 2 | No key opens the search |
| 8 | Aesthetic and Minimalist Design | 2 | Sound on desktop; loudest element of the card on mobile |
| 9 | Error Recovery | 3 | Toast names movie, release and size, with Undo |
| 10 | Help and Documentation | 2 | `title` tooltip only |
| **Total** | | **20/40** | |

## Design Specificity Verdict

The ticket is the app's own artefact, reused rather than redrawn, as PRODUCT.md asks. In the swap card it says "search" where the gesture means "replace this proposal". Detector: nothing on the new lines of Card.tsx; 2 findings in older Card.tsx code (`borderRadius: '1em'` line 886, `fontFamily: 'body'` line 928, a false positive), 10 in older Actions.tsx code (ticket `hsla` palette, `transition: margin, height`). Browser: undersized ticket text ("Search for" 10.5px, serial 7.5px, both pre-existing from Jobs) and the collapsed Preferences form, `opacity: 0` yet focusable (7 tab stops).

## Priority Issues

- **[P0] Queue shortcuts reach the card while the drawer is open.** Escape observed closing the card; A, R, B, Z handled the same way (Proposals.tsx keydown on window). Fix: the handler returns while a drawer is open; the drawer declares itself a modal.
- **[P1] Invisible focusable Preferences form behind the ticket.** `MovieActions` hard-codes `expandable={false}`, so its selects never show but always mount. Fix: mount them only once expanded.
- **[P1] Picking a release is an unlabelled replace.** Drawer header says "Releases", the current proposal row carries no marker. Fix: title the drawer for the replace, mark the proposal and the owned rows.
- **[P2] Mobile hierarchy.** At 390px the ticket sits between poster and title, pushing the title to y=464 of 844. Fix: move or shrink the ticket on mobile.
- **[P3] States.** Default focus ring on pink; disabled shows "Loading". Fix: theme focus halo, distinct disabled state.

## Persona Red Flags

- Keyboard power user: types `a` while browsing the drawer and accepts the proposal underneath; tabs through seven invisible controls.
- Phone PWA user: the pink ticket reads as the card's main action above the title.

## Minor Observations

- The "⋮" end of the ticket is a button that is always disabled (Jobs has the same).
- The `.torrent` link carries indexer credentials at runtime: keep it out of committed screenshots.

## Questions to Consider

- Is "replace" a peer of Accept and Refuse, with its own gesture and key?
- Should the drawer open filtered to releases that beat the current proposal?
