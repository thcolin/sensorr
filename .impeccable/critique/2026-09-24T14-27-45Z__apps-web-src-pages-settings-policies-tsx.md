---
target: Settings > Policies, original language match
total_score: 24
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:apps/web/src/pages/Settings/Policies.tsx"
target_fingerprint: "sha256:e664ef66bc14b52870f925ddb02b8cb8c32fc3bcb586e8d4d872f3e17bf34e6b"
target_path: apps/web/src/pages/Settings/Policies.tsx
timestamp: 2026-09-24T14-27-45Z
slug: apps-web-src-pages-settings-policies-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser overlay)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Header badge shows the match on a collapsed card; nothing shows which policy wins on a shared language |
| 2 | Match system / real world | 3 | "Original language" is TMDB's word; badge title "Given by default" collides with the `default` badge |
| 3 | User control and freedom | 3 | Chip × and Backspace, nothing written before Save |
| 4 | Consistency and standards | 2 | Green `accent` chips mean `⭐ prefer` everywhere else on the page |
| 5 | Error prevention | 2 | Two policies can claim the same language; the lower badge claims a match that never happens |
| 6 | Recognition rather than recall | 2 | 186 languages alphabetical; flag-only badge at 390 px |
| 7 | Flexibility and efficiency | 3 | Type-to-filter, ISO code included |
| 8 | Aesthetic and minimalist | 3 | One row, one badge |
| 9 | Error recovery | n/a | No error path; unknown code kept as `🏳️ Unknown (xx)` |
| 10 | Help and documentation | 3 | Intro bullet accurate but splits `avoid` and `prefer` |
| Total | | 24/36 | Acceptable |

Design specificity: grounded in the app's vocabulary (emoji + label, badge cloned from `default ✓`, Library label format). The slip is meaning: a rule that assigns a policy to a movie is drawn like a release scoring rule. Detector: CLI `[]`; overlay 513 page findings, one from the diff (`🇫🇷 French` chip low-contrast 2.9:1, shared `@sensorr/ui` multiValue style). False positives: 234 `＊` measured on assumed white background (real `rgb(5,5,5)`), tight-leading on script/style.

Priority issues
- [P1] Menu painted under the SortableSelect chips below (z-index 5 vs 1) and clipped by the Rules 30em scroll. Fix: `menuPortalTarget={document.body}` + high `menuPortal` z-index on this Select (Policies.tsx:483). harden
- [P1] Placeholder "Any movie" states the opposite (empty = no movie by language). Fix: `No language`; badge title `New movies in French get this policy`. clarify
- [P2] Reads as a scoring rule: inside Rules, green accent chips, near `🇺🇳 Language`. Fix: gray chips and a divider below the field; moving it out of Rules contradicts the validated wireframe, Thomas decides. colorize
- [P2] Duplicate language across policies, no signal (matchPolicy takes the first). Fix: dim the flag on the losing card, title names the winning policy. harden
- [P3] Badge meaning hover-only, unreachable by touch/keyboard. Fix: aria-label with the title text. adapt

Persona red flags: Alex scrolls 186 languages alphabetically. Sam: react-select input has no accessible name (Select.tsx:190, pre-existing). Admin: nothing says existing movies stay put. A's claim that raising VOF makes it default to win `fr` is false when VOF alone claims `fr`.

Minor: intro bullet between avoid and prefer; double space collapses in menu; 3px flag/code gap vs the badge's 6 step; `Library.tsx:358` "Unknwon" pre-existing.

Questions: should the default policy carry languages at all? A one-shot "apply to N movies without policy" (none today)?
