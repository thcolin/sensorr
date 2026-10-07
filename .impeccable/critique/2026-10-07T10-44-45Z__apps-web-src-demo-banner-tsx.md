---
target: demo banner and TMDB notice
total_score: 25
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/demo/apps/web/src/demo/Banner.tsx"
target_fingerprint: "sha256:da1e5478eb3a3166448a95cc86168cea369838fa6b6ebb769d4573ad3dabb590"
target_path: /Users/thcolin/orca/workspaces/sensorr/demo/apps/web/src/demo/Banner.tsx
timestamp: 2026-10-07T10-44-45Z
slug: apps-web-src-demo-banner-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Storage message says "blocks" even on a quota error |
| 2 | Match System / Real World | 3 | "Reset" does not say what it resets before the confirm |
| 3 | User Control and Freedom | 4 | Confirmed reset back to the seed |
| 4 | Consistency and Standards | 2 | ↺ renders as text, ↗ as a color emoji; 9.19px Fira Code badge beside 14px body text |
| 5 | Error Prevention | 3 | window.confirm |
| 6 | Recognition Rather Than Recall | 3 | Icon-only buttons on mobile |
| 7 | Flexibility and Efficiency | n/a | Two-action strip |
| 8 | Aesthetic and Minimalist Design | 2 | Inverted hierarchy: "Demo" faintest, sentence loudest |
| 9 | Error Recovery | 2 | localStorage read outside try (store.ts:17): with cookies blocked the app never renders |
| 10 | Help and Documentation | 3 | GitHub link answers "what is this" |
| **Total** | | **25/36** | **Good** |

## Design Specificity Verdict
Authored for Sensorr (Badge with 🍿, buttonStyles.outline, tonal stacking, no green). Generic tells: Unicode arrows outside the emoji vocabulary, browser default focus ring. Detector CLI: 0 findings on Banner.tsx, Login.tsx, apps/web/src/demo. In page: 🍿 and "Demo" under 11px, TMDB notice 1.6:1. False positives: tight-leading on script/style, overlay occlusion, ~230 grid-card undersized texts out of scope.

## Priority Issues
- [P1] Inverted hierarchy: badge 9.19px desktop / 7.66px mobile, sentence in textLight brighter than the header. Fix: normal-size badge, quieter sentence. /impeccable typeset
- [P1] Two glyph families: ↗ from the emoji face, ↺ from the text face. Fix: text presentation (U+FE0E) on a -no-emoji stack for both. /impeccable polish
- [P1] TMDB notice 1.6:1, grayDark is a border token (DESIGN.md:323). Fix: a readable text color. /impeccable audit
- [P2] Blocked-storage state unreachable: localStorage access can throw before any try (store.ts:17). /thcolin:debug
- [P2] Mobile strip 59px for three marks. Fix: paddingY 0 on mobile. /impeccable adapt

## Persona Red Flags
- Jordan: "Reset" without object; "your changes" on login has no referent yet.
- Casey: two unnamed squares, "Demo" at 7.66px.
- Sam: GitHub link opens a new tab unannounced; TMDB notice 1.6:1.

## Minor Observations
Desktop buttons 21px high (< 24px WCAG 2.5.8); hover barely changes the border; TMDB also asks for its logo; the banner arrives after the boot splash and shifts the page by 36px.

## Questions to Consider
Should "Demo" be the loud mark and the sentence a title? Does a strip that scrolls away still do its job?
