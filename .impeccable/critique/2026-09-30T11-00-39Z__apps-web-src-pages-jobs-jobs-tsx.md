---
target: Jobs sidebar
total_score: 22
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Jobs/Jobs.tsx"
target_fingerprint: "sha256:6b34ee048605bf3f5e9e1db436d04a0646848ce56fe65fde4c7c97dadd068eaa"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Jobs/Jobs.tsx
timestamp: 2026-09-30T11-00-39Z
slug: apps-web-src-pages-jobs-jobs-tsx
closed: true
---
# Critique: Jobs sidebar, Running section and piles (411858cb)

Two isolated sub-agents: A design review (live app 1440x900 and 390x844, real Cortex data), B detector and browser overlay. Mode: Operate.

## Design specificity
Specific to Sensorr: piles by day and by what the card says fit a job that runs every ten minutes. The stacked-sheet look is the generic notification stack, and its tonal step (4% on 0%) reads as two hairlines rather than paper.

## Heuristics (22/36, #5 n/a)
| # | Heuristic | Score |
|---|---|---|
| 1 | Visibility of system status | 3 |
| 2 | Match with real world | 3 |
| 3 | User control and freedom | 2 |
| 4 | Consistency and standards | 2 |
| 5 | Error prevention | n/a |
| 6 | Recognition rather than recall | 2 |
| 7 | Flexibility and efficiency | 2 |
| 8 | Aesthetic and minimalist | 3 |
| 9 | Recover from errors | 3 |
| 10 | Help and documentation | 2 |

## Priority issues
- P1 `×N` toggle drawn as a pill (`borderRadius: 1em`), against the Pill-Is-A-State Rule (DESIGN.md:529); 43x21 px, under 24 px and far from 44 px on touch; `grayLight` on `grayLighter` barely outlines it. Fix: `0.25em`, 24 px box, 44 px on mobile, 1px `grayDark` border.
- P1 The pile frame, sheets and toggle render at 100% while the card content is at 0.5 when unselected: an idle pile outshines a card that did something. Fix: dim the frame with the content.
- P1 A selected job inside a folded pile is invisible (deep link, notification). Fix: unfold the pile that holds the selected job.
- P2 Unfolded, the run loses its frame and the toggle label does not change: nothing marks where the run ends. Fix: keep a frame around the unfolded run, show the state on the toggle.
- P2 `paddingX: 10` on the stacked card shifts emoji and title 7px against plain cards and between folded and unfolded. Fix: compensate with a negative margin.

## Persona red flags
- PWA, one thumb: the 21 px toggle sits in the corner of a card that is itself a link.
- Keyboard: each pile adds a tab stop.

## Minor observations
- Mobile head selector repeats the Running card.
- Sticky day header shares `grayLighter` with the pile.
- Second sheet at 60% on 6 px is invisible at 1x.

## Detector
CLI exit 2: `layout-transition` line 395 pre-existing; `design-system-radius` line 499 on the new toggle (same as P1). Browser overlay: DOM-wide `undersized-ui-text` and `low-contrast` from the shell, not attributable to this diff; `text-occlusion` flaky.

## Rejected
- `⏳ pending` counted as idle: the owner asked for exactly these runs to be grouped; the head card still shows the pending pill.
- `all` counting rows while command tabs count jobs: pre-existing, contract keeps it.
