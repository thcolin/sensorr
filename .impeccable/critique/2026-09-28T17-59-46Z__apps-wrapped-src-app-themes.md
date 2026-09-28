---
target: the four new looks of the wrapped
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/wrapped-donnees/apps/wrapped/src/app/themes"
timestamp: 2026-09-28T17-59-46Z
slug: apps-wrapped-src-app-themes
---
Method: dual-agent (A: design review · B: detector + browser)

Target: the four new looks of the wrapped page, `apps/wrapped/src/app/themes/{labo,tele,videoclub,scenario}`, over the shared words of `apps/wrapped/src/app/sheets.ts` and the look switch of `apps/wrapped/src/app/Wrapped.tsx`. Checked at 390×844 and 1440×900 on the real programme (14 sheets) and on a short guest.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress lives in the world (frame, page, scene numbers); Vidéoclub has none; blank screen while a look loads |
| 2 | Match System / Real World | 3 | Film vocabulary held everywhere; some insider jargon (« Fiche d'étalonnage », `LAST`) |
| 3 | User Control and Freedom | 2 | Switching look keeps the pixel offset, so the reader lands on another sheet |
| 4 | Consistency and Standards | 3 | Same words everywhere; « Courrier des lecteurs » used twice in Télé |
| 5 | Error Prevention | 3 | Little risk surface; missing data hides its sheet |
| 6 | Recognition Rather Than Recall | 2 | The switch shows only the current look's name, nothing says it changes the look |
| 7 | Flexibility and Efficiency | n/a | Experience surface |
| 8 | Aesthetic and Minimalist Design | 3 | Dense by intent; the fixed switch and Vidéoclub's gaps are noise |
| 9 | Error Recovery | 3 | Short guest gets its colophon; failed image untested |
| 10 | Help and Documentation | n/a | Experience surface |
| **Total** | | **22/32** | **Acceptable, near Good** |

## Design Specificity Verdict

**LLM assessment**: four distinct worlds on the same words, each sheet reinterpreted by an object of its world rather than recoloured. Labo is the most accomplished (reel, contact sheet, grading card, burning end). Télé is very specific (masthead, rubrics, clickable contents on desktop), its 79 and 57 numbered cells lean toward a calendar. Vidéoclub is specific by its props (member card, rental ticket, VHS spines, iron shutter); its pink and cyan neon sign is the generic synthwave part. Scénario is the finest concept (real revision colours, sluglines, transitions) and the weakest first screen: nothing lands in the first minute.

**Deterministic scan**: `impeccable detect` finds 111, all `design-system-*` (fonts, colours, radii) because the root `DESIGN.md` of the web app is applied to the wrapped; every look declares its own fonts and palette on purpose. False positives. With `--no-design-system`: 0 findings in every look. In the page overlay: Labo 32 (24 `undersized-ui-text`, 1 real `low-contrast` on « spectateur sur 79 », 9px at 4.3:1), Télé 7 (+1 `repeated-container-text` at 1440), Vidéoclub 103 (52 `cramped-padding` on VHS spines and 36 neon `dark-glow` / `ai-color-palette`, both the world's own; 13 texts at 10px on mobile), Scénario 5 (sluglines in caps, lamp glow, flat Courier hierarchy: the world's own). No horizontal overflow, 0 console error, 0 request off localhost, every image has an `alt`. The switch's `<select>` has no `id` or `name`.

## Overall Impression

The goal is met: nothing here looks like a dashboard or Spotify, and the films lead. The single biggest issue is shared: the fixed look switch covers text on almost every screen.

## What's Working

1. Four worlds truly distinct on the same words (grading card, audience chart, member card, the room in chorus for one rank).
2. Films in front: posters large, contact sheets, sleeves, paper clips; even months become images.
3. Desktop composed as an object: magazine spread with contents, screenwriter's desk with index and pencil, reels in the margins.

## Priority Issues

- **[P1] The switch covers content in every look.** `apps/wrapped/src/styles.css`, `Wrapped.tsx`: a fixed 181×44 box, half the width at 390, over the prose of « Vus à deux », captions, headings. Fix: take it out of the fixed layer, put it in the flow before the first sheet and after the colophon, labelled in words. `/impeccable layout`
- **[P1] Télé: the cover lede is hard to read.** `tele/tele.css:386-391`, `465-469`: the gradient stays clear where the white italic lede sits; on a light poster it fades. Fix: darken from higher, or a solid band. `/impeccable polish`
- **[P1] All: the only film disappears when it is alone.** `sheets.ts`, `posters: one ? [] : posters`: « 1 film que personne d'autre n'a vu » shows on an empty screen. Fix: keep its poster. `/impeccable harden`
- **[P2] All: switching look loses the sheet being read.** `Wrapped.tsx`: pixel offset kept across pages of different heights. Fix: keep the switch where it was on screen after the new look renders. `/impeccable harden`
- **[P2] Vidéoclub: empty wall between sheets.** `videoclub/videoclub.css:94-104`: `min-height: 100svh` with centring leaves 300-400 px gaps. Fix: top-align with a fixed rhythm. `/impeccable layout`
- **[P2] Scénario: no strong moment.** Key figures are highlighted 15px Courier, the title page is small. Fix: the key figure of each scene as a centred line in capitals, a larger title page. `/impeccable bolder`

## Persona Red Flags

**A friend on an iPhone in the evening**: the switch covers the line being read and « Labo 35 mm » does not say what it does; switching loses the place; the Télé cover lede fades on a light poster; Courier 13-15px tires; Vidéoclub scrolls through empty wall.

**Sam (screen reader)**: two Labo sheets lack a heading (11 `h2` for 13 sheets); switching look announces nothing; Télé's 79 numbered `li` may be read one by one.

**Riley (short guest)**: the single film with no poster leaves an empty screen; rank 75th comes second; the rest holds.

## Minor Observations

- Labo: `LAST` in English on the finale frame; small « THOMAS » in a large flat on desktop; « spectateur sur 79 » at 9px, 4.3:1; months and episode counts at 10px.
- Télé: « Courrier des lecteurs » twice; the 79 and 57 cell grids are the one slope toward a dashboard; « Entourage » three times in one spread at 1440.
- Vidéoclub: months and « Top 1 » at 10px on mobile; neon cyan reaches the switch's options.
- Affiche's Knewave and Patrick Hand load under every look (the preload in `index.html`).

## Questions to Consider

- What if the switch lived only under the opening and beside « Fin. », as a second screening?
- What if switching redrew the same sheet in place, the strongest proof that the words are the same?
- Does the Vidéoclub need the neon, when its card, ticket and spines already say video store?
