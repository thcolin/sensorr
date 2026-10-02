---
target: Calendar filter panel, Credits billing badge and Duration
total_score: 17
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/finales-seuils/apps/web/src/pages/Calendar/Calendar.tsx"
target_fingerprint: "sha256:3f489d9e31635730c6b8d771c75cc936b97ba57963feda3adc7fc3c5306d6c9c"
target_path: /Users/thcolin/orca/workspaces/sensorr/finales-seuils/apps/web/src/pages/Calendar/Calendar.tsx
timestamp: 2026-10-02T21-48-01Z
slug: apps-web-src-pages-calendar-calendar-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: Calendar filter panel, Credits field with its new billing badge (`TOP N`), Duration field now starting at 40 min. Live on real Cortex data, 1440×900 and 390×844.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Value always visible; Duration never says unknown runtimes are kept |
| 2 | Match System / Real World | 2 | `TOP 10` carries no noun (cast, billed); `ALL` can read as all departments |
| 3 | User Control and Freedom | 1 | Click on the "Credits" title cycled the badge instead of resetting (fixed in 45cde148); cycle is one-way |
| 4 | Consistency and Standards | 2 | Same look as `OR`, but a focusable button; button inside a `<label>` (fixed in 45cde148) |
| 5 | Error Prevention | 2 | Disabled when Acting unchecked; accidental cycle from the title row (fixed) |
| 6 | Recognition Rather Than Recall | 1 | Meaning only in `title`: none on touch, slow on desktop |
| 7 | Flexibility and Efficiency | 3 | One key press cycles; no direct pick |
| 8 | Aesthetic and Minimalist Design | 3 | No extra row, reuses the panel badge |
| 9 | Error Recovery | n/a | No error state in this panel |
| 10 | Help and Documentation | 1 | `title` only; disabled reason not said |
| **Total** | | **17/36** | Poor-to-Acceptable band (47%) |

## Design Specificity Verdict
LLM: authored for the product in look (exact reuse of the `OR`/`AND` badge), generic in copy (`TOP 10` without noun).
Deterministic scan: CLI 0 findings on Calendar.tsx, Options.tsx, FilterKnownForDepartment.tsx. Browser overlay: 201 page-wide, panel findings pre-existing (white on #01d076 at 2.0:1, 9px range labels "40m"/"4h"). `text-occlusion` and `tight-leading` are false positives (open panel, injected probe).

## Priority Issues
- [P1] Title click (whole row, `flex: 1`) cycled the badge and lost the field reset. Fix: label row as `div`. Done in 45cde148, verified live.
- [P1] Meaning only in `title`, invisible on touch. Fix: put the noun in the badge text or a caption under Acting. /impeccable clarify
- [P2] Badge on the field header while it acts on Acting only. Thomas validated the header placement on 02/10 against the Acting row variant: kept.
- [P2] Touch target 54×20 px on mobile. Fix: invisible hit area or min-height on coarse pointers. /impeccable adapt
- [P3] Duration `(40m-4h+)` does not say unknown runtimes are kept. /impeccable clarify

## Persona Red Flags
- Alex: one-way cycle, no reverse; title click ruined the threshold (fixed).
- Sam: button accessible name probably took the label text inside `<label>` (structure fixed); disabled reason not exposed; panel contrast 2:1 pre-existing; range thumbs unnamed, pre-existing.
- Casey: tooltip unreachable; 20 px high target.

## Minor Observations
- `with_credits_order` still serialized while Acting is unchecked.
- No hover style beyond the cursor, same as `OR`.
- 8 of 12 departments at `(0)`, pre-existing.

## Questions to Consider
- Do five values earn their place over Top 10 / All?
- Could the card show the billing ("#14 in cast") instead of a threshold?
