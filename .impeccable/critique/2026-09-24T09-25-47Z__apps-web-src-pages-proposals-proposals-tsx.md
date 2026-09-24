---
target: Swaps filters pane and Min. freed
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/swaps-filters/apps/web/src/pages/Proposals/Proposals.tsx"
target_fingerprint: "sha256:9a9dd2c0d4ca8bb4c5bf1919a348ce2616255e75cb8e5fdfd9aa9155a5e3a8cd"
target_path: /Users/thcolin/orca/workspaces/sensorr/swaps-filters/apps/web/src/pages/Proposals/Proposals.tsx
timestamp: 2026-09-24T09-25-47Z
slug: apps-web-src-pages-proposals-proposals-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Heuristics: 20/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 2 | No count before Apply; "Show 1 Filters" counts axes, plural bug (pre-existing) |
| 2 | Match real world | 2 | "Source" means the 📀 group, the 💽 axis and "Source size" |
| 3 | User control | 3 | Cancel/Apply work; undoing a tag takes up to three clicks |
| 4 | Consistency | 2 | Slider `500 MB+` vs group `ignored (<500 MB)` |
| 5 | Error prevention | 1 | Heavier MULTi upgrades land under "Refuse all N" |
| 6 | Recognition | 2 | Tag state reads only from its row and a shade of green |
| 7 | Flexibility | 1 | No keyboard, no search in 60 languages / 110 flags |
| 8 | Minimalism | 2 | ~300 px hero, Language 1.8 screens down |
| 9 | Error recovery | 2 | "No match" does not name the axis |
| 10 | Help | 3 | Cycle explained in the hero, marks carry a title |

## Specificity
Reuses oleoo vocabulary and Library's control; layout generic, seven equal tag walls. Detector CLI clean (exit 0); 3 design-system-radius in the balance meter (Proposals.tsx:192,219,248, from 4755b03, out of scope). Browser: text-occlusion x17 = pane backdrop (false positive); low-contrast x258 = white on primary, known in DESIGN.md; clipped-overflow-container on the pane form, unverified; closed-pane pass not run (shared Chrome died).

## Priority issues
1. [P1] The ignored group keeps "Refuse all" while it now holds heavier MULTi upgrades (61 VOSTFR→MULTi-VFF at 500 MB+). Fix: drop Refuse all too, or keep it on the pre-strict safe subset. /impeccable harden
2. [P1] 💿 fill primaryDarker is 1.39:1 against the pane, white on it 2.84:1; 📀 accentDarkest 5.69:1. Fix: a 💿 fill at 4.5:1+. /impeccable polish
3. [P2] "Source" has three meanings. Fix: rename the groups or the size ranges. /impeccable clarify
4. [P2] Language is sixth of seven under a large hero. Fix: one-line hero, Language right under the sizes. /impeccable distill
5. [P2] A tag changes row on each click (RuleSortableSelect, shared with Library and policies). /impeccable polish

## Personas
- Alex: no keyboard; two clicks per target tag with a moving tag; Language far down.
- Sam: tags not focusable, no role, state by colour only (pre-existing component).

## Minor
- 🔀 hero emoji reads as shuffle.
- 📀 matches any owned release, the row shows the baseline one (rule from Library).

## Already decided, dropped
Show only present values (Thomas: all), exempt language upgrades from the threshold (Thomas: strict), from→to pair builder (Thomas: rejected).
