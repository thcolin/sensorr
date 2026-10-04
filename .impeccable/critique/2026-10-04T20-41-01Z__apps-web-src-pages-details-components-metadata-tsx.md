---
target: metadata block with Lists field
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/home-discover/apps/web/src/pages/Details/components/Metadata.tsx"
target_fingerprint: "sha256:dcffefa07c3193d0dcae7f1600db03ced02a19b13f798eb1d1890de73d3507f4"
target_path: /Users/thcolin/orca/workspaces/sensorr/home-discover/apps/web/src/pages/Details/components/Metadata.tsx
timestamp: 2026-10-04T20-41-01Z
slug: apps-web-src-pages-details-components-metadata-tsx
---
Method: dual-agent (A: design review, opus · B: detector + browser, sonnet)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Show Lists has no pending/disabled lock, unlike its fieldset neighbours |
| 2 | Match System / Real World | 3 | "Lists" matches the nav |
| 3 | User Control and Freedom | 3 | A list created by typing is not undone |
| 4 | Consistency and Standards | 2 | Lists outside the `fieldset aria-labelledby` pattern of the show fields |
| 5 | Error Prevention | 3 | Enter on a typo creates a permanent list, the bulk action confirms |
| 6 | Recognition Rather Than Recall | 3 | Existing lists in the menu |
| 7 | Flexibility and Efficiency | 3 | Keyboard creatable select |
| 8 | Aesthetic and Minimalist Design | 3 | Help text repeats the placeholder |
| 9 | Error Recovery | 2 | Failure only in the context toast, nothing at the field |
| 10 | Help and Documentation | 3 | Help present |
| **Total** | | **27/40** | Good |

## Design Specificity Verdict
LLM: fits the product; Lists reuses QueryInput chips, label/help pattern and tokens. The 3-row grid aligns on movie and show (Terms/Lists/Refine at x 384, Years/Policy/Shrink at x 1045).
Detector: CLI 1 advisory finding, `design-system-radius` Metadata.tsx:386, pre-existing. Browser overlay on the movie page: 3 findings, none in the metadata block (footer tagline contrast, 2 false positives on script/style). Show page: page-wide counts, not scoped.

## Priority Issues
- [P1] Job editors (ProcessMovies.tsx:449,469, ProcessShows.tsx:341, help=false) now render Terms | Years then Policy alone in the wide column. Fix: keep the former one-row grid when the block has no Lists.
- [P1] Proposals/Card.tsx:214 renders Metadata with help=true, so every proposal card gets Lists. Fix: gate ListsInput behind its own prop, not help.
- [P2] No accessible name: Lists, Terms, Years comboboxes have no aria-label/labelledby; show Lists not in a fieldset lock. Fix: id on the label span, aria-labelledby through QueryInput; fieldset on show Lists.
- [P2] Mobile order Terms, Years, Lists, Policy splits the search group.
- [P3] Help text repeats the placeholder, "it" has no referent; the small is always rendered regardless of help.

## Persona Red Flags
Keyboard admin: a typo + Enter creates a permanent list; unnamed combobox for screen readers.
Phone PWA: six blocks about 500px before the synopsis; the green + on an empty Lists field.

## Minor Observations
Long list names clip in the `wide` block (overflow hidden). Movie Lists renders before metadata loads, show Lists waits. Restored Details/components/Actions.tsx keeps the pre-#365 Preferences panel unreachable (expandable=false), as before #365.

## Questions to Consider
Should Lists sit next to the title as chips, visible without opening the details? Why is creating a list here one keystroke when the bulk asks?
