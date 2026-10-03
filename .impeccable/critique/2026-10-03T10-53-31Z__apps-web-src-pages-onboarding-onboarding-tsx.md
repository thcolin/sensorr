---
target: onboarding
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/onboarding/apps/web/src/pages/Onboarding/Onboarding.tsx"
target_fingerprint: "sha256:db9224d10fb83072842c168a738b4f3032c53b97d8001811a9eb93dea7a4214c"
target_path: /Users/thcolin/orca/workspaces/sensorr/onboarding/apps/web/src/pages/Onboarding/Onboarding.tsx
timestamp: 2026-10-03T10-53-31Z
slug: apps-web-src-pages-onboarding-onboarding-tsx
---
Method: dual-agent (A: design review, opus · B: detector and browser, sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Steps dots unlabeled, no a11y (`Steps.tsx:12-14`), y position shifts per step |
| 2 | Match System / Real World | 3 | Right domain words; Settings copy typos ("to works", "usenest", "Fullfill", "regulary") |
| 3 | User Control and Freedom | 1 | Reload resets to Welcome; app links inside the wizard bounce back to step 0 |
| 4 | Consistency and Standards | 3 | Fields reuse Settings; two green primaries on the Plex step; recap prints "Your Plex Server" |
| 5 | Error Prevention | 1 | Indexer or policy typed but not added with + is lost on Continue; job play buttons before any indexer |
| 6 | Recognition Rather Than Recall | 3 | Each step explains itself in place |
| 7 | Flexibility and Efficiency | 2 | 9 screens, no deep link to a step |
| 8 | Aesthetic and Minimalist Design | 2 | Emoji repeated (panel and mosaic); Blackhole, Jobs, Friends are long Settings walls |
| 9 | Error Recovery | 2 | TMDB refusal inline and clear; empty key falls back to native validation |
| 10 | Help and Documentation | 3 | TMDB, Jackett, Prowlarr, Torznab, cron links in place |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict

Authored for Sensorr: poster mosaic, `[X] + 🍿` emblem, VCR line, uppercase Warning titles, Settings copy. The panel is Settings pasted in a centered column. Detector: CLI clean on Onboarding.tsx and KeepInTouch.tsx; overlay flags primary button contrast 2.0:1 (known deviation in DESIGN.md, out of scope), tight leading 1.2 on the warning and tagline, Continue 38px tall on mobile. False positives: dark-glow on body, tight-leading on script and style nodes.

## Priority Issues

- **[P0] Recap and in-wizard app links bounce to Welcome.** `/settings/*`, `/jobs/<id>` and `/movie/requests` go through `withOnboarding` (`App.tsx:72`) while `onboarding.done` is unset and no indexer exists. Fix: recap rows navigate after saving `onboarding.done`, or stay text; the migrate link and the Jobs Plex warning do not leave the wizard; persist the step across a reload. Command: harden.
- **[P1] Recap claims ✅ for steps that set nothing; a typed create row is lost.** Fix: derive the recap from config (`znabs`, `policies`, `plex.token`, `mail.host`); on Continue, a filled create row is appended or blocks. Command: harden, clarify.
- **[P1] Blackhole, Jobs, Friends + Mail are full Settings walls.** Fix: essentials first, advanced behind a disclosure (Shows paths, job schedules, Mail's sent-on-their-own). Command: distill.
- **[P2] Mute, moving progress; redundant emoji; focus lost.** Fix: label the dots for assistive tech, pin them to the top of the panel, shrink the panel emoji, move focus to the step title on change. Command: layout, audit.
- **[P3] Copy typos inherited from Settings intros.** Fix at the source. Command: clarify.

## Persona Red Flags

- First-time self-hoster without Jackett: continues on an empty Indexers, gets ✅, the recap link loops to Welcome.
- 0.x migrant: import status sits outside the flow, its Jobs link opens the onboarding again.
- Mobile PWA: reload restarts at Welcome; indexer Name squeezed to about 60px.

## Minor Observations

- Region defaults to United States, not the browser language.
- TMDB key field is `type='text'` (inherited).
- `Steps` hard-codes `#fff` for the active dot.

## Questions to Consider

- Should the wizard end after TMDB on a checklist hub that deep-links into the optional steps?
- Should Jobs state the schedule instead of asking?
