---
target: Plex artworks on details, library, swaps, show
total_score: 18
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-plex-artworks/apps/web/src/pages/Details/Details.tsx"
target_fingerprint: "sha256:a43617c540b564a84fd125358aef6496550fa59834e5c12e48cdb41276181e45"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-plex-artworks/apps/web/src/pages/Details/Details.tsx
timestamp: 2026-09-28T15-27-58Z
slug: apps-web-src-pages-details-details-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Plex slow: empty frame up to 10 s before the TMDB fallback |
| 2 | Match System / Real World | 2 | English Plex posters under French titles ("Un Cœur à prendre" over *Home Again*) |
| 3 | User Control and Freedom | 1 | No per-title source choice; the picker is tranche T2 |
| 4 | Consistency and Standards | 2 | Plex and TMDB art mixed row by row in one grid |
| 5 | Error Prevention | 1 | withPlexArtworks applied twice builds a fallback the API refuses (400) |
| 6 | Recognition Rather Than Recall | 2 | English title treatment on 47x71 swap rows |
| 7 | Flexibility and Efficiency | 3 | Preload on hover and before open; one pictureSrc path |
| 8 | Aesthetic and Minimalist Design | 3 | Plex art often cleaner than TMDB one-sheets, no new chrome |
| 9 | Error Recovery | 2 | 404 falls back in 76 ms; a 400 ends on the empty glyph |
| 10 | Help and Documentation | n/a | nothing new to document |
| Total | | 18/36 | Poor, pulled down by the P0 |

## Priority Issues
- [P0] Swaps active card shows an empty poster for every Plex-backed movie: Active (Card.tsx:540) and MovieWithCreditsAndReviews (components/Movie/Movie.tsx:10) both wrap withMovieMetadataContext, the second withPlexArtworks takes the Plex URL as TMDB fallback, /api/plex/image answers 400. Fix: make withPlexArtworks idempotent (apps/web/src/store/plex.ts), with a test. /impeccable harden
- [P1] English Plex posters under French titles in the library: data, Thomas decides (keep, toggle, only customised). /impeccable clarify
- [P1] Show details load TMDB then Plex (+1005 ms, +1168 ms), palette computed twice: Show.tsx passes loading={show.loading} without metadataLoading. /impeccable harden
- [P2] Plex `original` backdrop is 3840x2160, 1.12 MB, behind a 4 px blur (TMDB original 281 KB): cap `original` at 1920 wide in transcodeOf. /impeccable optimize
- [P2] Palette contrast of the ticket (3.08:1, 2.69:1): pre-existing libs/palette algorithm, out of scope. /impeccable colorize

## Persona Red Flags
- Admin clearing the 3000-proposal queue: every opened card has no poster (P0).
- Phone PWA: 1.1 MB blurred backdrop per page (P2); 10 s wait per poster when Plex is unreachable.

## Minor Observations
- JWT in every image URL (store/plex.ts), to the security review.
- object-fit: cover crops a non 2:3 Plex poster.
- Detector: 3 findings in the touched files, all on pre-existing lines (Details.tsx:242, :264 layout-transition; Card.tsx:950 radius).

## Questions to Consider
- Is the goal "my Plex art" or "the art that makes me recognise the movie fastest"?
- Should the image source be a setting?
