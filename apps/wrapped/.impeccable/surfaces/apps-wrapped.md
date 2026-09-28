---
version: 1
slug: "apps-wrapped"
primary_target: "apps/wrapped"
related_targets: []
---

# Wrapped, « Rétrospective » in French, edition 2026

Scope: `apps/wrapped`, the page behind `/wrapped/<token>`. Mode: Experience. One edition shown, 2026, open until 1 December then frozen. Stands apart from the Sensorr app: `DESIGN.md` does not apply here.

Audience and job: a friend of Thomas, linked as a guest, opens their link on a phone in the evening. They know cinema, not data. They come to see their year of movies and series on Thomas's Plex, and come back during the year. Success: the first minute impresses, they reread it in August, they talk about it.

Content and ranges (79 users, edition 2026, import of 28/09): sheets per guest 4 · 11 · 11 · 11 (min · median · p90 · max), 11 users under 10 plays; evenings in a row 3 · 7 · 15 · 57 (52 users); months with a show 0 · 4 · 10 · 10; binge 3 · 6 · 21 · 58 episodes (53 users); films only you watched 1 · 6 · 34 · 85 (70 users); titles 3 · 15 · 30 · 53 characters; ascendant names 4 · 12 · 20 · 25. Source: `GET /api/wrapped/share/:token`; images through the API, relayed from Tautulli.

Sequence (wireframe validated on 28/09): 1 opening, first title of the edition, evenings, hours, films, episodes, gap with the previous edition; 2 evenings in a row; 3 the show of each month; 4 binge and pace; 5 the night launched the latest; 6 first on the server, else the same week as N others; 7 films nobody else watched; 8 dropped and slow; 9 the longest and the oldest, or the film rewatched; 10 genre, with the actor, show or director in the lead; 11 rank and the last title, « Fin ». Under 10 plays: 1, 6, 7, 9, 11. Missing data hides its sheet. Copy stays in the vocabulary of cinema. Desktop: the same portrait sheet centred, neighbouring sheets showing at the margins like a poster wall.

Anti-goals: a dashboard look (cards, bar charts, aligned KPIs); a page where the films are abstract or secondary; a Spotify copy; sound.

## Direction contract

THESIS: each section is a Polish-school film poster made from the visitor's own posters, cut, repainted and lettered by hand; it refuses the wrapped default of big numbers on saturated flat colour.

OWN-WORLD: cheap ochre poster stock as the ground, bruise violet ink, blood crimson kept for the one element in focus, bone white for highlights; real posters repainted in gouache by a WebGL shader (luminance to the violet, ochre and crimson ramp, brush noise, paper grain); torn and brushed SVG masks instead of boxes; brush lettering bent to the image, a hand-print face for small matter; no radius, no shadow, no card, no grid line.

STORY: the visitor recognises their own films in every sheet, and each sheet tells one thing about their year that is interesting or funny: a first, a habit, a place among the other viewers.

FIRST VIEWPORT: at 390 × 844, a collage of the first titles of the visitor's edition, repainted, fills the sheet; "Rétrospective de <name> 2026" is lettered across it, bent along the dominant figure, crimson on the name; a brush arrow at the foot invites the scroll. No button.

FORM: Polish film poster, the pick card of the direction round (first on my ordered list); seed key 6414e097.

Signature interaction: repaint. As a sheet scrolls in, each real poster shows as itself, then the gouache bleeds over it from a noise threshold driven by scroll; under reduced motion the painted state shows directly.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
