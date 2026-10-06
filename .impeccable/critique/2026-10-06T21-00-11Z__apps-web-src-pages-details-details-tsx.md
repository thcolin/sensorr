---
target: Details loading state
total_score: 24
max_score: 32
na_heuristics: 3,9
p0_count: 0
p1_count: 4
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/skeletons/apps/web/src/pages/Details/Details.tsx"
target_fingerprint: "sha256:f5b155ebd73fd08332df5861d3d1f7673243b3c145693d696af0e513287da867"
target_path: /Users/thcolin/orca/workspaces/sensorr/skeletons/apps/web/src/pages/Details/Details.tsx
timestamp: 2026-10-06T21-00-11Z
slug: apps-web-src-pages-details-details-tsx
---
Method: dual-agent (A: design review, opus · B: detector and browser, sonnet)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | The page title cell went blank between its bar and its logo |
| 2 | Match System / Real World | 3 | Shapes match the real blocks: four overview lines, three externals pills |
| 3 | User Control and Freedom | n/a | A loading state has no control |
| 4 | Consistency and Standards | 2 | "⌛ Loading" tab label and "LOADING" ticket stub against DESIGN.md; pink ticket against tinted bars |
| 5 | Error Prevention | 3 | State badges mount once known, no false state to misclick |
| 6 | Recognition Rather Than Recall | 3 | The skeleton maps one to one to the final blocks |
| 7 | Flexibility and Efficiency | 3 | Each block unlocks on its own source |
| 8 | Aesthetic and Minimalist Design | 3 | Still bars; the ticket is the loudest element while loading |
| 9 | Error Recovery | n/a | Not touched |
| 10 | Help and Documentation | 4 | DESIGN.md Motion documents Bar, Skeleton and reveal |
| **Total** | | **24/32** | Good |

## Design Specificity Verdict
Bars in the content's own shape, tinted from the poster on the details pages, read as this movie's page. Detector: 13 findings, none in the Skeleton files; the two in Details.tsx are the pre-existing `margin` transitions (lines 633 and 658), the rest in Actions.tsx, Head.tsx and Metadata.tsx predate the change. Browser overlay: 158 anti-patterns on /movie/603, none on Skeleton, Bar or reveal; buried rasters are the known Plex image failure in this dev setup.

## Priority Issues
- [P1] Page title blank, then grows when its logo lands (Details.tsx title block). Fix: hold the bar until the logo decodes.
- [P1] "Loading" texts left: Tabs.tsx tab label, Actions.tsx ticket stub. Fix: bars.
- [P1] Drawer placeholders off their content: externals left-aligned against centered content, title bar 2.5em against a 5rem logo. Fix: centered shape, bar that takes the content's size.
- [P1, measured by B] One-frame jump: the subtitle cell 19 to 289px and everything below +277px on /movie/603 when the movie editor opens. Fix: ease the cell's height.
- [P2] Ticket default pink before the palette; bar tint from `palette.palette` while the page paints `shown`, snapping without transition. Fix: `shown` for both, 800ms background-color on Bar.

## Persona Red Flags
Power user on desktop sees the title hole and logo pop on every movie. Phone PWA user sees a loud "LOADING" ticket above the fold, and `restoreScrollPosition()` on ready resets a scroll made during the load (pre-existing). Drawer user sees the content under the poster re-center on arrival.

## Minor Observations
"Contribute to TheMovieDB" shows under the empty poster during load. Lines used a fixed gap that did not follow the overview's line height.

## Questions to Consider
Should the skeleton know the movie's state from the list it was opened from, so the editor's height is predictable? Is the ticket content, with bars, or chrome, neutral until ready?
