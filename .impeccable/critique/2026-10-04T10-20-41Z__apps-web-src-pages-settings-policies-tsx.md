---
target: Policies sandbox panel
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/bac-a-sable/apps/web/src/pages/Settings/Policies.tsx"
target_fingerprint: "sha256:c9a9b669561402edadcf909768514aaf7e3424545b3cc881f59e262fbc16d6b9"
target_path: /Users/thcolin/orca/workspaces/sensorr/bac-a-sable/apps/web/src/pages/Settings/Policies.tsx
timestamp: 2026-10-04T10-20-41Z
slug: apps-web-src-pages-settings-policies-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | No count of valid / withdrawn / rejected, no mark on the release that would be picked |
| 2 | Match system / real world | 3 | "Withdrawn by policy (znab=TPB)" blames the policy for an indexer the sandbox assigned |
| 3 | User control and freedom | 3 | Read-only, clean switching; open on a phone, 6300 px tall, collapsible only at the top |
| 4 | Consistency and standards | 3 | Same rows as the search; the disclosure copies the Rules summary but not its box, triangle 8 px off |
| 5 | Error prevention | 2 | Round-robin indexer hides designed cases (HOLLOW 0 seeders shows znab=TPB); selection held by index |
| 6 | Recognition over recall | 2 | +points only in hover titles; comparing two policies relies on memory |
| 7 | Flexibility and efficiency | 2 | No count, no jump, 44 rows on every switch |
| 8 | Aesthetic and minimalist design | 3 | Calm on desktop; ✨ repeated, 🚨 twice per withdrawn row |
| 9 | Error recovery | 3 | Every invalid row names axis=value; on mobile the znab pill is hidden |
| 10 | Help and documentation | 3 | Clear intro line, set at 10.5 px |
| **Total** | | **26/40** | Acceptable |

## Design Specificity Verdict
LLM: specific, because it reuses the app's own `Release` row; weaknesses are in the sample data and the framing, not the look.
Detector: 1 finding, `design-system-font` at `Release.tsx:75`, pre-existing (line untouched). Page-wide overlay: 71 hits, not attributable to the panel (Rules, header, shared rows). Select control shows no computed focus ring (programmatic focus, to confirm). No horizontal overflow at 390.

## Priority Issues
- [P1] Round-robin indexer drives verdicts and hides designed cases (`sandbox.ts:57`): 11 of 25 withdrawals under MULTi-VF2 are znab=..., HOLLOW's "No seeders" never shows. Fix: neutral indexer for samples, one or two rows dedicated to the znab rule. /impeccable harden
- [P1] Nothing states the outcome: no counts, no mark on the picked release, ties unexplained. Fix: one line under the Select, or a break between valid and invalid rows. /impeccable clarify
- [P2] Disclosure not framed like Rules (no box, 8 px misaligned), "Policy" label louder than "Sandbox" summary, intro 10.5 px (`Policies.tsx:108,141-162`). /impeccable polish
- [P2] Phone: titles clipped mid-token, znab pill hidden while reasons cite it, +points hover-only, 6300 px open. /impeccable adapt
- [P3] Selection by index drifts after reorder/remove (`Policies.tsx:94,97`); `sandboxOf` re-parses 88 releases on every render; empty-name option. /impeccable harden

## Persona Red Flags
- Owner on desktop: sees the REMUX "withdrawn by znab=TPB", may fix a policy that is not broken; compares policies from memory.
- Owner on the PWA: no points, no indexer, cut titles, Save 15 screens down.
- First-time onboarding: "Sandbox" says nothing of fake data / nothing saved until opened.

## Minor Observations
- Select menu paints under the znab pills of the rows behind it (stacking).
- react-select input has no accessible name tied to its label (libs/ui-wide).
- Generated titles (BLURAY) next to raw ones (BluRay) on 🗑️ rows.
- Switching policy keeps the scroll position mid-list.

## Questions to Consider
- Is the real output one sentence ("picks X, withdraws N") with the rows as evidence?
- Should a sample's indexer ever be anything but neutral?
