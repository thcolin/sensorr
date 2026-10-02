---
target: Settings › Update, dev channel
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/canal-dev/apps/web/src/pages/Settings/Update.tsx"
target_fingerprint: "sha256:568db234b2bb7216cff14949abe63127f1158e023d6bc50b274579bd89e02ca3"
target_path: /Users/thcolin/orca/workspaces/sensorr/canal-dev/apps/web/src/pages/Settings/Update.tsx
timestamp: 2026-10-02T16-36-50Z
slug: apps-web-src-pages-settings-update-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: the dev channel added to Settings › Update (third pill, stable / beta / dev, availability by revision), on top of the screen validated in #356.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | On dev the headline says v1.0.0-beta.1 while the status says aee0369 available; dev to beta can reload with no wait shown |
| 2 | Match system / real world | 3 | "tag of dev" next to a channel named dev |
| 3 | User control and freedom | 3 | A downgrade looks like an upgrade |
| 4 | Consistency and standards | 2 | semver in headline, footer, toast; SHA in status and button |
| 5 | Error prevention | 2 | Switch to dev is the same green primary as a stable update |
| 6 | Recognition rather than recall | 3 | revision vs latest compared by eye |
| 7 | Flexibility and efficiency | 3 | Native radios, keyboard works |
| 8 | Aesthetic and minimalist design | 3 | SHA twice on dev up to date |
| 9 | Error recovery | 3 | Failure box inherited |
| 10 | Help and documentation | 3 | Manual gives SENSORR_TAG=dev |
| Total | | 27/40 | Good |

Design specificity: the addition reuses the capsule, emoji icons and source line; nothing redrawn. Detector: 2 design-system-color (#664D06, #660606, deliberate Settings alerts, false positives); browser low-contrast white on primary (app-wide, pre-existing), tight-leading on script/style (false positive), React key warning in source() (real).

Priority issues:
- [P1] Leaving dev for beta reloads before the update: runs() compares version only, and a dev instance reports the beta's package.json version. Fix: require the channel's tag too. /impeccable harden
- [P1] Panel headline on a dev instance shows v1.0.0-beta.1 (package.json), the rest speaks SHA. Fix candidate: short revision as headline, version on the small line. Owner's call.
- [P2] Nothing marks dev as risky or leaving it as a downgrade. Owner's call.
- [P2] A dev instance without NX_SENSORR_REVISION reads "Up to date". Out of design scope: a local build has no tag.
- [P3] "tag of dev" under beta is ambiguous next to the dev channel. Fix: "tag of the dev branch". /impeccable clarify

Persona red flags: owner gets amber and a toast on every push (asked for); a first-time self-hoster sees dev as an ordinary option; 29 px mobile tap targets (pre-existing).

Minor: toast says "version" for a commit; SHA not in monospace in status/button (same as #356 versions); Manual lists 2 services (pre-existing).
