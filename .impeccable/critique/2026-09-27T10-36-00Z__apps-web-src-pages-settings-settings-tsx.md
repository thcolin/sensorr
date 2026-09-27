---
target: Settings PWA scroll + header rainbow bar
total_score: 25
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Settings/Settings.tsx"
target_fingerprint: "sha256:e20b83c3d40ea7731e02da837e3e45b6ccb3e498999fa5ce698a9440d4fdb8cd"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Settings/Settings.tsx
timestamp: 2026-09-27T10-36-00Z
slug: apps-web-src-pages-settings-settings-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: PWA at 390px, the Settings index and sub-pages scroll (c4b7888f), the rainbow LoadingBar under the search toolbar and above the sub-navigation (cbe12e60). Header.tsx reviewed with it.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | The bar is decorative, not a loading signal |
| 2 | Match System / Real World | 4 | |
| 3 | User Control and Freedom | 3 | Back chevron disabled on a directly opened sub-page (pre-existing) |
| 4 | Consistency and Standards | 3 | Bar at one place on every PWA screen; rules stack where there is no sub-nav |
| 5 | Error Prevention | n/a | Nothing new to prevent |
| 6 | Recognition Rather Than Recall | 3 | No "Settings" breadcrumb on a sub-page, only the bottom icon |
| 7 | Flexibility and Efficiency | 3 | |
| 8 | Aesthetic and Minimalist Design | 3 | |
| 9 | Error Recovery | n/a | Nothing new |
| 10 | Help and Documentation | 3 | Jobs and Policies explainers do the job |
| **Total** | | **25/32** | Good |

## Design Specificity Verdict

LLM assessment: the two changes stay inside the incumbent world. The bar now belongs to the search toolbar: with search results open it stays under the field while the sub-nav leaves the screen. The 2px come out of the 4em toolbar, so no screen shifts.

Deterministic scan: `impeccable detect` on both files, 0 findings. Browser overlay on /settings, /settings/jobs, /movie/library: contrast of `grayDark` (#333 on #0a0a0a, 1.6:1) on the tagline and inactive tab labels, 10px tab labels, white on #01d076 Save button (2.0:1), 8px poster text. All pre-existing and outside the two changes. False positives: tight-leading on script/style nodes, hidden h2 heading skip, ", ," separators.

## What's Working

- Scroll area of every sub-page spans header to bottom bar (65 to 775.5 at 844, 65 to 592 at 660); Jobs' Save ends 32px above the bottom bar.
- Index at 660: `column-reverse` plus `overflowY: auto` rests on the links (all nine visible), the logo footer is reached by scrolling up.
- Desktop 1440x900 unchanged: bar at 0-2, hr at 122.8, side menu and Jobs pane scroll inside themselves.

## Priority Issues

- [P2] Update dot out of sight on the index at short heights. The footer with `v0.0.0` and its red dot sits above the fold at 660. Fix: same dot on the "Update" row, or accept the toast. Pre-existing layout, made reachable by this diff.
- [P2] Search underline, bar and hr stack in 4px on screens without a sub-nav (61-62, 62-64, 64-65). Invisible today: both rules are rgb(18,18,18) on black and the app is dark only. Fix if a lighter theme ever lands: in PWA draw the hr only under a sub-nav and drop the search underline.
- [P3] Jobs sub-page clipped on the right: its content is 562 wide in a 390 #body with overflowX hidden, the cron inputs end at 468-562. Same width before the diff (the block container also gave #body 390). Cause in Jobs.tsx, outside the scope.
- [P3] `column-reverse` scroll origin verified in Chromium only. Check once on the iOS 27 simulator.

## Persona Red Flags

- Owner on the iPhone PWA, short screen: opens Settings to look for an update, the red dot is above the list.
- Owner opening a sub-page from a reload: no page title, back chevron disabled (pre-existing).
- Owner editing a cron on Jobs: the right field is cut and cannot be scrolled to (pre-existing).

## Minor Observations

- Mobile sub-page uses 2.5em side padding, Jobs and Policies about 24px.
- The hr under the sub-nav is invisible on Library and Calendar; the green page toolbar separates.

## Questions to Consider

- In PWA without a sub-nav, should the bar be the header's only bottom edge?
- Should the index show the update state inside the list rather than in a footer that column-reverse pushes up?
