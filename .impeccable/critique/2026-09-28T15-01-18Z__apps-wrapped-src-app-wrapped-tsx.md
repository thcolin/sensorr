---
target: apps/wrapped/src/app/Wrapped.tsx
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/wrapped-donnees/apps/wrapped/src/app/Wrapped.tsx"
target_fingerprint: "sha256:1dbdcb93e61cad06ff6069182fcbaaec76ecaea149e3a4fc5830188cc3667ae0"
target_path: /Users/thcolin/orca/workspaces/sensorr/wrapped-donnees/apps/wrapped/src/app/Wrapped.tsx
timestamp: 2026-09-28T15-01-18Z
slug: apps-wrapped-src-app-wrapped-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector and browser)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | "Provisoire" stamp and colophon date; no sense of progress through the sheets |
| 2 | Match with the real world | 3 | Cinema vocabulary; "208 minutes" and "saison 2, épisode 22, sur 48 épisodes" read badly |
| 3 | User control | 3 | Plain scroll |
| 4 | Consistency | 2 | Poster, chart and list languages; Streak and Toi seul share one template back to back |
| 5 | Error prevention | 2 | The gap compares ten months of 2026 with twelve of 2025 (Wrapped.tsx:81) |
| 6 | Recognition | 3 | Posters carry recognition |
| 7 | Flexibility | n/a | Linear story |
| 8 | Aesthetic | 2 | Dead paper on Server, Hors normes, Ton genre |
| 9 | Error recovery | 3 | Séance annulée, La projection a sauté + Relancer |
| 10 | Help | n/a | Experience |
| **Total** | | **21/32** | Good (66 %) |

## Design specificity
Opening, Binge, Night and Finale are Polish-school posters; Streak and Toi seul fall back on big number over flat colour, Months on a bar chart, Pas fini on a thumbnail list. Detector: 2 CLI design-system-font warnings (false positive, DESIGN.md does not apply), browser clipped-overflow, all-caps, tight-leading, heading-rhythm (false positives of the poster world); one real: crimson on paper 2.37:1.

## Priority issues
- [P0] Rank lettering collides, "SPECTATEURSUR" (Sheet.tsx:28, styles.css:152): --grow scales words by transform without reflow. Fix: smaller size or reflowing size. /impeccable typeset
- [P1] The gap with the previous edition compares ten months with twelve, in crimson at 2.37:1 on paper (Wrapped.tsx:81, styles.css:259). Fix: compare the same period, or only once the edition is closed; ink colour. /impeccable clarify
- [P1] The page ends on a ranking: Rank is the only sheet without a film, right before "Fin.". Fix: move Rank earlier, keep the Finale last. /impeccable clarify
- [P1] Months, Pas fini, Hors normes read as dashboard forms. Direction question, out of this chantier (DA judged later). /impeccable layout
- [P2] Repeated titles (The Office on six sheets for a median guest) and weak picks (fini en 2 jours, oldest 2012). /impeccable delight
- [P2] Desktop 1440: 60 % flat wall; the Streak poster covers its lettering (styles.css:279-285). /impeccable adapt

## Persona red flags
- Casey: Streak and Toi seul look like the same sheet.
- Sam: aria-label on <p> (Wrapped.tsx:119,266,327) may not be announced; crimson text 2.37:1.
- L'ami cinéphile: Twin Peaks stopped right before The Return is a missed joke.

## Minor observations
No-break space between "11" and "autres spectateurs"; "derrière 1 de tes films" plural; crimson swash strikes the digits; crowd wraps 38/38/3; no-WebGL fallback shows full-colour posters.

## Questions
Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3.
