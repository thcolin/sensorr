---
target: release name on one line
total_score: 17
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 0
p1_count: 1
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/site/src/app/sections/journey/release.tsx"
target_fingerprint: "sha256:d1a561bf9b48fd83fd683e5feb5246768efc43631fcc78166a929688d5f6f924"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/site/src/app/sections/journey/release.tsx
timestamp: 2026-10-12T08-26-16Z
slug: apps-site-src-app-sections-journey-release-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

Target: `Name` in apps/site/src/app/sections/journey/release.tsx at ed5f35bc (one line, horizontal scroll without scrollbar, faded cut edges), rendered in Journey.tsx: Record rows, Archived fileName, Refine/Report swap from and to. Shrink renders no Name.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | the fade says the name goes on; data-end follows resize and fonts |
| 2 | Match system / real world | 3 | raw release name, as in the app and an indexer |
| 3 | User control and freedom | 2 | scrolling works but nothing invites it; title is mouse-only |
| 4 | Consistency and standards | 4 | same idiom as the app's bulk bar, in every use |
| 5 | Error prevention | n/a | no input |
| 6 | Recognition rather than recall | 2 | on a phone, a swap shows two identical prefixes |
| 7 | Flexibility and efficiency | n/a | Persuade surface |
| 8 | Aesthetic and minimalist design | 3 | calm rows; the Report hero name cut at 1440 breaks it |
| 9 | Error recovery | n/a | no error |
| 10 | Help and documentation | n/a | landing page |
| Total | | 17/24 | good |

Design specificity: product-specific (Bulk.tsx mask, monospace, state colors). On narrow screens the visible part is the movie title, which the poster already shows.

Detector: release.tsx 0 findings; Journey.tsx 3 advisory design-system-radius at 925, 1233, 1240, unrelated to Name. Browser overlay: 346 page-wide findings, none mapped to Name; the two text-overflow spans (48 and 37 px) are the ellipsis spans of the bands, pre-existing.

Priority issues
- [P1] On a phone the visible part of a name is the movie title; the part that tells releases apart (source, codec, group) is hidden. Refine and Report show two identical prefixes. Fix: start the scroll at the end in Swap (and maybe Archived), scrollLeft = scrollWidth on mount, fade moves left.
- [P2] Report's struck from name keeps 204 px on a phone (32 %), because the size and the Banned mark stay whole on its line (swapFromLine). Fix: let the mark wrap on a phone, or move it onto the poster as a badge.
- [P2] Report's to name is the only one cut at 1440 (…EAC3-KIN, 812 of 918 px). Fix: one font step down for swapTo, or the end-first start of P1.

Persona red flags: phone visitor from Reddit sees the same title twice and does not know they can swipe; Radarr/Sonarr user reads group and source first, exactly what the cut hides.

Minor: the red size right after the fade in swapFrom reads as part of the name for an instant.

Questions: should a landing-page release name show the movie title the poster already carries? Is a scroll nobody triggers a feature, or should the name slide to its end once on reveal (not under prefers-reduced-motion)?
