---
target: Settings › Update
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/ecran-update/apps/web/src/pages/Settings/Update.tsx"
target_fingerprint: "sha256:5f59efc466c9de69d6727bc2c45b36a39a324bfc2637853b0afb8dce2069f6fb"
target_path: /Users/thcolin/orca/workspaces/sensorr/ecran-update/apps/web/src/pages/Settings/Update.tsx
timestamp: 2026-10-02T15-49-04Z
slug: apps-web-src-pages-settings-update-tsx
---
Method: dual-agent (A: design review · B: detector and browser)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | head answers where the instance stands; no age for the GHCR check |
| 2 | Match System / Real World | 4 | channel, tag, revision, compose |
| 3 | User Control and Freedom | 2 | once stable is picked, only the head says beta runs |
| 4 | Consistency and Standards | 3 | job row, alerts and capsule reused; unpressed pill transparent where CommandTabs keeps accentDarker |
| 5 | Error Prevention | 2 | Switch offered to an older version (rejected by Thomas on 2026-10-02, two channels only) |
| 6 | Recognition Rather Than Recall | 3 | reason of a disabled channel only in a title |
| 7 | Flexibility and Efficiency | 2 | no link to commit or release (out of scope) |
| 8 | Aesthetic and Minimalist Design | 4 | button only when there is an action |
| 9 | Error Recovery | 3 | cause and docker logs in the alert |
| 10 | Help and Documentation | 3 | manual commands, profile link |
| Total | | 29/40 | Good |

Design specificity: authored for this product (real JobSettings row, exact CommandTabs geometry, real commands). Detector: 3 advisory DESIGN.md drifts, all false positives (pill radius from CommandTabs, alert hex kept by decision). Browser: skipped-heading real (h2 then h5); white on #01d076 is the sidebar active link, outside the diff; tight-leading on script/style false positives.

Priority issues
1. [P2] Running channel lost when another is picked. Fix: a `current` badge in the running pill, shaped like the CommandTabs count badge (round-1 decision).
2. [P2] Disabled channel reason only in a title, not exposed to keyboard or screen reader. Fix: visible or aria text.
3. [P3] Loading source line shows beta wording before the channel is known. Fix: placeholder for the whole line.
4. [P3] h2 then h5 (JobSettings h5). Fix: aria-level 3.

Dismissed: downgrade labelled as a switch (Thomas, 2026-10-02); release and commit links (new feature, out of contract); dot cell (in the validated wireframe B).

Minor: CHANNELS.label unused; mobile version cell takes 45% of the row.
