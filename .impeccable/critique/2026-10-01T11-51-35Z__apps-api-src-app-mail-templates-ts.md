---
target: Sensorr mails
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/api/src/app/mail/templates.ts"
target_fingerprint: "sha256:80c6d95a9307d6441caf7d01dfcba51405a5a2f4e22a614b3ce08dea38be51d9"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/api/src/app/mail/templates.ts
timestamp: 2026-10-01T11-51-35Z
slug: apps-api-src-app-mail-templates-ts
---
Method: dual-agent (A: design review · B: detector and browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Welcome says "when they are ready" with no sense of when |
| 2 | Match System / Real World | 2 | "requests", "wrapped", "server" are the admin's words; mails in English for French friends (out of scope, Traductions) |
| 3 | User Control and Freedom | 3 | One-click unsubscribe behind a POST; the dead-end page names no one |
| 4 | Consistency and Standards | 3 | Wrapped left-aligned, others centred; unsubscribe page without card |
| 5 | Error Prevention | 3 | Test mail lists the mails but leaves out the weekly one |
| 6 | Recognition Rather Than Recall | 3 | Posters are not links, the button opens the Plex home |
| 7 | Flexibility and Efficiency | 3 | Text part and plain URL everywhere |
| 8 | Aesthetic and Minimalist Design | 3 | One action per mail; three wrapped bands weak |
| 9 | Error Recovery | 2 | Reconnect explains the cause; the unsubscribe dead end does not name the sender |
| 10 | Help and Documentation | 2 | Invitation assumes a Plex account and a Watchlist |
| **Total** | | **27/40** | **Good** |

## Design Specificity Verdict
LLM: specific, the test-card strip and emoji pictogram come from PRODUCT.md; tele is real graphic design, labo and videoclub fade into the ground, scenario loses its button. Detector: 24 advisory design-system-color and 2 radius findings on the mail palettes (mails cannot use theme tokens), overused-font on Open Sans (DESIGN.md body face, ignored), dark-glow on videoclub (the look's neon, documented). Contrast all AA on the core mails, lowest 5.16:1 on the plain link; no horizontal scroll at 390 px.

## Priority Issues
- [P1] Scenario button `#1b1a17` on `#050505`, 1.17:1. Fix: paper button.
- [P1] Outlook for Windows: padding on the `<a>` and `max-width` ignored. Fix: padding on the `<td>`, an mso 600 px wrapper.
- [P2] No preheader, the inbox preview shows "INVITATION" or "Rétrospective". Fix: hidden preheader from the first paragraph.
- [P2] Labo and videoclub bands melt into the ground, affiche year 2.07:1. Fix: distinct band grounds, finer perforations, a neon stripe, a darker year.
- [P2] Weekly mail button opens the Plex home, posters are not links; welcome promotes an empty wrapped. Fix: link each poster to its Plex page when known; welcome leads to the Watchlist.

## Persona Red Flags
Grandmother on Gmail: "requests", "wrapped" and "server" are opaque; small inline unsubscribe link. French friend: English mail with one French word. Thomas testing: the test mail forgets the weekly one.

## Minor Observations
Pictograms 128 px shown at 72 px, soft on 2x screens; poster placeholder taller than a poster; "Season 2, 3 episodes" reads as two seasons; green button on the unsubscribe page.

## Questions to Consider
Should the mails speak the friend's language? Should "wrapped" ever reach the friend?
