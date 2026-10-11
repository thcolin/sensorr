---
target: owned copies in the releases search drawer
total_score: 23
max_score: 32
na_heuristics: 3,9
p0_count: 0
p1_count: 1
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/components/Sensorr/Release.tsx"
target_fingerprint: "sha256:3048d7d6d9f6ba0b999965382dd4e6d881d7ca2e6d3322d1599f2621aecc0135"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/components/Sensorr/Release.tsx
timestamp: 2026-10-11T20-22-43Z
slug: apps-web-src-components-sensorr-release-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

Target: owned copies marked in the movie releases search drawer (Release.tsx, index.tsx, owned.ts), movie 16391, real data.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Marked per row; no count of owned copies in the drawer |
| 2 | Match system / real world | 3 | "Sur Plex", "Enregistrée" are the user's words. Source is not a match axis (deliberate: Thomas said the mHDgz BluRay/WEB-DL names are the same release) |
| 3 | User control and freedom | n/a | No new action |
| 4 | Consistency and standards | 3 | Same icons and tooltips as the movie page; the note shares the rejection reason's slot and style |
| 5 | Error prevention | 2 | A "Sur Plex" row downloads like any other, same tooltip |
| 6 | Recognition rather than recall | 4 | Text note readable without hover, touch included |
| 7 | Flexibility and efficiency | 2 | No grouping or hiding of owned copies (out of scope: list order stays) |
| 8 | Aesthetic and minimalist design | 3 | Quiet, fits the row |
| 9 | Error recovery | n/a | No new error path |
| 10 | Help and documentation | 3 | Tooltip names the job; "Enregistrée" includes copies replaced since |
| **Total** | | **23/32** | **Good** |

## Design Specificity Verdict

Grounded: reuses the state column (Plex tile, 📼, ⭐, 🛎️) and the note slot, matches on release vocabulary. Detector: 0 findings on changed lines; 3 pre-existing in source (Monospace-No-Emoji font Release.tsx:81, 2px radius index.tsx:96 and :196). Browser overlay: 189 findings across the whole drawer, mostly undersized text, low contrast and tight leading of the pre-existing dense rows; none specific to the change except the note's contrast below.

## Priority Issues

- [P1] An owned copy downloads in one click like a new one. Fix options: dim owned rows like invalid ones, change the title tooltip to "Déjà sur Plex, télécharger quand même", or keep. Command: /impeccable harden
- [P2] Invalid and owned row: on desktop the reason takes the note slot, so "Sur Plex" disappears, and the 🚨/🗑️ icon is replaced by the Plex/📼 one, so the policy verdict icon is lost. Fix: keep 🚨/🗑️ on invalid rows, or show the owned note next to the reason. Command: /impeccable polish
- [P2] The note is #666 on black at 10.5 px, about 3.7:1, inherited from the reason style, now carrying the feature's main information. Fix: a lighter theme grey for the owned note. Command: /impeccable audit
- [P3] 📼 of a manual record links to /jobs/manual (pre-existing, now surfaced in every search). Command: /impeccable polish

Rejected: "add source to the match axes" contradicts the brief (Thomas: the mHDgz BLURAY and WEB-DL names are the same versions).

## Persona Red Flags

- Alex (power user): owned copies scattered by score, no count in the header.
- Sam (keyboard, screen reader): the Plex tile has no accessible name; on an invalid owned row on desktop, no owned signal at all.

## Minor Observations

- "Enregistrée" next to the tooltip's "Enregistré par".
- When Plex and a record both match, Plex wins and the record's job link is not reachable from that row.

## Questions to Consider

- Should an owned copy still be one click from a download?
- Does "Enregistrée" read as "I have it" or "I had it"?
