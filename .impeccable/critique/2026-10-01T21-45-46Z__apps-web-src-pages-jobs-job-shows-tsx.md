---
target: sync tv job summary
total_score: 17
max_score: 32
na_heuristics: 3,5
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/petits-manques-web/apps/web/src/pages/Jobs/Job/Shows.tsx"
target_fingerprint: "sha256:962b3b82fc55c5d21caacc409bc239c6b33abbe361f692e0da850b4e385fd7a5"
target_path: /Users/thcolin/orca/workspaces/sensorr/petits-manques-web/apps/web/src/pages/Jobs/Job/Shows.tsx
timestamp: 2026-10-01T21-45-46Z
slug: apps-web-src-pages-jobs-job-shows-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `live` does not raise `created` nor `withdrawals` while the run goes |
| 2 | Match System / Real World | 2 | "Episode streams read from Plex" does not say these are files read for the first time, so 9047 then 103 reads as a drop |
| 3 | User Control and Freedom | n/a | read-only summary |
| 4 | Consistency and Standards | 2 | "episodes unknown to TMDB" sits under ⚠️ in `migrate sonarr`, under ❓ here |
| 5 | Error Prevention | n/a | no action |
| 6 | Recognition Rather Than Recall | 2 | ❓ and 🔍 mean something only in a tooltip, unreachable by keyboard or touch (pre-existing span pills) |
| 7 | Flexibility and Efficiency | 3 | `extended` keeps the sidebar to actions |
| 8 | Aesthetic and Minimalist Design | 2 | 7 pills of equal weight, the biggest number (9047) the least useful |
| 9 | Error Recovery | 1 | ❓ 105 and 🗑️ lead to no list |
| 10 | Help and Documentation | 2 | tooltips only |
| **Total** | | **17/32** | |

## Design Specificity Verdict

LLM: product-specific, reuses `Summary`, emoji as the icon set, domain words (Plex, TMDB, archived, proposals). Weakness: two instrumentation pills (🔍, ❓) weigh as much as the results.

Deterministic scan: `Shows.tsx` 0 findings; `Jobs.tsx` 4 and `CommandTabs.tsx` 2 `design-system-radius`, all on lines the diff did not write. Browser detector: 530 findings on `/jobs/x4wx5qg`, 490 `undersized-ui-text` on the sidebar meta (10px), none on the summary row (16px). The four new pills share padding 6px 14px, radius 16px, 16px font, 31.2px height with their siblings.

## Priority Issues

- [P1] 🗑️ withdrawals: an irreversible refusal counted with no list. Fix: a Withdrawn section in `sections`. Outside the chantier's scope (written as hors périmètre).
- [P1] ❓ unmatched repeats 105 every run with no list, in red. Fix: one emoji for the concept across the app, or a section listing the episodes.
- [P2] 🔍 read is a cost metric worded as a result. Fix: title "New episode files read from Plex".
- [P2] ➕ is counted inside 🩹 (a created show is pushed to `corrections`), 239 + 5 reads as 244. Fix: say it in the ➕ title.
- [P3] ➕ renders grey with Apple Color Emoji, reads as disabled. Fix: a coloured emoji.

## Persona Red Flags

Owner-admin: wants to fix the 105 episodes and is not told which; a proposal withdrawn with no list looks like a Proposals bug; on the PWA the tooltips are unreachable.

## Minor Observations

- 🗑️ title comma is ambiguous: "Proposals withdrawn, Plex holds all their episodes" reads better.
- 🗑️ means Dropped in Proposals/Card.tsx:31 and Skipped in migrate sonarr.

## Questions to Consider

- Does 🔍 read serve the owner or the developer?
- Is a count of 105 on every run a result of the run or a state of the library?
- Should a pill that leads to no list be there at all?
