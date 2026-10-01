---
target: Settings Friends and Mail
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Settings/Friends.tsx"
target_fingerprint: "sha256:edcf176b1bd0a7cbb61fbdc07111b073e4de1fdf9341f1351910d4082446b6db"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Settings/Friends.tsx
timestamp: 2026-10-01T11-50-01Z
slug: apps-web-src-pages-settings-friends-tsx
---
Method: dual-agent (A: design review · B: detector and browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | A disconnected friend looks calmer than a linked one; the last wrapped mail date only lives in a tooltip |
| 2 | Match System / Real World | 3 | Clear new copy; old typos remain in the intro (out of scope) |
| 3 | User Control and Freedom | 1 | ✉️ mails a friend in one tap, no confirm, even after they stopped the reminders |
| 4 | Consistency and Standards | 2 | Jobs gates the mail job on `mail.host` only, Friends on host + sender + address |
| 5 | Error Prevention | 2 | Address of Sensorr pre-filled with the tab origin, a LAN tab saves a LAN address |
| 6 | Recognition Rather Than Recall | 2 | Two identical ✉️ in one card, only the row tells them apart |
| 7 | Flexibility and Efficiency | 3 | Invite is one field and Enter |
| 8 | Aesthetic and Minimalist Design | 3 | In-system; the Mail intro repeats the toggle list |
| 9 | Error Recovery | 3 | SMTP errors shown verbatim |
| 10 | Help and Documentation | 3 | "Once a week" claims a cadence the job cron owns |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict
LLM: the plex row reuses the wrapped row's grammar and its status line is specific to this product; the Mail page is a competent but interchangeable SMTP form. Detector: CLI clean on both files; browser findings are shared shell and theme tokens (white on primary 2.0:1, recorded deviation in DESIGN.md), plus skipped heading levels (h3 to h5 in friend rows, pre-existing pattern of the wrapped row).

## Priority Issues
- [P1] On mobile the disconnected status is cut after "m…": `[data-prose]` spans keep `nowrap`. Fix: wrap on mobile like `[data-muted]`.
- [P1] ✉️ sends without confirm, even to a friend who stopped the reminders. Fix: confirm() on both ✉️, saying so when the friend unsubscribed.
- [P2] A dead token carries no error color. Fix: `error` on the plex row label when disconnected.
- [P2] "Once a week" is the job cron's, and Jobs enables the mail job on `mail.host` alone. Fix: defer to the mail job in the copy, gate Jobs on the same three fields.
- [P3] The invitation leaves no trace. Fix: a muted line with the last address invited.

## Persona Red Flags
Thomas on the phone PWA: truncated status, two ✉️ 40px apart, no confirm. Thomas on a LAN tab: pre-filled LAN address goes into every friend's links. Monique who stopped the reminders: gets one anyway.

## Minor Observations
Disabled ✉️ barely differs from enabled; 🔌 low contrast on its cell; no busy state on the pressed ✉️; wrapped row hides its mailed date.

## Questions to Consider
Should ✉️ reconnect respect the friend's unsubscribe? Should a disconnected friend's card come first?
