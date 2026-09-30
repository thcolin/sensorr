---
target: Jobs header and job launcher, mobile
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Jobs/Jobs.tsx"
target_fingerprint: "sha256:e16914c0f8bc9fe1fc4cba4311964b88a60e4564d2d5547e6fa92398d041e30d"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Jobs/Jobs.tsx
timestamp: 2026-09-30T14-15-13Z
slug: apps-web-src-pages-jobs-jobs-tsx
---
Method: dual-agent (A: design review · B: detector and browser overlay)

## Design Health Score: 24/40

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | A failed job shows ✓ in the mobile chip; 💢 comes last |
| 2 | Match with the real world | 3 | `all` counts piles, a command pill counts jobs |
| 3 | User control and freedom | 2 | Enter runs at once; focus is lost after the mobile Drawer closes |
| 4 | Consistency and standards | 2 | White on `primary` (2.04:1) for titles and ▶; the chip on `accentDark` (3.72:1) |
| 5 | Error prevention | 2 | The desktop palette opens with `record` movies armed; Enter on a running row stops it |
| 6 | Recognition rather than recall | 3 | Descriptions cut with an ellipsis, no `title` |
| 7 | Flexibility and efficiency | 2 | No type-ahead, no hotkey to open the palette |
| 8 | Aesthetic and minimalist design | 3 | Green slab Modal on desktop; mobile head repeats the job view's hero |
| 9 | Error recovery | 2 | "Needs plex, see Settings" is not a link |
| 10 | Help and documentation | 2 | On touch, nothing says "tap again to run" |

## Design specificity
Authored for Sensorr: the job is the head's title in Fira Code, emoji and grouping follow the app's vocabulary. Against the sober brief: the desktop Modal is framed in `primary`, and on mobile the head and the job view below show the same facts.

Detector: CLI 8 advisory `design-system-radius` (em radii outside the DESIGN.md scale). Browser overlay: `low-contrast` white on `primary` 2.0:1 and on `accentDark` 3.7:1, confirming A; `undersized-ui-text` hits are mostly poster-card content of the keep-in-touch view, outside this diff. The measured horizontal overflow at 390px was a mid-transition reading: `scrollWidth` equals `clientWidth` (390) once settled.

## Priority issues
- [P1] Mobile Drawer not accessible: no focus management, no dialog name, unnamed shadow and knob buttons (`libs/ui/src/atoms/Drawer/Drawer.tsx`). Fix: share the Modal's focus logic, `aria-labelledby`, `aria-hidden` on shadow and knob.
- [P1] Desktop palette armed on row 0 (`StartJob.tsx`, `useState(touch ? -1 : 0)`); Enter on a running row stops it behind a native `confirm()`.
- [P1] White on `primary` for "Jobs", "Start a job" and ▶ (2.04:1), and the mobile chip on `accentDark` (3.72:1), both asked by the owner; to decide.
- [P2] Command pills 22px tall on mobile, under WCAG 2.5.8's 24px.
- [P2] Touch selection nearly invisible: `accentDarker` on `accentDarkest` is 1.24:1, plus an 11px ▶.

## Fixed in this run
`h5` inside the head button became `code`; the status icon has `role=img` and a label; the button has `aria-haspopup=dialog`.

## Persona red flags
- Power user: no hotkey, no type-to-filter; the palette clips at 900px height.
- Mobile one-handed: ▶ and ✕ sit at the top; pills 22px.
- Screen reader: Drawer focus and naming (above).

## Minor observations
Empty state still says "start one manually from Settings" and has no ▶; the keep-in-touch view shows "📺 Shows"; `migrate sonarr` puts `SONARR` in the type badge; Drawer motion is 300ms easeInOut and ignores reduced motion.

## Questions
- Should a launcher that writes to production have a default row at all?
- On mobile, is the head the job's title or the history button?
