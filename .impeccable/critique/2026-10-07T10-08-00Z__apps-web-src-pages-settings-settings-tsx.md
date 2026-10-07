---
target: Settings sidebar menu
total_score: 20
max_score: 32
na_heuristics: 5,10
p0_count: 0
p1_count: 1
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/settings-menu/apps/web/src/pages/Settings/Settings.tsx"
target_fingerprint: "sha256:22df8fe95954f0c94842f1446e82e13f65b701b2454cb20d2f209fd0f6499e27"
target_path: /Users/thcolin/orca/workspaces/sensorr/settings-menu/apps/web/src/pages/Settings/Settings.tsx
timestamp: 2026-10-07T10-08-00Z
slug: apps-web-src-pages-settings-settings-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Active entry clear and kept in view; SYSTEM group fully below the fold at 1440x900 |
| 2 | Match System / Real World | 3 | Schedule and Backup name their pages and end the clash with the top nav's Jobs |
| 3 | User Control and Freedom | 2 | /settings/jobs and /settings/data render an empty pane (no redirect, owner decision) |
| 4 | Consistency and Standards | 3 | Same grouped pattern desktop and mobile; group label is an h2, same level as each page title |
| 5 | Error Prevention | n/a | Navigation only |
| 6 | Recognition Rather Than Recall | 3 | Groups help scanning; hidden fourth group |
| 7 | Flexibility and Efficiency | 2 | Old URLs dead, no jump to a group |
| 8 | Aesthetic and Minimalist Design | 3 | Quiet, two alignment columns (h1/titles at 32px, entries at 40px) |
| 9 | Error Recovery | 1 | Dead old URL gives an empty pane |
| 10 | Help and Documentation | n/a | No help surface |
| **Total** | | **20/32** | **Acceptable (62%)** |

## Design Specificity Verdict

LLM: grouped settings list, native to the app's own sidebar; titles take the heading font and sit on the h1 column, entries inset 8px. Mobile becomes a grouped list with one card per group. Detector: CLI clean (0 findings). Browser: 4 `undersized-ui-text` on the 10px group titles (floor 11px); active entry white on #01d076 2.0:1 and footer tagline 1.6:1, both pre-existing; rest of the findings belong to page content, not the menu. False positives: `tight-leading` on injected script/style, `clipped-overflow-container` on the nav scroll container.

## Priority Issues

- [P1] SYSTEM group below the fold at 1440x900, no scroll cue. Nav 507px for 686px of content. Fix options: bottom fade when overflowing; footer inside the scroll on desktop; smaller entries; or accept. Changes the look: owner decides.
- [P2] Old URLs /settings/jobs and /settings/data render an empty pane. Owner decided no redirect.
- [P2] Title gray 2.61:1 in light mode. Owner decided grayDarkest as is.
- [P2] Group labels are h2: heading outline lists App, Download, Services, System at the page title's level, and role=group + aria-labelledby announces them twice. Fix: label as span with the same id, aria-label on nav. No visual change.
- [P3] Mobile list opens scrolled to the bottom (column-reverse scroll origin), first group title off-screen. Pre-existing.

## Persona Red Flags

Alex: dead old bookmarks; SYSTEM hidden at 900px; focus ring clipped on the right by overflowX hidden. Sam: doubled heading/group announcement; unnamed nav; light titles 2.61:1; active entry 2.04:1 (pre-existing).

## Minor Observations

- scrollIntoView({ block: 'nearest' }) brings a group's first entry to the nav top and leaves its title hidden; scrollMarginTop on the links keeps it.
- '>div:first-of-type>h2' paddingTop [12, 12] can be 12.
- Component names JobsSettings / DataSettings kept, owner decision (out of scope).
- Titles 10px, under the detector's 11px floor; size set by the owner's chosen idiom.

## Questions to Consider

- Should Policies, the screen the product is about, be where /settings lands?
- Would 18px entries recover the hidden SYSTEM group without touching the titles?
