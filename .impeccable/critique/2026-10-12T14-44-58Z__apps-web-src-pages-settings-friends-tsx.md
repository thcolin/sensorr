---
target: Settings › Friends, friend row
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/requests-par-ami/apps/web/src/pages/Settings/Friends.tsx"
target_fingerprint: "sha256:4129d66c0616f8ddd13aaa021ecefb949192e3c22d2dec379dbbec5c976b00d5"
target_path: /Users/thcolin/orca/workspaces/sensorr/requests-par-ami/apps/web/src/pages/Settings/Friends.tsx
timestamp: 2026-10-12T14-44-58Z
slug: apps-web-src-pages-settings-friends-tsx
---
Method: dual-agent (A: design review, opus · B: detector and browser, sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | pending (`disabled`) not drawn; Auto and Manuel look identical |
| 2 | Match System / Real World | 3 | 🍺 🎬 📺 are product vocabulary; Manuel/Auto abstract |
| 3 | User Control and Freedom | 3 | one gesture, revert and toast on error |
| 4 | Consistency and Standards | 2 | hover keeps grey text unlike `Déconnecté`; focus offset -2 vs +2 on `more` |
| 5 | Error Prevention | 2 | two 24px touch targets side by side on a phone |
| 6 | Recognition Rather Than Recall | 2 | meaning only in `title`, invisible on touch |
| 7 | Flexibility and Efficiency | 2 | 22 values to read to find who is on Auto |
| 8 | Aesthetic and Minimalist Design | 3 | quiet, dense, in line with DESIGN.md |
| 9 | Error Recovery | 3 | revert and named toast; FR error copy names the wrong thing |
| 10 | Help and Documentation | 1 | intro still says films only, nothing on Manuel/Auto |
| **Total** | | **23/40** | Acceptable |

## Design Specificity Verdict

Grounded: 🍺 is the requests vocabulary (Notifications, KeepInTouch, Jobs), `State` with its native select is reused, the pill takes the grey and radius of `Déconnecté`. Generic part: the Manuel/Auto pair. Detector: CLI `[]`, browser overlay 18 findings at 1440 and 15 at 390, none in a friend row (shell, settings nav, invitation form).

## Priority Issues

- [P1] Auto invisible when scanning: same colour and weight as Manuel (`Friends.tsx` `value`). Fix: light Auto only (`text` colour or a dot). Command: /impeccable polish
- [P1] Touch targets 80x24 touching each other at 390. Fix: 32px height on phones or an enlarged hit area. Command: /impeccable adapt
- [P2] Meaning hidden in `title`; intro `settings.friends.intro` says films only. Fix: one sentence in the intro naming 🍺, Manuel, Auto. Command: /impeccable clarify
- [P2] Hover 4.43:1 fails AA: text stays `grayDarkest` on `grayDark`. Fix: `color: 'text'` on hover like `disconnected`. Command: /impeccable polish
- [P3] Pending state not drawn, pointer cursor on disabled select. Fix: opacity 0.4 and default cursor like `more`. Command: /impeccable polish

## Persona Red Flags

Owner with 11 friends: cannot see who is on Auto at a glance. Owner in six months on a phone: no visible key for 🍺 Manuel. Motor impairment: 24px adjacent targets.

## Minor Observations

Dead i18n keys `settings.friends.accept.movie` and `.tv`. Avatar centred while chevron and remove sit at the top on phones. FR `label` "demandes répondues" is shaky; FR `error` says the requests failed instead of the setting. "Manuel" vs "à la main".

## Questions to Consider

Show Manuel at all, or only light Auto? Confirm the first Auto? One setting per friend instead of per media?
