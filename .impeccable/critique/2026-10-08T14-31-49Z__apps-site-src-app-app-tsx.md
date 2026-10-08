---
score: 24
max: 36
na: 7
p0: 0
p1: 3
p2: 2
method: dual-agent
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-demo-website/apps/site/src/app/App.tsx"
target_fingerprint: "sha256:b8112ce3f0611d80716ff73fc927f7b74913aafa743c5fbeccecf218240ee57c"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-demo-website/apps/site/src/app/App.tsx
timestamp: 2026-10-08T14-31-49Z
slug: apps-site-src-app-app-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design health score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | sticky column follows the step, skeletons, Copy confirms |
| 2 | Match system / real world | 2 | release names a self-hoster knows to be impossible (`1080p.REMUX.x265`, `720p.REMUX`) |
| 3 | User control and freedom | 3 | no scroll hijack, reduced motion respected |
| 4 | Consistency and standards | 2 | step emoji differ from badges, four container widths, two focus rings |
| 5 | Error prevention | 3 | clipboard fallback selects the command |
| 6 | Recognition rather than recall | 2 | pills and scores without a legend |
| 7 | Flexibility and efficiency | n/a | one-pass landing page |
| 8 | Aesthetic and minimalist | 3 | restrained, but journey steps leave large dead zones |
| 9 | Error recovery | 3 | |
| 10 | Help and documentation | 3 | |
| **Total** | | **24/36** | applicable max 36, heuristic 7 n/a |

## Design specificity
Grounded: the poster wall, release names in Fira Code, the app's own TransitionPill and badges, oleoo parsing the drawn release. The weak point is the data inside the frame.

## Priority issues
1. [P1] Journey data contradicts the pitch: the demo indexer makes impossible names (REMUX re-encoded, 720p REMUX), oleoo puts REMUX in flags so `source` reads `?`, and the policy shown in Record is a hand-copied subset of `POLICIES[0]`, so the ranking cannot be explained from it. Fix: plausible names in `apps/web/src/demo/releases.ts`, policy written into films.json and read by the page.
2. [P1] `react-responsive-virtual-grid` heading invisible, 1.1:1 (`BuiltOn.tsx`, global h3 color wins). Fix: set the title color.
3. [P1] Hero logo 12em inside an h1 at 2em renders 384px at 390 wide, content box 416px, clipped. Fix: size the logo independent of the h1 font size.
4. [P2] Wrapped step shows a wrapped about another title while the section promises one movie; steps 3 to 5 hold one sentence in 80vh. Fix: reword the Wrapped step to what is shown, lower step height, give Archived a visible change.
5. [P2] Consistency: step emoji vs badges (✨/💎, ✂️/💍), four content widths (80em, 72em, 48em), hero CTAs without the shared focus ring.

## Detector
CLI: 2 advisory `design-system-radius` in `Bands.tsx:513,538` (phone frame, notification card). Browser: ~380 hits, mostly `buried-raster` on the fading poster wall (false positive) and `undersized-ui-text` on the app's own caption sizes inside recomposed UI (by design, DESIGN.md caption 0.625em). Real: white on primary 2.0:1 (known deviation, DESIGN.md), the grid heading 1.1:1. No horizontal overflow at 390 (scrollWidth 390).

## Minor
Policy tags background not applied (`Journey.tsx:165`); mobile pills scroll without affordance; Copy button border under 3:1; calendar months start before today; install URL wraps mid-word at 390; Backups and updates title holds two links.

Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3
