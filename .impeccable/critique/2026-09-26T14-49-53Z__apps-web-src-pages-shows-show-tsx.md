---
target: show page manual release search
total_score: 21
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/tvshows-manual-search/apps/web/src/pages/Shows/Show.tsx"
target_fingerprint: "sha256:e7914dc5313285c479951a67304cd180fb2e123bd273de10d55fa80a2351324e"
target_path: /Users/thcolin/orca/workspaces/sensorr/tvshows-manual-search/apps/web/src/pages/Shows/Show.tsx
timestamp: 2026-09-26T14-49-53Z
slug: apps-web-src-pages-shows-show-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: manual release search on the show page (ticket under the poster, search badge on season and episode rows, release drawer on a level). Diff against 1a6eb0bd.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | ZNABS progress works; no row says its level |
| 2 | Match System / Real World | 3 | S02E04 matches release names; English title mixed with TMDB French season name |
| 3 | User Control and Freedom | 2 | Esc closes; a pick fires on one click |
| 4 | Consistency and Standards | 3 | Same ticket and drawer as a movie; the ticket's ⋮ is drawn disabled |
| 5 | Error Prevention | 1 | A season pack picked from an episode search swaps owned E01-E03 silently |
| 6 | Recognition Rather Than Recall | 2 | Level inferred from the release name |
| 7 | Flexibility and Efficiency | 3 | One entry per level |
| 8 | Aesthetic and Minimalist Design | 3 | Clean desktop; lone badge line on mobile out of library |
| 9 | Error Recovery | 2 | Generic toast "Error while processing release" |
| 10 | Help and Documentation | n/a | Single expert user, tooltips |
| **Total** | | **21/36** | **Acceptable** |

## Design Specificity Verdict

LLM: specific. Reuses the movie ticket (same slot as /movie/603), the movie drawer, and the Follow badge vocabulary; badges align in one column. Weak point: the drawer stays a movie drawer and never says what a show pick does to owned episodes.

Deterministic scan: 13 CLI findings, all pre-existing (hsla 347 colors and radii in Actions.tsx, layout transitions in Details.tsx); none on the feature's lines. Browser overlays on /tv/42009, /tv/71912 and the open drawer: undersized text, low contrast in the existing drawer (⊘ ⚠ icons #333 on #000, .torrent labels #666), all from pre-existing components. Search badge 24x24, aligned with Follow, focus ring 1px grayDarkest, icon 13.9:1. Ticket's accessible name is its text "SEARCH FOR RELEASES", the longer string only its title.

## Priority Issues

- **[P1] A pick hides what it replaces**: drawer rows (components/Sensorr/index.tsx) show neither coverage nor swap; manualPickOf only computes it after the click. From S02E04 the top S02 pack replaces three owned files in one click. Fix: under each release that covers owned episodes, draw the proposal's coverage line ("replaces 3 episodes · fills E04"), reusing what Proposal renders. Command: /impeccable harden
- **[P1] No level per row**: nothing says whether a release is the episode, a season pack or the whole series; a release named S01 was reported under "whole series". Fix: a level pill per row from coverageLabel, and check levelOf on that release. Command: /impeccable clarify
- **[P2] Mobile out of library wastes rows**: UISeasons.styles.remote puts the badge on its own line (~160px per season instead of 60). Fix: keep it on the title row on mobile. Command: /impeccable adapt
- **[P2] Dead ⋮ on the show ticket**: UITicket draws the disabled right button when expandable is false. Fix: do not render it for the show ticket. Command: /impeccable polish
- **[P3] Pending proposal not marked in the drawer**: Show.tsx does not pass `proposal`; the C411 TyHD pack pending on season 2 shows as an ordinary row.

## Persona Red Flags

- Alex (power user): no shortcut to open a search; one-click pick is fine only if the swap is visible.
- Sam (accessibility): badges have aria-label and a focus ring; focus does not move into the drawer (pre-existing Drawer behavior); 1px ring is weak.
- Owner clearing the backlog: decides on language and disk gain, neither shown relative to what is owned.

## Minor Observations

- Search.tsx inset values copy the Follow select's touch target, not a scale step.
- "Releases for Saison 2": TMDB season name inside English UI.
- Search enabled on unaired episodes (contract choice).
- Round badge as an action departs from DESIGN.md "Pill-Is-A-State"; Follow already does.

## Questions to Consider

- Should an episode search list the episode releases before season packs?
- Should the drawer title name the show?
