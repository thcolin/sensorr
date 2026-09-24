---
target: apps/web/src/pages/Jobs/Job
total_score: 23
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/jobs-space/apps/web/src/pages/Jobs/Job"
timestamp: 2026-09-24T13-08-59Z
slug: apps-web-src-pages-jobs-job
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Net disk change visible at a glance; refine/shrink pills only exist once the job is done |
| 2 | Match System / Real World | 2 | 💾 against 💿 does not say "would change" against "did change" |
| 3 | User Control and Freedom | 3 | Read-only pills, nothing to undo |
| 4 | Consistency and Standards | 2 | 💾 is realized on sync, potential on refine/shrink; read-only pills look like the filter pills next to them; the diff row is left-aligned between two centered releases |
| 5 | Error Prevention | 3 | Nothing new writes |
| 6 | Recognition Rather Than Recall | 2 | Meaning lives in a hover Tippy only |
| 7 | Flexibility and Efficiency | 3 | Numbers-only pills suit the owner |
| 8 | Aesthetic and Minimalist Design | 3 | Calm on desktop; on a phone the size pills are wider than the posters, 4 px apart |
| 9 | Error Recovery | n/a | No error path added; missing data hides the pills |
| 10 | Help and Documentation | 2 | Tippy wording is precise, but keyboard and touch cannot reach it (pre-existing span) |
| **Total** | | **23/36** | **Acceptable (64 %)** |

## Design Specificity Verdict

LLM assessment: authored for Sensorr. It reuses the Transition pill as DESIGN.md asks, and the shrink row between the owned and the proposed release reads "this becomes that", the Swaps metaphor moved into the job log.

Deterministic scan: 3 `design-system-font` warnings at `ProcessMovies.tsx:632`, `:661`, `:690`, pre-existing (`42c2a4fd`, 2023) and partly false: `monospace-no-emoji` is a theme token DESIGN.md does not document. `Grid.tsx` clean. In the page, detect.js flags `low-contrast` white on `#03a05c` 3.39:1 on each new size pill: the `held` tint DESIGN.md already records as a kept deviation. `text-occlusion` on the stacked flags is a false positive.

## Priority Issues

- [P1] Sync header and grid do not add up (−149.01 GB against −146.06 GB summed). Synthesis: false positive of the fixture. The relay sets the summary to fixed 290/130 GB and each log's landed size to 45 % of its deletion; in the real flow both come from the same cleanup logs (`sync.js`, `Sync.tsx` spaceOf).
- [P1] Mobile Cleaned grid: pills 155 to 162 px under 120 px posters, 4 px apart. Real sizes top at 28.9 GB deleted, so no overlap, but they read close to one bar.
- [P2] 💾 is realized on sync and potential on refine/shrink. The emojis were chosen by the owner at the wireframe.
- [P2] Read-only 💾/💿 look like the filter pills. The sync pills are read-only too, and the owner validated "no click".
- [P2] Diff row left-aligned between two centered releases (`ProcessMovies.tsx` `UIRecord.styles.diff`). Fix: center it.

## Persona Red Flags

Alex: clicks 💾 expecting a filter. Sam: the summary pill reads as bare "−149.01 GB", not focusable, Tippy unreachable; held tint 3.40:1 now shown 20 times per sync. Owner: 💾 is pill 5 of 6; "💿 ±0" reads the same for "nothing accepted" and "net zero".

## Minor Observations

- 💾 pushes ⚠️ onto a second line in the job list card.
- A refine that grew the disk will show a red size pill on an accepted swap: correct by the Swaps rule.
- "? → EAC3-5.1" under an owned release showing DTS: the owned side parses the Plex filename (`original`), as Swaps does; the badge above shows the generated title.
- `dub: null` leaks into a Transition title, from Swaps.

## Questions to Consider

- Should space lead the job header, since it decides whether the job is worth opening?
- Would 💾 on a shrink job be more useful as a link to Swaps filtered on this job?
