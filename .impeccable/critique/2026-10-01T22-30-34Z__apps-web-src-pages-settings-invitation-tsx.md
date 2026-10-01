---
target: Settings › Friends › Invitation
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/friends-import/apps/web/src/pages/Settings/Invitation.tsx"
target_fingerprint: "sha256:92c4cc6af5a3f49dfaafed1a9d283fb8b351a18d83c7f430fbccfd1f9dfb97e8"
target_path: /Users/thcolin/orca/workspaces/sensorr/friends-import/apps/web/src/pages/Settings/Invitation.tsx
timestamp: 2026-10-01T22-30-34Z
slug: apps-web-src-pages-settings-invitation-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser). A could not load the live page (the session's own tab held the six HTTP/1.1 connections of :4210) and judged from the code; B ran the detector in the page.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | A partial failure lives only in a toast that disappears |
| 2 | Match System / Real World | 3 | Copy promises "who watches the most, first", the sort is by last activity |
| 3 | User Control and Freedom | 3 | Confirm on batch and re-invite, none on a single invite |
| 4 | Consistency and Standards | 2 | `disabled` + `title` on Invite, Friends.tsx uses `aria-disabled` on purpose |
| 5 | Error Prevention | 3 | Already invited are left out of the batch |
| 6 | Recognition Rather Than Recall | 2 | "Invite again" only on hover, invisible on touch |
| 7 | Flexibility and Efficiency | 1 | 82 rows, no search, no filter |
| 8 | Aesthetic and Minimalist Design | 2 | 8 filled green buttons stacked, plus the green bar |
| 9 | Error Recovery | 2 | Nothing in the row says a send failed |
| 10 | Help and Documentation | n/a | Admin-only settings |
| **Total** | | **20/36** | **Acceptable** |

## Design Specificity Verdict
Authored for Sensorr: Guests row grid, avatar and ellipsis; Library's Select All and Bulk; the Tautulli activity line. Generic: a column of identical green CTAs, and a hover text swap the app uses nowhere else.

Deterministic scan: CLI clean on Invitation.tsx and Friends.tsx. In page, detect.js reported 11 patterns: in the segment only `tight-leading` on the pre-existing 🌍 `<small>`; `low-contrast` white on #01d076 on the Wrapped Save button (pre-existing, DESIGN.md:766 deviation, which the row Invite buttons repeat); 5 `clipped-overflow-container` on the app scroll shells, false positives.

## Priority Issues
- [P1] Column of filled primary buttons. One Green Rule (DESIGN.md:355): green means the system says yes; white on primary is 2.04:1. Fix: row Invite as `variant='outline'`, keep the fill for the Bulk action and the free field. Command: /impeccable polish
- [P1] "Invite again" invisible on touch, and the swap changes the column width. Fix: "Invited 2 Oct" as fixed small text plus a small always-visible "Again" button. Command: /impeccable polish
- [P2] Copy contradicts the sort. Fix: "who watched most recently first". Command: /impeccable clarify
- [P2] Disabled checkbox on an invited row looks live. Fix: an empty cell of the same width. Command: /impeccable polish
- [P2] Partial failure leaves no trace in the row. Fix: "not sent: <reason>" on line 2 until the next try. Command: /impeccable harden

## Persona Red Flags
Alex: no search across 82 names, no filter, 164 tab stops. Sam: disabled Invite unreachable by focus so its title reason is lost; checkbox tap target about 16 px.

## Minor Observations
`noreferer` typo copied from Friends.tsx; email truncated on mobile; two phrasings of the success toast; the box takes 448 of 844 px on a phone; the toggle below jumps when the list arrives.

## Questions to Consider
Should "never seen" share the scroll with active friends? Is the single invite meant to go without confirm while re-invite asks? Is tying the free field to "Anyone with a Plex account" deliberate?
