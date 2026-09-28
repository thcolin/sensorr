---
target: Artworks picker, title logo, season poster
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-plex-artworks/apps/web/src/components/Artworks/Artworks.tsx"
target_fingerprint: "sha256:1a0c03c081945a97edea46163770fe96d353e0716c888c0d5a7c2fa71e9bc005"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-plex-artworks/apps/web/src/components/Artworks/Artworks.tsx
timestamp: 2026-09-28T18-34-40Z
slug: apps-web-src-components-artworks-artworks-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Loading is a "…" counter over empty sections |
| 2 | Match System / Real World | 3 | Source names stand in for a language |
| 3 | User Control and Freedom | 2 | Escape / outside click drop pending picks silently |
| 4 | Consistency and Standards | 3 | Counter redone next to CommandTabs, legend without separators |
| 5 | Error Prevention | 3 | Link and Apply guarded |
| 6 | Recognition Rather Than Recall | 3 | Two pasted links look the same |
| 7 | Flexibility and Efficiency | 1 | 376 tab stops before the pane |
| 8 | Aesthetic and Minimalist Design | 3 | Three nested green frames when all change |
| 9 | Error Recovery | 2 | "nothing changed" when Plex did write |
| 10 | Help and Documentation | n/a | single expert user |
| Total | | 22/36 | Acceptable |

## Priority Issues
- [P0] Pane is not a dialog: no focus move, trap or return (Artworks.tsx Picker, Pane). /impeccable harden
- [P1] Preview misrepresents: cross-origin TMDB logos taint the canvas so the preview never applies the legibility filter the page will; "current" comes from Sensorr's copy, not Plex's selected candidate. /impeccable harden
- [P1] False error: a failed Sensorr save after a Plex write says "nothing changed" (Artworks.tsx apply). /impeccable clarify
- [P1] Illegible text: 8px labels (contract says 0.6875em), LinkEmpty ~1.6:1. /impeccable typeset
- [P2] Sticky offset 8px off (--artworks-preview 15em vs 232px). /impeccable polish

## Persona Red Flags
- Desktop admin: unusable from the keyboard (P0); fr label 8px; sets above fr row, no language.
- Phone: Close 20x22, drawer badge 32x32, inputs 38px; badge absent until artworks load.

## Minor Observations
- Dark colored logos stay unreadable with a 1px halo (tone.ts saturation gate).
- Season poster sticky never sticks (Seasons.tsx).
- Link field active while Plex is down; "No MediUX set" shown when MediUX errored.
- Thumbnails have no useful accessible name; no hover state.
- Detector: 4 advisory `1em` radii on new lines (codebase norm, missing from DESIGN.md); 2 pre-existing layout-transition warnings.

## Questions to Consider
- Should pending picks survive or confirm before Escape?
- Do textless images deserve their own row?
