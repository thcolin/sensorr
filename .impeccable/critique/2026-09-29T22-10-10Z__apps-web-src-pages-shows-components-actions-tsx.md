---
target: show settings row
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Shows/components/Actions.tsx"
target_fingerprint: "sha256:3c316f13f2714c9cfd3d7c73d1c2cc155f18aa6757cdf1fc2f0f9637ac2214e2"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Shows/components/Actions.tsx
timestamp: 2026-09-29T22-10-10Z
slug: apps-web-src-pages-shows-components-actions-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | An invalid year reverts with no message; a saved query read back as defaults shows nothing |
| 2 | Match System / Real World | 3 | From–To matches showReleaseYears (min/max); "filter releases with a year outside" is ambiguous |
| 3 | User Control and Freedom | 1 | No reset to the TMDB years; editing Terms freezes Years; no Escape |
| 4 | Consistency and Standards | 2 | Years focus border `accent` and 200ms, where DESIGN.md says `grayDarkest` and 100ms; raw `5px` padding |
| 5 | Error Prevention | 2 | numeric inputMode, maxLength and digit stripping; no placeholder |
| 6 | Recognition Rather Than Recall | 2 | Nothing tells a custom range from the default one |
| 7 | Flexibility and Efficiency | 3 | Tab and type is fast; Enter drops focus to body |
| 8 | Aesthetic and Minimalist Design | 3 | Clean; three helps open on "Sensorr will…" |
| 9 | Error Recovery | 1 | Invalid entry reverts silently |
| 10 | Help and Documentation | 3 | Helps wrap instead of ellipsis, at the cost of ragged baselines |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict

LLM: grounded in the product. The row reuses MetadataStyles, QueryInput, PolicyInput, OptionInput; grid columns measure 528/192/192 px at the same x as the movie page. Years is the one new piece and the only one that reads differently (bare numbers beside two green-chip controls).

Deterministic scan: `impeccable detect` on Actions.tsx exits 0, no finding. Metadata.tsx carries one pre-existing `design-system-radius` (2px, line 358). Browser overlay on /tv/250203: 10px labels and helps (`undersized-ui-text`, `tight-leading`), white on the brand green at 2.4–2.9:1, both inherited from the movie row and the theme. React-select `defaultProps` deprecation from QueryInput, pre-existing.

## Priority Issues

- [P1] Editing Terms freezes Years. `setQuery` (Actions.tsx:36) writes the current years with every change; the saved range then outlives new seasons, and a release of a later year fails `showReleaseYears` (policy.ts:274, valid false, warning 40). A show without first_air_date cannot keep a Terms edit, since getShowQuery keeps a saved query only when titles, terms and years are all set. Fix: save only the edited field, read per field (default for any empty one) in getShowQuery. Command: harden.
- [P1] Invalid year reverts silently (Actions.tsx commit). Fix: toast or aria-invalid, and a `YYYY` placeholder. Command: harden.
- [P2] Years focus and sizing off the field rules: `accent` border, 200ms, raw `paddingY: '5px'`. Command: polish.
- [P2] Follow checkboxes named by their changing help; visible labels unlinked. Fix: label ids in aria-labelledby, help in aria-describedby; "Follow the show first" says "Follow episodes first". Command: polish.
- [P2] Years and Policy helps wrap to two lines beside a one-line Terms help (+11px). Fix: shorter helps. Command: clarify.

## Persona Red Flags

Admin power user: no way to tell or reset a custom range; stale max surfaces later as a 📅 reason in job logs. Stale comment in ProcessShows.tsx:323 still names Auto.
Mobile PWA: year inputs 40×24 px; tapping the empty part of the Years box focuses nothing. Follow rows: checkbox at the edge, help centred (shared with the movie page).
Keyboard/a11y: Terms and Policy wrappers show no focus; labels gray-600 at 10px ≈3.7:1 (inherited); PolicyInput hardcodes id='policy', duplicated on the job page (pre-existing).

## Minor Observations

- Years inputs sit left with ~110 px empty on desktop.
- "Sensorr searches the followed episodes" is circular.
- Enter blurs instead of committing in place; Escape does nothing.

## Questions to Consider

- Should Years be saved at all while it equals the TMDB default?
- Should movie Years become a range too, one control family on both pages?
- With Auto gone, should the row say whether a release will be proposed or downloaded?
