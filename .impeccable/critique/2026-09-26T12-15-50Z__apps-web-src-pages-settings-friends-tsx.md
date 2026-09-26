---
target: Settings/Friends wrapped line
total_score: 17
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/wrapped-donnees/apps/web/src/pages/Settings/Friends.tsx"
target_fingerprint: "sha256:f48a7803cd5fd13b7d9136a255e05b6927d2ff1d8f0356a54d6d8e9d53cd5713"
target_path: /Users/thcolin/orca/workspaces/sensorr/wrapped-donnees/apps/web/src/pages/Settings/Friends.tsx
timestamp: 2026-09-26T12-15-50Z
slug: apps-web-src-pages-settings-friends-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

Scope: the "Wrapped · …" line and its "Copy link" / "New link" buttons under each guest, `apps/web/src/pages/Settings/Friends.tsx:79-105`. Operate mode.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | "looking for them in Tautulli..." never resolves when the fetch fails (`:21` only warns) |
| 2 | Match System / Real World | 2 | Copy says Tautulli; matching reads the `viewers` collection synced by the wrapped job |
| 3 | User Control and Freedom | 2 | `DELETE /wrapped/tokens` exists with no UI; a link dies only by minting a new one |
| 4 | Consistency and Standards | 2 | Jobs.tsx:44-60 explains a disabled control with a linked warning; here it is silent |
| 5 | Error Prevention | 1 | "New link" enabled for a guest not found, copies a link that 404s |
| 6 | Recognition Rather Than Recall | 3 | Two labelled buttons |
| 7 | Flexibility and Efficiency | n/a | Single admin, rare action |
| 8 | Aesthetic and Minimalist Design | 3 | Short line; "Wrapped" undefined |
| 9 | Error Recovery | 1 | Error toast says "creating" even when only the clipboard failed |
| 10 | Help and Documentation | 1 | Nothing says why a guest is not found |
| **Total** | | **17/36** | Poor |

## Design specificity
Mostly generic: reuses `Button outline gray` and `small`, but the state is prose; DESIGN.md:495 and :646 ask for a `Badge` for a state.

## Detector
CLI: `[]`, exit 0. Browser (1440 and 390): 8 and 7 anti-patterns, none in the new block (low contrast of the green button and sidebar tagline, intro line length, tight-leading on script/style nodes, overused font, clipped overflow on the layout shell). Measured: outline button border 1.61:1 against the card, disabled text 3.55:1 (exempt), tap targets 38px high, no horizontal overflow at 390.

## Priority Issues
- **[P1] New link yields a dead link** for a guest without a viewer (`:96`). Fix: disable on `!viewer` like Copy.
- **[P1] Endless loading state** on fetch failure (`:17-22`, `:81`). Fix: error state with retry.
- **[P1] Disabled Copy link without a reason, inaccurate copy.** Fix: "no Tautulli user with this email", link to the jobs settings like Jobs.tsx:47-57.
- **[P2] State as grey prose** instead of a `Badge` (DESIGN.md:495).
- **[P2] Ambiguous accessible names**: "Copy link" / "New link" repeat per guest. Fix: aria-label with the guest name.

## Persona Red Flags
- Power user: cannot see whether a token exists; Copy silently writes a token server side.
- First-timer: "Wrapped" is undefined and the linked page does not exist yet.

## Minor Observations
- Disabled outline border ~1.2:1, nearly invisible.
- Native UA focus ring, same as the shared Button everywhere.
- Mobile: the two buttons stack in a 160px column; "not found in / Tautulli" breaks mid-phrase.
- Clipboard write after an `await` can lose user activation on Safari iOS.
- Pre-existing: missing `key` on the guests `map`, avatars without `alt`.

## Questions to Consider
- Should a copyable link ship before the `/wrapped/:token` page exists?
- Does the rare, revoking "New link" deserve the same weight as Copy?
