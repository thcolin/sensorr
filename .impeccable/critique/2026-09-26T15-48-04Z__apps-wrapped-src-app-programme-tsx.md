---
target: apps/wrapped/src/app/Programme.tsx
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
target_identity: "file:apps/wrapped/src/app/Programme.tsx"
target_fingerprint: "sha256:c97df92a9ed078dfb4df45e49bbddcd225dba1883be1b320d3790f11f5b3a993"
target_path: apps/wrapped/src/app/Programme.tsx
timestamp: 2026-09-26T15-48-04Z
slug: apps-wrapped-src-app-programme-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Loading stroke, 1/10 counter, Provisoire stamp, "programme au"; no sense of position among the ten sheets |
| 2 | Match System / Real World | 3 | Cinema metaphor strong; "Les cycles" unexplained, "Ta réalisation" odd French |
| 3 | User Control and Freedom | 2 | Selection track ~5,900px, no way to skip |
| 4 | Consistency and Standards | 3 | Sheets swing between poster compositions and text/chart sheets |
| 5 | Error Prevention | 2 | Landscape `art` breaks the Shows sheet; "toi seul" gendered |
| 6 | Recognition Rather Than Recall | 3 | Month initials to decode |
| 7 | Flexibility and Efficiency | 1 | A returning guest re-scrolls 14,000px |
| 8 | Aesthetic and Minimalist Design | 2 | Dead ochre on selection, shows, cycles; films repeated |
| 9 | Error Recovery | 3 | In-world states, Relancer; gone state gives no way to reach Thomas |
| 10 | Help and Documentation | n/a | One-way experience |
| **Total** | | **22/36** | **Acceptable (61%)** |

## Design Specificity Verdict

Opening, official selection and awards are authored: gouache shader, torn paper, cinema vocabulary. The middle (Figures, Year, Night, Profile, Rank) falls back to wrapped defaults: big number plus label, area chart, value lists; four show no film. Lettering is the thinnest part: Sedgwick Ave Display is a graffiti tag face (dotted capital I), words only tilt, never bend along a figure or cross an image.

Deterministic scan: `apps/wrapped/src/app` clean; `design-system-font` x4 on styles.css (false positive, DESIGN.md does not apply). Browser: `clipped-overflow-container` x2 (false positive, deliberate collage bleed), `heading-rhythm` x2 (likely false positive, figure units), `tight-leading` + `all-caps-body` on `.colophon-short` (real, minor). Outside rules: the Sedgwick preload points to `/wrapped/assets/fonts/…` while CSS loads a webpack-emitted `/wrapped/SedgwickAveDisplay.woff2`, so the font loads twice and the title waits under `font-display: block`.

## Priority Issues

- [P0] Shows sheet broken: canvas 382x191 in a 382x678 box (`height: 100%` does not resolve in a flex-sized `.painted`); ~480px dead ochre, heading pushed down. Backdrop bleed `-7cqi` does not match the `calc(var(--u)*7)` padding. Fix: canvas absolute inset 0; bleed in `--u`; heading over the image. Command: /impeccable polish, /impeccable layout.
- [P1] The middle drops the thesis (dashboard). Fix: anchor Night, Profile, Year, Figures on painted posters (marathon show full-bleed; director's posters collage; year as torn poster strips sized by hours). Command: /impeccable bolder.
- [P1] The ending is a statistic most guests lose ("45e sur 79 … la moitié du serveur est sous 51 h"). Fix: rank before awards without the median; end on the Palme d'or full-bleed; "Fin. À l'année prochaine". Command: /impeccable delight, /impeccable clarify.
- [P2] Lettering does not do what the contract says: dotted I, per-word tilt only, title stacked below the collage. Fix: fixed headings as brushed SVG, a brush face with a plain I for variable text, title overlapping the collage. Command: /impeccable typeset.
- [P2] Selection track long and sparse; screen readers only hear "3 / 10". Fix: 0.35 viewport per step, poster ~88cqi, rank lettered on the poster, visually-hidden list of the ten films, drop aria-live. Command: /impeccable layout, /impeccable audit.
- [P3] French typography: no NBSP (": REVIENS" at line start, "39 heures", "18 h 03", "27 %"), straight apostrophe in App.tsx, "toi seul", "Ta réalisation". Command: /impeccable clarify.

## Persona Red Flags

Casey: ~12 flicks through the selection, no progress, title invisible up to 3s on slow network, nothing to share at the end.
Sam: selection exposes one film at a time; lettering in pure cqi ignores text-size settings; year month initials partly bone on ochre.
Riley: long names/titles clip silently (no overflow-wrap, sheet overflow hidden); 12 cycles stretch the sheet; The Office repeats four times; desktop shows no neighbouring sheets.

## Minor Observations

Figures backdrop crop unreadable; year future dotted line floats above the real zero; "18 h 03" is a flat box; 4-poster collage lopsided; "Demande-/en" breaks on the hyphen.

## Questions to Consider

If a sheet cannot be built from one of the guest's posters, should it exist? Why does a programme of films end on a leaderboard? Would eight hand-drawn SVG headings do more for the thesis than a font?
