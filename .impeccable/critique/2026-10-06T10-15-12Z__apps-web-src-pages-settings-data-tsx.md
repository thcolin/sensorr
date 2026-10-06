---
target: Settings > Data
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/dump-import/apps/web/src/pages/Settings/Data.tsx"
target_fingerprint: "sha256:58ddf1287fac5b6b532940b2c8eabf39fa6a92d93d6b119f81e1a56f76cfad5b"
target_path: /Users/thcolin/orca/workspaces/sensorr/dump-import/apps/web/src/pages/Settings/Data.tsx
timestamp: 2026-10-06T10-15-12Z
slug: apps-web-src-pages-settings-data-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Restore progress and outcome only in Jobs; the page never says what was imported |
| 2 | Match System / Real World | 3 | "as JSON a text editor opens", "replace these" read awkwardly |
| 3 | User Control and Freedom | 2 | Only exit is the confirm's Cancel; no safety dump before a restore |
| 4 | Consistency and Standards | 2 | Import, destructive, drawn as the same green primary as Dump now; two "Jobs" links to two places |
| 5 | Error Prevention | 2 | Warning says what is lost, never what comes in (manifest counts unused) |
| 6 | Recognition Rather Than Recall | 3 | Restoring a listed dump needs a download then a re-upload |
| 7 | Flexibility and Efficiency | 2 | No restore from a row |
| 8 | Aesthetic and Minimalist Design | 3 | Two full-width green slabs compete |
| 9 | Error Recovery | 3 | Download error is a generic "try again" |
| 10 | Help and Documentation | 3 | Inline copy covers scope and secrets |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict

Specific through copy (movies, TV shows, episodes, stars, real counts, 💾 job emoji, Settings alert boxes reused as is); generic in composition: nothing visual separates a backup from a library-wide replace.

Deterministic scan: `impeccable detect` on Data.tsx, 0 findings. Browser overlay, 9: white on #01d076 2.0:1 (active sidebar link, primary button, as everywhere in the app), disabled Import #ccc on #03a05c 2.1:1, line length ~128 ch on the two paragraphs, splash text of index.html and tight leading on script/style nodes (false positives).

## Priority Issues

- [P1] Import is a green primary identical to Dump now. Breaks DESIGN.md's One Green Rule and PRODUCT.md "what is irreversible is never staged as reversible". Fix: libs/ui Button color='error'. Command: /impeccable polish
- [P1] The import warning shows only the losing side. Fix: read manifest.json before confirming and show the incoming counts and date (owner decision, out of the validated contract). Command: /impeccable harden
- [P2] Settings sidebar clips the Data link at 1440x900 (nav overflowY auto, 39 px below the visible area, under the footer). Fix: scroll the active NavLink into view. Command: /impeccable layout
- [P2] Restoring a dump already listed needs download plus re-upload. Fix: a Restore action per row (owner decision). Command: /impeccable shape
- [P2] Mobile dump rows 165 px tall: wrapped monospace name at 32 px line height. Fix: lineHeight heading on the name. Command: /impeccable adapt

## Persona Red Flags

Jordan (first-timer): "Dump now" vs "Download", which gives a file to keep; "replace these" has no antecedent; green Import reads as the safe path.
Sam (screen reader): file input announced as "Dump"; the warning appears without role=status; danger carried by color only.
Casey (mobile): Import far down under tall rows; restore goes through Files and the picker.

## Minor Observations

- Two "Jobs" links, /settings/jobs and /jobs, same label.
- Download error gives no cause.
- Empty state "No dump yet." is a bare muted line.
- Rejected: "file names disagree with their age" — the 0941 file is a test artifact from the UTC naming replaced by local time; name and cron follow the same TZ.

## Questions to Consider

- Should Import take a dump itself before replacing anything?
- Is the file picker the main path, or restoring Sunday's dump from the list?
