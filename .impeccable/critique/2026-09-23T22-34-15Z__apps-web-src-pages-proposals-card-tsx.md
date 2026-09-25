---
target: overdue group of the Swaps screen
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:apps/web/src/pages/Proposals/Card.tsx"
target_fingerprint: "sha256:208296b7784808407bee2f837fb8fed735cef00dd12bf6744e954c84eb9ed471"
target_path: apps/web/src/pages/Proposals/Card.tsx
timestamp: 2026-09-23T22-34-15Z
slug: apps-web-src-pages-proposals-card-tsx
closed: true
---
Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent), run one after the other so that only one tab held localhost:4202.

Target: the `⏳ overdue` group of the Swaps screen, `UIOverdue` in `apps/web/src/pages/Proposals/Card.tsx`, wired in `Proposals.tsx`. Inspected live at 1440×900 and 390×844 on a local fixture (American Beauty), commits `0346f69` to `dbd6b91`.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Collapsed, last, after 3 126 refine rows; the title reads like `💤 ignored`; nothing says the swap blocks refine and shrink |
| 2 | Match system / real world | 3 | "overdue" never explained on screen |
| 3 | User control and freedom | 3 | Undo on Retry and Drop; Undo opened an unrelated card (fixed in `fb51fd2`) |
| 4 | Consistency and standards | 3 | Hover highlight on a row that does not open (fixed in `dbd6b91`); larger mobile poster; text buttons among icon rows |
| 5 | Error prevention | 3 | Drop weighs the same as Retry, its consequence only in a `title` |
| 6 | Recognition rather than recall | 3 | What each gesture does lives in tooltips, absent on touch |
| 7 | Flexibility and efficiency | 2 | No keyboard gesture, the queue skips the row |
| 8 | Aesthetic and minimalist design | 3 | 38 px buttons are the loudest thing in any row of the page |
| 9 | Error recovery | 3 | Failed Retry offers Search; the message guessed the cause (made neutral in `dbd6b91`) |
| 10 | Help and documentation | 2 | `docs/jobs.md` explains it; the screen does not |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

LLM assessment: grounded. The row is the page's own compact row, pills, size pill, verdict band and Undo toast. The generic part is the row of three equal outline buttons, and the caption "accepted 1 year ago" is the only fact about why the row is here.

Deterministic scan: `impeccable detect` on Card.tsx and Proposals.tsx, exit 0, 4 advisory `design-system-radius` findings, all on lines older than the branch. Browser overlay injected at both sizes: on the overdue row, `low-contrast` on the year and the caption (`grayDarker` #666 on #050505, 3.55:1, 12 px), on the green pills (#fff on #03a05c, 3.4:1, inherited from `Transition`), `text-occlusion` of the 🇺🇳 flags (inherited). Measured: button border #333 on #050505, 1.61:1; buttons 38 px high at both sizes; no horizontal overflow at 390 px. The rest of the overlay (header sizes, heading skips, stripes, Open Sans) is page chrome outside this diff.

Both assessments agree on the caption contrast and the button weight; the detector adds the border contrast figure.

## Priority Issues

- **[P1] Undo on an overdue row opened an unseen refine card.** `undo` set `activeId` to an id outside the keyboard queue, which falls back to a neighbour card. Fixed in `fb51fd2`, and the same fallback in `onToggle` in `dbd6b91`.
- **[P1] The only signal of a stuck movie sits where the user never goes.** Last, collapsed, title identical in weight to `ignored`. Placement and collapse were chosen by the user; a signal elsewhere (a count in the controls bar, or a notification from `sync`) is a product decision. `Results` no longer counts overdue rows (`dbd6b91`).
- **[P2] The caption fails contrast and says too little.** "accepted 1 year ago" at 3.55:1. Fix: `grayDarkest`, and name the indexer and the absolute date.
- **[P2] Button weight.** Three 38 px equal outline buttons, border 1.61:1, under 44 px on a phone. Fix within the gray outline variant: smaller on desktop, 44 px on mobile, Drop set apart.
- **[P3] Mobile poster larger than the compact rows'.** The row height is auto on a phone.

## Persona Red Flags

- Keyboard-first owner: the row is out of the A/R/S queue by design; Tab reaches the buttons.
- Screen reader: three rows would announce "Retry, button" alike; give each an accessible name with the title.
- Phone: tooltips do not exist, so Drop's "keeps what Plex has" is invisible.

## Minor Observations

- `⏳` reads as "in progress"; kept, it is the user's group name in the wireframe.
- The overdue list is fetched once on mount; a swap that lands while the page is open stays until reload, where the metadata SSE removes it anyway since the row reads the metadata first.

## Questions to Consider

- Should a stuck swap also surface in the bell, where faults already go?
- Is Search, not Retry, the right first gesture after 7 days?
