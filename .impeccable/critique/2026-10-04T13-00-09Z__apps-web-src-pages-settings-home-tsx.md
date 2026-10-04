---
target: "Home rows and lists: Settings Home, Settings Lists, Save as list"
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/home-discover/apps/web/src/pages/Settings/Home.tsx"
target_fingerprint: "sha256:35549517f1a67d78d53d58981053268e4a6de50ca2efdebb519c0925eeea6107"
target_path: /Users/thcolin/orca/workspaces/sensorr/home-discover/apps/web/src/pages/Settings/Home.tsx
timestamp: 2026-10-04T13-00-09Z
slug: apps-web-src-pages-settings-home-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Targets: apps/web/src/pages/Settings/Home.tsx, apps/web/src/pages/Settings/Lists.tsx, apps/web/src/components/Lists/SaveAsList.tsx

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Edits staged until Save with no dirty state; Save below the fold on Home |
| 2 | Match system / real world | 3 | `with_genres:` leaks the TMDB API key |
| 3 | User control and freedom | 2 | Edit/Open leave Lists and drop unsaved edits |
| 4 | Consistency and standards | 3 | h5 color differs from siblings; typed name in Fira Code |
| 5 | Error prevention | 3 | Confirm on delete, last-source ✕ disabled |
| 6 | Recognition rather than recall | 2 | "🍻 Requests" and "Trending" twice in Add a row |
| 7 | Flexibility and efficiency | 2 | Enter blocked in the panel name; one Save for three Homes unsaid |
| 8 | Aesthetic and minimalist design | 3 | `built-in` column is noise |
| 9 | Error recovery | 3 | Toast on failure, input kept |
| 10 | Help and documentation | 3 | Clear intro, long on mobile |
| **Total** | | **26/40** | Acceptable |

Design specificity: authored for Sensorr. Rows copy Policies, emoji are the icons (DESIGN.md), the 🔒 in place of the checkbox keeps the row geometry.

Detector: CLI 1 finding, layout-transition Capsule.tsx:65 (moved unchanged from Update.tsx, ignored). Browser: skipped-heading h2 "Discover" → h5 "Save as list" (real, new); white on primary 2.0:1 is the documented DESIGN.md deviation; Discover grid findings predate the work.

## Priority issues
- [P1] Lists loses staged edits on Edit/Open. Fix: disable Edit/Open while lists differ from config, title "Save first"; confirm text "once you Save". /impeccable harden
- [P1] Pin on defaults to Browser only. Fix: default ['all', media]. /impeccable clarify
- [P2] Duplicate labels in Add a row (Requests, Trending). Fix: add the row's i18n title to the option. /impeccable clarify
- [P2] Save as list heading pale (text on primary) and skips heading levels. Fix: whitePure, h4. /impeccable polish
- [P2] No unsaved state on Home and Lists. Fix: sticky Save bar. /impeccable harden

## Persona red flags
- Power user: Enter blocked in the panel name; no affordance for rename in place.
- Admin on the PWA: Pin on misses the Movies Home; Pinned column hidden at 390 px; placeholder clipped.

## Minor observations
- Typed list name set in Fira Code (Monospace-Means-Machine).
- Media `movie`/`tv` on Lists vs `Movies`/`TV` on Home.
- "Availble" typo pre-exists in translations.

## Questions
- Should Save store filters not applied yet? (Controls passes the panel's current values, by design D3.)
- Does the built-in/list column earn its width?
