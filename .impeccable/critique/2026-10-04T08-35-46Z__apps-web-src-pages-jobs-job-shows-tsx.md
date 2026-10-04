---
target: Unknown to TMDB footer, Shows.tsx
total_score: 15
max_score: 32
na_heuristics: 3,5
p0_count: 1
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Jobs/Job/Shows.tsx"
target_fingerprint: "sha256:701a14b8b4f456b124744e1bf774dda831c0f75893d9330ea778c90769a0f8f5"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Jobs/Job/Shows.tsx
timestamp: 2026-10-04T08-35-46Z
slug: apps-web-src-pages-jobs-job-shows-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: the uncommitted "Unknown to TMDB" footer (`UnmatchedShow`) of the sync shows job page.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | 1 or 2 unknown episodes out of 50-174 are invisible in the bar |
| 2 | Match system / real world | 1 | `174 \| 195` in red reads "21 missing from Plex"; truth is 2 Plex episodes unknown to TMDB |
| 3 | User control | n/a | read-only section |
| 4 | Consistency and standards | 1 | pill grammar owned\|aired reused for Plex\|TMDB; `broken` red reserved for a broken policy |
| 5 | Error prevention | n/a | no input |
| 6 | Recognition over recall | 2 | episode codes only in `title`, the old line showed them |
| 7 | Flexibility and efficiency | 2 | one hover per card to learn which episodes |
| 8 | Aesthetic and minimalist | 3 | clean, aligned with neighbour cards |
| 9 | Error recovery | 2 | says something is off, not what |
| 10 | Help and documentation | 2 | `title` copy exact |
| **Total** | | **15/32** | poor |

## Design specificity
System-native: reuses `TransitionPill` and segmented `Progress` like `DownloadingShow`. Detector CLI: 0 findings. Browser overlay: 537 page-wide, only `gray-on-color` (left side #e6e6e6 on errorDarkest, 6.00:1, passes AA) and `text-occlusion` (intended two-tone overlap, false positive) touch the new pills.

## Priority issues
- [P0] Pill misstates the fact when Plex < aired (`174|195`, `417|458`) and forces subtraction otherwise. Fix: the pill carries the unknown count, or keep the normal owned|aired footer and show the unknown count/codes apart.
- [P1] `broken` red for a TMDB-side data gap the user cannot fix. Fix: neutral or info tint, or a documented state.
- [P1] Proportional red fill vanishes for 1-2 episodes in long shows; S00 sorted first unlabelled reads as season 1. Fix: tint affected seasons whole, or drop the bar for the codes.
- [P2] No accessible name: no role/aria-label on the pill. Fix: `role='img' aria-label={title}` like `ProgressPill`.
- [P2] Mobile keeps a 27-40px dotted bar that `ShowProgress` drops on compact cards. Fix: hide `Progress` on mobile.

## Persona red flags
- Owner on the PWA: codes unreachable without hover.
- Screen reader: pill reads as two glued numbers.

## Minor
- `UnmatchedShow` borrows `UIDownloadingShow.styles`.
