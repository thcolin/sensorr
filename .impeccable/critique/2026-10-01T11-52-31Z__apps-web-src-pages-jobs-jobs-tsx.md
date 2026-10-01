---
target: Jobs page stop on a running job
total_score: 23
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/jobs-stop/apps/web/src/pages/Jobs/Jobs.tsx"
target_fingerprint: "sha256:d24ceab33f21b90d1c4d1b5434b3a93a0376e01d0abc6f48c88977e8da61bb52"
target_path: /Users/thcolin/orca/workspaces/sensorr/jobs-stop/apps/web/src/pages/Jobs/Jobs.tsx
timestamp: 2026-10-01T11-52-31Z
slug: apps-web-src-pages-jobs-jobs-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

Scope: the stop on a running job's dot (`JobState`, job row of `/jobs` and hero of each job view), the confirm before a start in the Start a job palette, the mobile Jobs drawer without its close button. Live on https://localhost:4443/jobs with a real `refine movies` job running.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | After a confirmed stop the dot does not change until the job's `done` event; the toast says "Loading..." |
| 2 | Match System / Real World | 4 | Record dot to stop square is the VCR idiom |
| 3 | User Control and Freedom | 2 | Mobile drawer: the knob only reacts to a drag, the backdrop does nothing on mobile |
| 4 | Consistency and Standards | 2 | `grayDarkest` is the disabled grey (DESIGN.md:609), destructive is Signal Red |
| 5 | Error Prevention | 3 | Confirm names the job and id; nothing blocks a second stop while the first is pending |
| 6 | Recognition Rather Than Recall | 2 | On touch nothing says the dot can be tapped (discreet by the owner's choice) |
| 7 | Flexibility and Efficiency | 3 | One gesture plus confirm, keyboard reachable |
| 8 | Aesthetic and Minimalist Design | 4 | No extra control in the row |
| 9 | Error Recovery | 1 | `Error during Job "x" stop`, no cause, no next step (pre-existing toast) |
| 10 | Help and Documentation | n/a | Single-admin tool, the confirm describes itself |
| **Total** | | **23/36** | |

## Design Specificity Verdict

Specific in idea, generic in finish. The dot turning into a square is the product's VCR metaphor and moves nothing in the title. The grey square reads as disabled rather than stop.

Deterministic scan: three files clean (exit 0), six advisory `design-system-radius`, one on a changed line (`JobState.tsx`, `0.125em`). Browser: stop buttons never inside an `<a>`, square 7.15:1 on the background, hit area 36 px (row, desktop) and 63 px (hero, mobile row).

## Priority Issues

- **[P1] The row link covers only the middle of the row.** `inset: 0` resolves through theme-ui's space scale, `space[0]` is 32 px: a 239×64 link in a 303×128 row. Fix: `inset: '0px'`.
- **[P1] (code review) On a dimmed row, the link sits above the stop and the summary.** `opacity: 0.5` makes the wrapper a stacking context, so the stop's `zIndex` stays inside it: a click on the dot opens the job, pills lose tooltips and touch scroll. Fix: wrapper `position: relative; zIndex: 2; pointerEvents: none`, stop and summary `pointerEvents: auto`.
- **[P1] The mobile Jobs drawer cannot be closed with assistive tech** once its X is gone: the knob is an unlabelled button with only `onPointerDown` (`libs/ui/src/atoms/Drawer/Drawer.tsx:129`).
- **[P2] The stop square reads as disabled, not destructive.** `grayDarkest`; `error` would keep the VCR red and only change the shape.
- **[P2] No pending state after a confirmed stop**, a second click opens a second confirm and a second `DELETE`.
- **[P3] Sticky hover on touch**: wrap the hover rule in `@media (hover: hover)`, as `Proposals/Card.tsx:669` does.

## Persona Red Flags

- Owner on the phone PWA: the blinking dot does not say it can be tapped; the confirm is the first sign.
- VoiceOver on mobile: the Jobs drawer has two unnamed buttons, one inert.
- Keyboard on desktop: the row link's focus ring cuts through the title (same cause as the first P1).

## Minor Observations

- Space before "?" in both confirms.
- The row link label does not say running or done; the done check has no accessible name.
- The stop hit area reaches the start of the job name.
- A dimmed row did not come back to full opacity on keyboard focus (`:focus-within` missing).

## Questions to Consider

- If the stop is meant to be discreet, why the colour of a disabled control?
- Which jobs are risky to start, and should only those confirm?
- Once stopped, does the row say so, or does it show the same check as a finished job?
