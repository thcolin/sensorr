---
target: Discover, Hide Unknown and keyword defaults
total_score: 21
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-tmdb-curated-content/apps/web/src/pages/Discover/Discover.tsx"
target_fingerprint: "sha256:575e2481e73fa60c883ca5bb00022691ffc3d40eb1edec39c41d098461c5b492"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-tmdb-curated-content/apps/web/src/pages/Discover/Discover.tsx
timestamp: 2026-09-30T15-20-37Z
slug: apps-web-src-pages-discover-discover-tsx
closed: true
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

Scope: Discover default curation, `Hide Unknown` in the filters aside (under Vote Count) and 11 prefilled `Keywords (without)` chips. Rest of the screen judged only as context.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Defaults hide movies while the toggle reads "Show Filters" and Results `∞`; nothing on the grid says anything is hidden |
| 2 | Match System / Real World | 2 | "Unknown" next to "Hide Library" reads as "not in my library"; the rule is "old and barely voted on" |
| 3 | User Control and Freedom | 3 | One checkbox, chips with ×; no way back to the curated keyword list once cleared |
| 4 | Consistency and Standards | 2 | Label in body face without emoji, hint in sans 12px, next to emoji + heading-face labels + mono range hints |
| 5 | Error Prevention | 3 | Nothing destructive; overlap with the Vote Count slider unexplained |
| 6 | Recognition Rather Than Recall | 2 | Thresholds only in the hint, inside the panel; keyword defaults unexplained |
| 7 | Flexibility and Efficiency | 3 | Fixed thresholds (`libs/tmdb/src/utils.ts:38`) |
| 8 | Aesthetic and Minimalist Design | 3 | 11-chip wall about 180px tall |
| 9 | Error Recovery | n/a | No error state added |
| 10 | Help and Documentation | 2 | Hint helps, keyword curation unexplained |
| **Total** | | **21/36** | **Acceptable (58%)** |

## Design Specificity Verdict

LLM: half authored. Prefilled chips reuse the real `Select` multi-value; `Hide Unknown` is a bare `Option` plus a loose `<small>` in a column where every field has emoji, bold heading label and mono hint (`Discover.tsx:203-213`). The default state hides movies without saying so, against DESIGN.md "every control says its state before you touch it".

Deterministic scan: `impeccable detect` returns `[]` on `Discover.tsx` and `Aside.tsx`. Browser overlay: 293 findings on the page, 384 with the aside open, all outside the change: `undersized-ui-text` 279 (card score, year, genre at 10-10.5px), `low-contrast` white on `#01d076` (the brand green, recorded in DESIGN.md), `text-occlusion` 98 (the aside backdrop, false positive), `tight-leading` on `<script>`/`<style>` (false positive).

## Priority Issues

- **[P1] Default curation invisible outside the panel.** Why: count 0 and `∞` while two defaults drop movies. Fix: a quiet line where results are, e.g. "Hiding adult keywords and unknown movies · Show all". Command: /impeccable clarify. Owner decision.
- **[P1] Filter count rises when a filter is removed.** Why: unchecking Hide Unknown shows "Show 1 Filters" (`ControlsToggleButton.tsx:8` counts distance from `initial`). Fix: count active narrowing, or mark "curated" separately. Owner decision, app-wide meaning.
- **[P2] Hide Unknown breaks the field style of the aside.** Fix: header row like its neighbours (emoji + heading-face label), `Option` below, hint in the mono range style. Command: /impeccable polish.
- **[P2] Name overpromises; Vote Average sort still shows 1-vote 10/10 movies from 2024-2026.** Why: recency exemption (`utils.ts:38-40`). Fix: rename to the rule, and/or a vote floor when sorting by Vote Average. Owner decision.
- **[P2] Hint not announced, low contrast.** Fix: `aria-describedby` from the input to the hint id, hint at least `fontSize: 5`. Green-field contrast is a recorded brand decision. Command: /impeccable audit.

## Persona Red Flags

**Alex (power user)**: sorts by Vote Average, meets 100% single-vote movies with Hide Unknown checked, concludes the filter is broken; cannot tell how it combines with the Vote Count slider; no one-click restore of the keyword list.

**Sam (accessibility)**: hint not associated with the checkbox; tap target 342x19px on mobile (same `Option` as Hide Library); unchecked box only a thin white border on green.

## Minor Observations

- Label and hint hardcoded English, like Hide Library.
- `OR` badge on an exclusion list reads oddly.
- "1 Filters" plural bug predates the change, now more visible.
- Mobile layout fine; green top bar untouched as decided.

## Questions to Consider

- If curation is the default, is it a filter or a Discover setting the panel overrides?
- Should a vote floor follow the Vote Average sort rather than age?
- Would greying hidden movies behind a badge tell more than removing them?
