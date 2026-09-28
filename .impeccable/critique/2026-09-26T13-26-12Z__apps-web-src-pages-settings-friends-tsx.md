---
target: Settings/Friends wrapped row
total_score: 24
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:apps/web/src/pages/Settings/Friends.tsx"
target_fingerprint: "sha256:9cde9459d98a2e20e16181e82a6e8f5b6744167b569a93d32a0ee01aa29c2f7b"
target_path: apps/web/src/pages/Settings/Friends.tsx
timestamp: 2026-09-26T13-26-12Z
slug: apps-web-src-pages-settings-friends-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: the `<footer>` wrapped row at the foot of each guest card, redesigned after the owner rejected the first version, modelled on the job row of `Jobs.tsx`.

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No feedback while a token is created beyond disabled buttons |
| 2 | Match System / Real World | 3 | Owner's words |
| 3 | User Control and Freedom | 3 | 🔄 confirms and names the loss |
| 4 | Consistency and Standards | 3 | Matches the job row; nested inside the card border |
| 5 | Error Prevention | 3 | Buttons disabled without viewer or token |
| 6 | Recognition Rather Than Recall | 2 | 🔄 meaning only in a tooltip |
| 7 | Flexibility and Efficiency | 2 | Link not openable |
| 8 | Aesthetic and Minimalist Design | 3 | Dense, no decoration |
| 9 | Error Recovery | 3 | Inline retry, toast carries the link on clipboard failure |
| 10 | Help and Documentation | n/a | Admin-only settings |
| **Total** | | **24/36** | Good |

Detector: CLI `[]`; browser findings all pre-existing or false positives (skipped-heading matches the job row h5). Measured values equal the job row: border #333 1px, radius 4px, 42px, title cell #121212 Fira Code 16px, 40×40 buttons. Disabled effective contrast 4.46:1 (exempt).

## Priority Issues
- **[P1] Box inside a box**: the row draws its own border 16px inside the card border. Fix: flush with the card bottom, top border only.
- **[P1] Mobile truncation hides the token**: 172px value cell shows `https://localhost:4…`. Fix: path only on mobile; let muted states wrap.
- **[P2] Disabled emoji buttons look enabled**: opacity .5 on colour emoji. Fix: add grayscale.
- **[P2] 📋 creating a link is not said**: "No link yet". Fix: "No link yet, 📋 creates one".
- **[P3] Heading and live region**: h5 inherited from Jobs; add aria-live on the value.

## Minor Observations
- 40px targets and native focus ring inherited from Jobs.
- Delete button dominates the card (out of scope).
