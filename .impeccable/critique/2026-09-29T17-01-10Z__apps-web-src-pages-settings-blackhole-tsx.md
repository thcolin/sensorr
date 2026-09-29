---
target: Settings > Blackhole
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Settings/Blackhole.tsx"
target_fingerprint: "sha256:8b10b08cd335b91c19588208c8c06c7e9d92fbf0218b407d83c44fd989e34c59"
target_path: /Users/thcolin/Projects/perso/sensorr/apps/web/src/pages/Settings/Blackhole.tsx
timestamp: 2026-09-29T17-01-10Z
slug: apps-web-src-pages-settings-blackhole-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + browser, isolated)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Nothing shows what the setting changes; the Save toast confirms the write only |
| 2 | Match System / Real World | 2 | "left aside" is not the app's word; the policy says withdrawn |
| 3 | User Control and Freedom | 3 | Reversible, nothing applies before Save |
| 4 | Consistency and Standards | 2 | No emoji on the title unlike Jobs toggles (`Jobs.tsx:388`); intro still says `.torrent` or `.nzb` only |
| 5 | Error Prevention | 1 | Turned on with Transmission, `.magnet` files are never read and the movie counts as recorded |
| 6 | Recognition Rather Than Recall | 2 | Nothing ties the 🧲 reason on search results back to this toggle |
| 7 | Flexibility and Efficiency | 2 | Keyboard works; nothing more expected of a one-time setting |
| 8 | Aesthetic and Minimalist Design | 3 | Quiet; help is one 150-character line at desktop width |
| 9 | Error Recovery | 2 | 422 messages are clear; an unread `.magnet` file raises nothing |
| 10 | Help and Documentation | 2 | Help names one client, no rule |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

LLM assessment: the element reuses the house `Option` pattern as Wrapped and Jobs do, and the policy and API messages name this screen. It misses the app's emoji-as-icon convention and does not connect to the 🧲 reason shown elsewhere.

Deterministic scan: `impeccable detect` on `Blackhole.tsx` returns 0 findings. The browser overlay reports page-wide findings: `low-contrast` white on the brand green `#01d076` (Save button, nav link, 2.0:1, from `libs/theme`), `#333` on `#0a0a0a` (unattributed), `line-length` about 128 characters on the two intro paragraphs, `tight-leading` 1.2 on three elements, `clipped-overflow-container` on three header divs at 390 px. `tight-leading` on `<script>` and `<style>` are false positives. None points at the new element; all predate the change.

## What's Working

- Reuses `Option` exactly as `Wrapped.tsx:157` and the Jobs toggles: no second checkbox drawn.
- Placed under Movies only, which matches the product rule that shows need the `.torrent` file list.
- The whole row is the label, so the tap target is full width on mobile, with a focus ring from `Option.tsx:71`.

## Priority Issues

- **[P1] The help text cannot answer "does my client work?"** Named only qBittorrent, as an example. Transmission's watch folder reads `.torrent` only. Fix: state the requirement, then name one that does and one that does not. Command: /impeccable clarify
- **[P1] What "off" does is not in the app's words.** "left aside" versus the 🧲 reason. Fix: `emojize('🧲', 'Magnet links')` as in `Jobs.tsx:388`, and say withdrawn. Command: /impeccable clarify
- **[P2] The intro contradicts the option.** `Blackhole.tsx:20` says `.torrent` or `.nzb` only; the Shows paragraph does not say shows never take magnet links. Command: /impeccable clarify
- **[P2] In Docker mode the only editable control reads as locked.** It sits right under the note telling to edit `.env`. Fix: its own spacing step, separated from the directory block. Command: /impeccable layout
- **[P3] On mobile the checkbox centres on the 3rd of 5 lines.** `Option.tsx:56` `alignItems: 'center'`, same on Jobs. Command: /impeccable polish

## Persona Red Flags

- **Alex (power user):** will not read the 12 px line; the title does not warn it depends on the client.
- **Sam (screen reader):** the accessible name of the checkbox is the whole paragraph, same as every `Option` in the app.
- **Taylor (new user on Transmission):** "as qBittorrent does" reads as an example, not a requirement; turns it on, failure shows days later in the library.

## Minor Observations

- Two identical "New version available" toasts stack on mobile (`Settings.tsx:50`), predates the change.
- `Option` focus ring is a `box-shadow`, predates the change.
- Before capture on mobile shows the loading splash only.

## Questions to Consider

- Should the setting show what it did, like the count of 🧲 withdrawals in the last `record`?
- Would a "download client" choice derive this instead of a checkbox, now that others will run Sensorr?
- Should Sensorr notice a `.magnet` file still in the blackhole hours later?
