---
target: Settings › Update
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/updater/apps/web/src/pages/Settings/Update.tsx"
target_fingerprint: "sha256:5f75a36818616eac5f5838efd1347e4ff8e3ae216b25dfb5b147a859832922d2"
target_path: /Users/thcolin/orca/workspaces/sensorr/updater/apps/web/src/pages/Settings/Update.tsx
timestamp: 2026-10-02T14-18-46Z
slug: apps-web-src-pages-settings-update-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | `updating` is local state: leaving and coming back mid-update re-enables the button; a failed run is not shown on load |
| 2 | Match System / Real World | 3 | admin vocabulary: channels, tags, compose |
| 3 | User Control and Freedom | 2 | one gesture restarts the stack |
| 4 | Consistency and Standards | 3 | `summary > h3` outweighs the action; Warning link stays primary green (`section a` wins) |
| 5 | Error Prevention | 2 | job guard good; re-click after remount gets the updater 409 as a toast |
| 6 | Recognition Rather Than Recall | 3 | tag prefilled |
| 7 | Flexibility and Efficiency | 2 | no copy on commands |
| 8 | Aesthetic and Minimalist Design | 3 | "Recreates…" under a disabled button |
| 9 | Error Recovery | 3 | GHCR error only in a `title` |
| 10 | Help and Documentation | 3 | README link |
| **Total** | | **26/40** | **Acceptable** |

## Design Specificity Verdict
Authored for this product (A). Detector: 0 static findings on Update.tsx and Settings.tsx; browser: 2 low-contrast white on primary (2.0:1, recorded deviation in DESIGN.md), 3 tight-leading on script/style nodes (false positives), 1 unidentified #333 on #0a0a0a.

## Priority Issues
- [P1] Downgrade not distinguished: rejected, Thomas decided at the brief that a channel switch takes the tag's version without a state of its own.
- [P1] Update progress lost on remount: derive `updating` from `updater.run` on load, show a failed run on load.
- [P2] Live regions mounted with their content: keep one always-present status region.
- [P2] Toast repeats on every Settings mount, Update page included: give it an id, skip it on /settings/update.
- [P2] Action area hierarchy: `Manual update` summary smaller than h3, hide "Recreates…" when the button is disabled.

## Minor Observations
- Warning link colour override loses to `Settings.styles.container section a`.
- `padding: '1em 1.5em !important'` is a raw value.
- "after 5:00" should read "after 5 minutes".
- GHCR error only in `title`: show it in the small line.
