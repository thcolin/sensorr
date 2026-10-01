---
target: sync shows Withdrawn and Unknown to TMDB sections
total_score: 18
max_score: 32
na_heuristics: 3,5
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/petits-manques-web/apps/web/src/pages/Jobs/Job/Shows.tsx"
target_fingerprint: "sha256:102830fe24123e72dcf89b4a43e4ed30078e28a68fd2ad7379ba35bc2e7f88f4"
target_path: /Users/thcolin/orca/workspaces/sensorr/petits-manques-web/apps/web/src/pages/Jobs/Job/Shows.tsx
timestamp: 2026-10-01T22-08-23Z
slug: apps-web-src-pages-jobs-job-shows-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

Scope: the Withdrawn and Unknown to TMDB sections of the sync shows job view, on fixture logs injected by a read-only relay.

| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of System Status | 2 |
| 2 | Match System / Real World | 3 |
| 3 | User Control and Freedom | n/a |
| 4 | Consistency and Standards | 3 |
| 5 | Error Prevention | n/a |
| 6 | Recognition Rather Than Recall | 2 |
| 7 | Flexibility and Efficiency | 1 |
| 8 | Aesthetic and Minimalist Design | 3 |
| 9 | Error Recovery | 2 |
| 10 | Help and Documentation | 2 |
| **Total** | | **18/32** |

Deterministic scan: 0 findings on Shows.tsx; browser detector, no finding on the two sections.

## Priority Issues

- [P1] A withdrawn release title cut at 200px shows only the show name the card already carries. Fixed: the note reads from the season on.
- [P1] Episode numbers and the full title live in `title` only, unreachable by touch. Partly fixed: up to two episodes are named in the note; beyond, hover only.
- [P1] The sections sat under 239 Fixed cards (18 000px). Fixed: they now come before Fixed.
- [P2] Two adjacent ellipsed notes read as one line. Open.
- [P3] Unknown to TMDB states without pointing to TMDB. Open.
