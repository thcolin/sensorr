---
target: apps/web/src/pages/Proposals/Proposals.tsx
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Proposals/Proposals.tsx"
target_fingerprint: "sha256:27c9f941a6aa178bdc42203bd37680bcdbdf76294511203578c4777d9b3a14f6"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Proposals/Proposals.tsx
timestamp: 2026-09-23T11-30-24Z
slug: apps-web-src-pages-proposals-proposals-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active card shows two sizes and a 1px bar, never the delta |
| 2 | Match System / Real World | 3 | "Same size below" (bar) and "±500 MB" (group title) name one setting twice |
| 3 | User Control and Freedom | 2 | One-step undo; ArrowDown means Skip and reorders |
| 4 | Consistency and Standards | 3 | `more` icon renders as », not ⋯; capitalize gives "Same Language" |
| 5 | Error Prevention | 2 | Unknown owned language ranked as the biggest gain; Accept all covers real upgrades |
| 6 | Recognition Rather Than Recall | 3 | Key hints in buttons; wasted on touch |
| 7 | Flexibility and Efficiency | 2 | No key to move between cards or groups without deciding |
| 8 | Aesthetic and Minimalist Design | 3 | Pills far left, size far right, ~1400px apart |
| 9 | Error Recovery | 3 | Failed send brings the card back with a toast |
| 10 | Help and Documentation | 2 | `=` `~` `→` `–` and superscripts unexplained (owner knows them) |
| **Total** | | **26/40** | **Good, with fixable gaps** |

## Design Specificity Verdict

LLM assessment: authored for this product. The decision reads as one line of before → after pills built from the Releases panel pieces, decided by one key; the card border, the group title and the green bar are reused. Weakened by the mobile layout, which pushes the diff below the fold, and by a gain order that can put first what it knows least.

Deterministic scan: `impeccable detect` on `apps/web/src/pages/Proposals` and `components/Sensorr/Proposal.tsx`, exit 0, no finding. Browser overlay, 34 findings desktop, 29 mobile; real ones: 10px year text in compact rows, heading levels skipped (h4 → h6, h3 → h6), tight leading on the wrapped release `<code>`. False positives: white on primary (documented deviation), grey secondary text (deliberate per the owner), everything inside the closed `<details>` editor, `<script>`/`<style>`.

## Priority Issues

- **[P0] Gain order ranks an unknown owned language as the largest gain.** `queue.ts` `standing()` gives a missing value the worst rank, so unparsed Plex filenames (`–` left halves) float to the top of 3116 refine proposals. Fix: an unknown `from` language scores neutral; show it as `?` in the pill. Command: polish.
- **[P1] Mobile hides the decision below the fold, Sort out of reach, release name wraps mid-token.** Fix: on mobile order title → releases → pills → the rest; size under the name; `sort_by` reachable. Command: adapt.
- **[P1] Active card has no size delta** although the contract asks for it in Fira Code. Fix: `delta(item.diff.size)` on the pill line. Command: polish.
- **[P2] Last-group batch covers real upgrades; trigger reads as » and is invisible on touch.** Fix: name the count in the menu, keep the group definition from the fiche. Command: clarify.
- **[P2] Keyboard gaps:** no way to move the active card without deciding, unnamed toggle buttons, off-palette default focus ring on gesture buttons. Command: harden.

## Persona Red Flags

- Keyboard power user clearing 3000 proposals: distrusts the order after a dozen unknown-language cards; no in-session count; ArrowDown reorders.
- Phone / PWA user: decides from a poster, the diff is off-screen; 39px buttons.
- Cautious curator: the job hash takes the top-right spot with no decision value.

## Minor Observations

- 10px year text in compact rows, below the 11px floor.
- Heading levels skip (h4 bar → h6 group, h3 card → h6 rows).
- A stray standalone `❯` Plex link before the boxed Plex icon in the externals row (inherited from Details).
- Loading skeleton nearly invisible (grayLightest ↔ grayLighter).
- The shared Chrome crashed with three tabs of this page open; one tab stays at ~60-90 MB heap and idle.

## Questions to Consider

- Should "known language improved" come before "language unknown" by default?
- Is `record` (nothing to compare) the same task as the refine diffs?
- `MULTi-VFF → MULTi-VF2` is painted green by the policy: is it a gain?
