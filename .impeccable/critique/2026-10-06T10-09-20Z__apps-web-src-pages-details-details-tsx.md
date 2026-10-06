---
target: mobile details drawer
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/acces-rapide/apps/web/src/pages/Details/Details.tsx"
target_fingerprint: "sha256:24c76485fa71a16b7f1638ee08915ff673c693e895f57d0593d303f77dcae088"
target_path: /Users/thcolin/orca/workspaces/sensorr/acces-rapide/apps/web/src/pages/Details/Details.tsx
timestamp: 2026-10-06T10-09-20Z
slug: apps-web-src-pages-details-details-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Sheet transparent until the palette resolved (fixed in e5997e2a: painted from the first frame) |
| 2 | Match System / Real World | 3 | "▶ (2017)" disclosure means nothing until opened |
| 3 | User Control and Freedom | 2 | On mobile only the 36px knob closes and drags the drawer |
| 4 | Consistency and Standards | 2 | Year and genres repeated (caption removed in e5997e2a); tagline left over centered overview (fixed) |
| 5 | Error Prevention | 2 | State select and "Search for releases" live in a peek surface and write to production |
| 6 | Recognition Rather Than Recall | 2 | Long press to the page is invisible (title now links to the page) |
| 7 | Flexibility and Efficiency | 3 | Tap and long press pair well; releases two screens down |
| 8 | Aesthetic and Minimalist Design | 2 | Duplicated data, lone Plex chevron, 60-70px gaps between rows |
| 9 | Error Recovery | 2 | Logo mask had no fallback when it rendered at width 0 (fixed) |
| 10 | Help and Documentation | 1 | Nothing teaches the long press or the knob |
| **Total** | | **21/40** | Acceptable, before the e5997e2a fixes |

## Design Specificity Verdict
Authored for Sensorr in the head: poster standing out with its glow, logo masked in the palette color, theme neutrals retinted through CSS variables. Below the head, the page is transplanted as is.

Detector: 2 `layout-transition` warnings (Details.tsx `transition: margin`, pre-existing page styles). Browser scan: low contrast on text mixed toward the background (2.85:1 at mix 70 on a light palette), app green chips and "+" buttons (2.4-2.9:1), "Add to a list" placeholder #999, Plex amber chevron. Most undersized-text hits come from the library grid behind the drawer.

## Priority Issues
- [P0] Logo rendered at width 0 in the centered layout, leaving an 80px hole. Fixed: Skeleton stretches, `Details.tsx` drawer head.
- [P1] Muted text mixed toward the background fails 4.5:1 by construction. Fixed: muted text tokens take the palette's color. Open: app green, Plex amber and #999 placeholder are not retinted.
- [P1] Knob overlaps scrolled content; content scrolls into the transparent band with a hard cut. Open.
- [P1] Sheet transparent until the palette resolves. Fixed.
- [P2] Dismissal and long press undiscoverable on a phone: backdrop tap ignored on mobile, drag only from the knob. Title now links to the page; the rest is open.

## Persona Red Flags
Power user: releases start about 750px down; release names cut; a stray tap on "Search for releases" writes to production.
Phone PWA user: no back button on iOS PWA, the knob is the only exit; a swipe on the content scrolls instead of dismissing.

## Minor Observations
Rows separated by about 70px. A single rating source leaves a lone item. Wonder (2017) is archived with a Wonder Woman release (data, not design).

## Questions to Consider
Should the drawer stay read-only, with writes one long press away? Should the knob sit on a band painted with the sheet once scrolled?
