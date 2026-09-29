---
target: "filtres des séries: Shows/Library, Discover, Calendar"
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-tv-filters/apps/web/src/pages/Shows/Library.tsx"
target_fingerprint: "sha256:0bea4c3315acbfcc99a9e8c87a4e85acc3e1c6a25028f481a18a301901065524"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-tv-filters/apps/web/src/pages/Shows/Library.tsx
timestamp: 2026-09-29T11-59-27Z
slug: apps-web-src-pages-shows-library-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 24/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Calendar counts describe the 222 followed shows, not the month; Discover network counts are library counts |
| 2 | Match system / real world | 3 | "🎟️ Episode" does not say status |
| 3 | User control and freedom | 3 | No reset |
| 4 | Consistency and standards | 2 | First Air Year vs First Air Date; library counter reused in Calendar on another population |
| 5 | Error prevention | 1 | Clicking a label checks another filter (duplicate ids in Options) |
| 6 | Recognition rather than recall | 3 | |
| 7 | Flexibility and efficiency | 2 | OR/AND span not keyboard reachable (pre-existing) |
| 8 | Aesthetic and minimalist design | 3 | 18 groups, 4.4 screens |
| 9 | Error recovery | 2 | Empty states do not name the filter |
| 10 | Help and documentation | 3 | |

## Design specificity
Grounded in Sensorr: same aside, Warning heads, histograms on real distributions, shared 📀 aside. Detector: 1 advisory (`design-system-radius`, Releases.tsx:56, code moved from the movies library). Browser occlusion findings are the open drawer backdrop (false positives); white on #01d076 at 2.0:1 is the app-wide green.

## Priority issues
- [P0] Duplicate checkbox ids: Discover Status "Canceled" label checks Type "Scripted"; Releases job "Airing" checks Status "Airing". Root cause libs/ui/src/inputs/Options/Options.tsx:68 `id={input.value}`. Fix: prefix the id with the field name.
- [P1] Calendar counts (Genres, Policy, Requested by, Networks) are computed on followed shows and never change with month or filters. Fix: movie calendar role, no counts.
- [P2] Emoji collisions: 📺 used for Followed, Networks, SD+, Not followed; Not followed loses its inactive rendering; Type reuses genre emoji; 📡 for status and job. Fix: distinct emoji, inactive Not followed.
- [P2] Discover Type offers Talk Show and News while the default preset excludes those genres. Fix: drop them from Discover types.
- [P2] A touched range drops shows without a value (288 of 522 without episode length). Same as movies.

## Minor
First Air Year vs First Air Date; "🎟️ Episode" label; Calendar TV head 📅 vs 🗓️ on movies; "1 Filters" plural and mobile placeholder truncation are pre-existing.
