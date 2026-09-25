---
target: Swaps report card
total_score: 21
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:apps/web/src/pages/Proposals/Card.tsx"
target_fingerprint: "sha256:45f512abc823c4e65d3c69ea2c574bda63f0a8ebd6698da693a4597865bfc2a5"
target_path: apps/web/src/pages/Proposals/Card.tsx
timestamp: 2026-09-24T17-09-54Z
slug: apps-web-src-pages-proposals-card-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: the `report` swap added in 5c12ad0 (report group first on Swaps, report line in the releases band of the open card).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The card does not show that the owned releases are already banned |
| 2 | Match system / real world | 3 | Quoted message, then who and when |
| 3 | User control and freedom | 2 | Refuse leaves a banned owned release with no replacement, unstated |
| 4 | Consistency and standards | 3 | Same columns as release rows, own vertical rhythm (margin 12, paddingY 8) |
| 5 | Error prevention | 2 | Nothing ties the complaint to the proposal's axes |
| 6 | Recognition rather than recall | 3 | Message is on the card |
| 7 | Flexibility and efficiency | 2 | Compact row shows no message (validated at wireframe) |
| 8 | Aesthetic and minimalist design | 3 | Quiet and in place, maybe too quiet |
| 9 | Error recovery | n/a | No error path added |
| 10 | Help and documentation | 1 | Nothing explains ban then re-search |
| Total | | 21/36 | Acceptable |

Design specificity: flag in the release icon column, message at the release name x (304px). Detector: nothing in the diff statically; live, low-contrast 3.45:1 and undersized 9px on the report `small`.

Priority issues
- [P1] Report meta unreadable: `username · date` at 9px, #666 on #0a0a0a, 3.45:1. Fix: grayDarkest and the message size. /impeccable polish
- [P1] Ban invisible: owned rows render as on refine though the job banned them. `Release` has a `banned` prop (components/Sensorr/index.tsx:285). Fix: pass `banned` to owned rows. /impeccable polish
- [P2] Line unlabelled for screen readers: flag aria-hidden. Fix: visually hidden "Reported by …". /impeccable harden
- [P2] Empty message renders «». Fix: guard on report.message?.trim(). /impeccable harden
- [P3] On mobile the line hugs the proposed row. Fix: tighten toward the owned block. /impeccable layout

Persona red flags
- Alex: ban not visible; only latest report; Refuse irreversible unstated (pre-existing for refine).
- Sam: 3.45:1 at 9px; unlabelled line; «» from html lang="fr" on English UI (pre-existing).

Minor: notification copy "Reported movie proposal" reads awkwardly; title uses toLocaleString().

Questions dropped by scope: filtering a proposal that misses the complaint's axis (ruled out at framing), message as card headline (contradicts validated wireframe).
