---
target: notifications pane loading, header search columns, phone jobs head
total_score: 24
max_score: 32
na_heuristics: 5,10
p0_count: 0
p1_count: 0
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/sensorr-ux-retours/apps/web/src/layout/Header/elements/Notifications.tsx"
target_fingerprint: "sha256:196c46b06b6c7e67a2fe0dd5b9b3be8226c4680c6053580957d6e065d21f7133"
target_path: /Users/thcolin/orca/workspaces/sensorr/sensorr-ux-retours/apps/web/src/layout/Header/elements/Notifications.tsx
timestamp: 2026-10-11T08-39-07Z
slug: layout-header-elements-notifications-tsx-b3f4a73a
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

Scope: `git diff dev` on thcolin/sensorr-ux-retours. Three surfaces: the notifications pane while loading (Notifications.tsx), the header search columns on desktop (Entities.tsx fold), the phone /jobs head chevron (Jobs.tsx).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton replaces the false "Aucune notification"; no error state if the stream never answers |
| 2 | Match System / Real World | 3 | Loading tabs say "0" while 560 notifications exist |
| 3 | User Control and Freedom | 4 | Bell no longer disabled while loading |
| 4 | Consistency and Standards | 3 | Tabs and skeleton match /jobs; head chevron leads while the drawer's group chevrons trail |
| 5 | Error Prevention | n/a | Nothing in the diff writes |
| 6 | Recognition Rather Than Recall | 4 | Search cards show title, year, genres, overview, state again |
| 7 | Flexibility and Efficiency | 3 | Tabs reorder under the pointer at load |
| 8 | Aesthetic and Minimalist Design | 3 | Search titles clip mid-glyph, overview cut mid-line |
| 9 | Error Recovery | 1 | A stream that never sends leaves the skeleton forever |
| 10 | Help and Documentation | n/a | |
| **Total** | | **24/32** | Good |

## Design Specificity Verdict

LLM: specific to the product. The skeleton follows DESIGN.md "Loading draws the content's own shape in still bars", and overlays the loaded rows at 1440 and 390. The jobs head glyph sits on the 24px page edge. Weak spot: the loading tabs show real labels with a hard "0".

Deterministic scan: `impeccable detect` finds nothing on diff lines; 3 pre-existing `design-system-radius` in Notifications.tsx (185, 221, 289), 4 in Jobs.tsx (411, 427, 500, 707), Entities.tsx clean. Browser overlay: text-occlusion under the pane overlay, buried-raster on lazy images, tight-leading on injected tags are false positives; 9-10px chips and white-on-green headings are pre-existing.

## Priority Issues

- [P2] Loading tabs show "0" and an order the content contradicts (Notifications.tsx:41, :130). The contract said tabs as bars. Fix: draw the tabs as pill bars while loading. Command: /impeccable polish.
- [P2] Endless skeleton when the stream fails (contexts/Notifications/Notifications.tsx:28, 111-119): `loading` only clears on a message. Fix: on a stream error before the first message, show the house Warning instead. Command: /impeccable harden.
- [P2] Search cards: title `<a>` clips without ellipsis ("Dune : Deuxième pa"), overview cut mid-line, nested scroll (libs/ui/src/elements/Entity/Card/Card.tsx). Pre-existing, exposed by the fix. Command: /impeccable polish.
- [P3] Collections column header 10px above the other three (Search.tsx AbstractEntity). Pre-existing.
- [P3] `flex: 1` on the fold applies to every `hide` row; measured without visible effect on Home and the job pages.

## Persona Red Flags

Power user on desktop: clicks a tab during ~12 s of loading, the tab moves at load; "tous 0" reads as a broken stream.
Phone PWA user: four 240px skeleton rows fill the pane, right; the left chevron sits near the iOS back-swipe edge, glyph at 24px, hit area from 16px, low risk.

## Minor Observations

- `aria-busy` on the scroller, tabs still announced with zeros.
- Mobile search with one result: the more button floats mid-row (pre-existing).
- Head chevron leads, group chevrons trail: worth a DESIGN.md rule if it is meant as one.

## Questions to Consider

- Why show nine commands while loading, rather than a few bar pills?
- Is the 12 s first load a skeleton problem, or the SSE sending the whole history first?
