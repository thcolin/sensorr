---
target: apps/web/src/pages/Home/Home.tsx (PWA section homes)
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Home/Home.tsx"
target_fingerprint: "sha256:ef11cd5654b9a86af5b65e5ecfe8ebf0baf0b6dabf8e58148f857e6b9568ba21"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Home/Home.tsx
timestamp: 2026-09-30T14-46-44Z
slug: apps-web-src-pages-home-home-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 22/36 (Acceptable), heuristic 10 n/a (one expert admin)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 2 | A sub-page shows no name since the Secondary row is gone (`/tv/library` shows "636 Results" only) |
| 2 | Match real world | 3 | Row "Airing" opens the Calendar page |
| 3 | User control | 3 | Back is reliable; tapping the active tab does not scroll its home to the top |
| 4 | Consistency | 2 | "Trending" on Movies, "Trending Shows" on TV; Stars "Your Calendar ›" switches the active tab to Movies |
| 5 | Error prevention | 3 | Homes only navigate |
| 6 | Recognition | 2 | The list of sub-pages is no longer visible; Swaps disappears at 0 |
| 7 | Flexibility | 2 | Library to Calendar costs back + scroll + tap instead of one tap |
| 8 | Minimalism | 3 | Clean, 2.3 rows per screen |
| 9 | Error recovery | 2 | With `hide`, a failed fetch looks like an empty row |

## Design Specificity Verdict
Content specific to Sensorr (state badges, ProgressPill, emoji vocabulary), layout the generic streaming rows reused from `/`. Detector: CLI 0 findings on 7 files. Browser: `undersized-ui-text` on poster card metadata (8-10 px), shared with `/`, not introduced here; `text-occlusion`, `buried-raster`, `ai-color-palette` are false positives (opacity 0 backdrop, lazy placeholders, app accent).

## Priority Issues
1. [P1] Sub-pages have no visible name. Fix: page label from `SECONDARY` in the PWA header between back chevron and search. /impeccable clarify
2. [P1] Row order opens on TMDB Trending, Swaps 4th, Airing 3rd (PRODUCT.md "put what matters first"). Owner chose the order of `/` at framing. /impeccable distill
3. [P2] Stars "Your Calendar ›" goes to `/movie/calendar` and switches the tab to Movies. Fix: `/person/calendar` alias or no `›` on Stars. /impeccable clarify
4. [P2] Hidden empty rows leave `/movie/swaps` and `/tv/requests` unreachable at 0. Owner chose `hide`. /impeccable harden
5. [P2] Row title link 130x24 px, back chevron without accessible name (both pre-existing). /impeccable adapt

## Persona Red Flags
- Admin on a phone: clearing Swaps means scrolling past three rows; at 0 no confirmation there is nothing to do; Stars Calendar lands in Movies.
- Power user: tapping the active tab does not scroll a 2392 px home back to top.
- Screen reader: back and search buttons have no accessible name; row titles are plain links, no headings.

## Minor Observations
- "Shows" suffix redundant on the TV home.
- Stars Trending `more.title` uses `items.movies.trending.more`.
- `untilBirthday` uses a 365-day modulo: off by one day around leap years and for 29/02 births.

## Questions to Consider
- Should each home open on what the machine did rather than on TMDB Trending?
- Could the header title be a sibling switcher?
