---
version: 1
slug: "apps-wrapped"
primary_target: "apps/wrapped"
related_targets: []
---

# Wrapped programme, edition 2026

Scope: `apps/wrapped`, the page behind `/wrapped/<token>`. Mode: Experience. One edition shown, 2026, open until 1 December then frozen. Stands apart from the Sensorr app: `DESIGN.md` does not apply here.

Audience and job: a friend of Thomas, linked as a guest, opens their link on a phone in the evening. They know cinema, not data. They come to see their year of movies and series on Thomas's Plex, and come back during the year. Success: the first minute impresses, they reread it in August, they talk about it.

Content and ranges (79 users, edition 2026): plays 1 · 55 · 395 · 810 (min · median · p90 · max), 11 users under 10 plays; movies 0 · 18 · 86 · 227; shows 0 · 3 · 15 · 43; cycles 0 · 1 · 6 · 12; titles 3 · 14 · 30 · 57 characters. Source: `GET /api/wrapped/share/:token`; images through the API, relayed from Tautulli.

Sequence (validated wireframe): 1 opening, 2 figures, 3 official selection (pinned, 10 posters), 4 series, 5 cycles, 6 the year month by month (pinned), 7 longest night, 8 profile, 9 awards, 10 rank and colophon. Under 10 plays: 1, 2 and the colophon. Missing data hides its sheet. Desktop: the same portrait sheet centred, neighbouring sheets showing at the margins like a poster wall.

Anti-goals: a dashboard look (cards, bar charts, aligned KPIs); a page where the films are abstract or secondary; a Spotify copy; sound.

## Direction contract

THESIS: each section is a Polish-school film poster made from the visitor's own posters, cut, repainted and lettered by hand; it refuses the wrapped default of big numbers on saturated flat colour.

OWN-WORLD: cheap ochre poster stock as the ground, bruise violet ink, blood crimson kept for the one element in focus, bone white for highlights; real posters repainted in gouache by a WebGL shader (luminance to the violet, ochre and crimson ramp, brush noise, paper grain); torn and brushed SVG masks instead of boxes; brush lettering bent to the image, a hand-print face for small matter; no radius, no shadow, no card, no grid line.

STORY: the visitor recognises their own films in every sheet, understands their year as a programme of posters, and scrolls to the end for their rank.

FIRST VIEWPORT: at 390 × 844, a collage of the visitor's five most-watched posters, repainted, fills the sheet; "Programme de <name> 2026" is lettered across it, bent along the dominant figure, crimson on the name; a brush arrow at the foot invites the scroll. No button.

FORM: Polish film poster, the pick card of the direction round (first on my ordered list); seed key 6414e097.

Signature interaction: repaint. As a sheet scrolls in, each real poster shows as itself, then the gouache bleeds over it from a noise threshold driven by scroll; under reduced motion the painted state shows directly.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
