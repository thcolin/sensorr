---
target: PWA bottom bar and tab switch
total_score: 21
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/pwa-transitions/apps/web/src/layout/Header/elements/Navigation.tsx"
target_fingerprint: "sha256:d9622f65debc5a6c9a3b7279f0925094d1d969acaf6b9434bac54dc15c34825e"
target_path: /Users/thcolin/orca/workspaces/sensorr/pwa-transitions/apps/web/src/layout/Header/elements/Navigation.tsx
timestamp: 2026-09-27T11-24-56Z
slug: apps-web-src-layout-header-elements-navigation-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

# Critique: PWA bottom bar and tab switch

Score (scope: bar and tab switching): 21/32, Acceptable. Heuristics 9 and 10 n/a (no error states, no help needed).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | bar stays live; the tab's green arrives with the new page capture |
| 2 | Match real world | 2 | "Movies" opens Home (`/`), which also lists shows |
| 3 | User control | 2 | pointerdown commits, no slide-off cancel |
| 4 | Consistency | 3 | tab-bar convention kept; re-tapping the active tab does nothing useful |
| 5 | Error prevention | 2 | touch-down commit includes the iOS home-gesture zone |
| 6 | Recognition | 4 | every icon labelled |
| 7 | Flexibility | 2 | no re-tap to scroll to top |
| 8 | Aesthetic | 3 | clean, rest-state tabs barely legible |
| 9 | Error recovery | n/a | |
| 10 | Help | n/a | |

Design specificity: stock mobile tab bar, faithful to DESIGN.md §Navigation; custom glyphs carry a little character. Detector: Navigation.tsx, Body.tsx, Home.tsx clean; Jobs.tsx:378 `layout-transition` (pre-existing height transition). Browser overlay: only the five 10px labels flagged `undersized-ui-text` on the bar.

## Priority issues
- [P1] Rest-state tabs illegible: `grayDark` #333 on #0a0a0a, about 1.6:1, 10px labels. Pre-existing. Fix: a text grey at 4.5:1 with an explicit token. /impeccable colorize
- [P1] Touch-down commit without cancel covers the iOS home-gesture zone (tab padding includes safe-area-inset-bottom). Fix: ignore pointerdown inside the safe-area band, or commit on pointerup under ~10px of movement. /impeccable harden
- [P2] Active color changes only with the new capture. Measured by A as 140 ms (background tab, likely throttled); pixel screencast on a foreground tab gives the animation start 25-70 ms after touch. Fix: set active color from the pressed tab before navigate. /impeccable animate
- [P2] "Movies" is Home; re-tapping the active tab starts an empty transition instead of scrolling to top. /impeccable clarify
- [P3] No prefers-reduced-motion guard on page transitions in modules.css. /impeccable animate

## Persona red flags
- Power user: 400 ms animation on every tab, no re-tap to top, quick double tap runs two transitions.
- Low vision: 1.6:1 rest contrast, no :focus-visible on the bar, aria-current does not follow the green (Movies green on /movie/library while its link is /).

## Minor observations
- Default -webkit-tap-highlight-color stacks on the ripple on WebKit.
- Labels 10px vs iOS 11pt.

## Questions
- Why animate between sibling tabs at all, when iOS cuts instantly?
- Is the first tab Home or Movies?
- Should a touch-down tab bar know where the iOS home gesture starts?
