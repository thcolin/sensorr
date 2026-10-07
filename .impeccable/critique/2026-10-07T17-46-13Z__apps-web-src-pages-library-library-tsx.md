---
target: Library controls bar and strip at 390 px
total_score: 21
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/responsive/apps/web/src/pages/Library/Library.tsx"
target_fingerprint: "sha256:94d9502ebb6e7a7f64eb22fd62dfbbe8b1354ca1a8cb94874e64d41ce9d6dadc"
target_path: /Users/thcolin/orca/workspaces/sensorr/responsive/apps/web/src/pages/Library/Library.tsx
timestamp: 2026-10-07T17-46-13Z
slug: apps-web-src-pages-library-library-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "8940 Résultats" in the bar, "8 940 sélectionnés" in the strip: one number, two formats |
| 2 | Match System / Real World | 3 | "Plus de filtres" on Requests, "Afficher les filtres" elsewhere |
| 3 | User Control and Freedom | 3 | On a phone the sorting waits for "Appliquer" in the panel |
| 4 | Consistency and Standards | 2 | The new strip (`primaryDark`, 2em padding, checkbox left) and the swaps strip (`primary`, paddingX 6, checkbox right) differ |
| 5 | Error Prevention | 3 | Nothing new |
| 6 | Recognition Rather Than Recall | 3 | The sorting is now behind a tap on a phone |
| 7 | Flexibility and Efficiency | 2 | Sorting costs three taps on a phone |
| 8 | Aesthetic and Minimalist Design | 2 | Calendar: header 124 + bar 76 + strip 88 = 288 px of chrome on 844 |
| 9 | Error Recovery | n/a | No error path in this change |
| 10 | Help and Documentation | n/a | No help surface in this change |
| **Total** | | **21/32** | **Acceptable (66 %)** |

## Design Specificity Verdict

LLM assessment: specific to the app. The strip takes the 1px rule and the 3em height of the swaps balance strip, and reads as a sub-row of the bar on Library and Requests. Uneven on Calendar, and the two strips of the app now disagree on tone, padding and alignment.

Deterministic scan: `impeccable detect` on `Library.tsx` and `libs/ui/src/elements/Controls`: 0 findings. Browser overlay on library, calendar and requests: the same 32 findings on all three, from the app shell (24 `buried-raster` on opacity-0 images, 4 `clipped-overflow-container`, `overused-font` Open Sans, `skipped-heading` on a hidden empty state), none on the bar or the strip. `tight-leading` ×2 on script and style nodes are false positives. Detector and review agree that the strip itself is clean of pattern violations; the problems are sizing and consistency, which the detector does not measure.

Measured at 390 px: bar 76 px on every page; strip 42 px (Library, Requests), 88 px (Calendar). No control past the viewport.

## Overall Impression

The change does its job on Library and Requests: no more hidden buttons. Calendar carries the defects, and the strip's controls are not thumb-sized.

## What's Working

- No horizontal scroll left in the bar: every control is visible on a phone without discovery.
- The strip shares the swaps strip's rule and height, so it reads as part of the same family.
- The sorting at the top of the panel matches the swaps; the `[mobile, desktop]` areas keep desktop untouched in code.

## Priority Issues

**[P1] Calendar month picker leaves a band of `primary` at the right edge.**
Why: the picker is 362 px wide in a 390 bar (`FilterReleaseDate.tsx:54-55`, `marginLeft: -2em`, `marginRight: 0em`); now that it takes its grid area and the bar no longer scrolls, the gap shows and reads as a bug.
Fix: `marginRight: ['-2em', …]` to mirror the left.
Command: /impeccable polish

**[P1] Touch targets in the strip are under 44 px.**
Why: Calendar's "Afficher les filtres" is 180×14 in the strip (48 px tall in the Library bar), "Tout sélectionner" and "Masquer la bibliothèque" labels 17 px with a 14 px checkbox, the view select 99×17, "Non traitées" 27 px. The strip is where a phone taps.
Fix: stretch the strip's direct children to its full height, so the whole row is the hit area.
Command: /impeccable adapt

**[P1] Two strips, two treatments.**
Why: the swaps strip (`Proposals.tsx:1141`) is `primary`, paddingX 6, checkbox right; the new one `primaryDark`, 2em, checkbox left. DESIGN.md gives `primaryDark` as the hover step of green.
Fix: one strip for both, tone decided by the owner.
Command: /impeccable extract

**[P2] Calendar strip overloaded, results moves place.**
Why: two rows of strip (88 px), and "Résultats" sits in the bar elsewhere but in the strip on Calendar.
Fix: one row in the strip, "Masquer la bibliothèque" into the panel as the sorting; or accept the two rows.
Command: /impeccable distill

**[P3] Number formatting differs between bar and strip.**
Why: "8940" and "8 940" for the same count.
Fix: one formatter.
Command: /impeccable polish

## Persona Red Flags

Casey (distracted mobile user): 14–17 px targets right above the poster grid; three stacked green bands on Calendar hide where the content starts.
Alex (power user): sorting takes open, change, "Appliquer"; the bulk pill after "Tout sélectionner" is cut at the right edge (a deliberate scroller, `Bulk.tsx:293`, untouched).
Sam (accessibility): white on `primaryDark` about 2.2:1, under AA like the bar already is; the small hit areas fail WCAG 2.5.8.

## Minor Observations

- PWA: by code, `Nav` is `position: relative` on a phone, nothing sticks or overlaps.
- The strip uses `white !important` like the bar, the swaps strip `whitePure`.
- Swaps empty state shows "0 Résultats" above an expanded "en retard 103" group (out of scope).

## Questions to Consider

- If the strip carries the secondary fields, why does Calendar put the results in it?
- Should the strip be the swaps strip, one component?
- With the sorting behind "Appliquer", should library visibility and the view also go to the panel, leaving the strip to selection?
