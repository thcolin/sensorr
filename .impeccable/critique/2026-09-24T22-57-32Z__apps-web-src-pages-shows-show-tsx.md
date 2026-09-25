---
target: "the series page /tv/:id"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:apps/web/src/pages/Shows/Show.tsx"
target_fingerprint: "sha256:acdc4b6f1792df31d31fb1c614d40a4ca3b3500e8104d8e810a5c2f28d3e5960"
target_path: apps/web/src/pages/Shows/Show.tsx
timestamp: 2026-09-24T22-57-32Z
slug: apps-web-src-pages-shows-show-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

# Critique of apps/web/src/pages/Shows/Show.tsx (/tv/:id), 2026-09-25

Score: 21/40, Acceptable. Owner feedback on the same day: the series screens are inconsistent with their movie counterparts (placement, scale, component roles), the episode 'Owned' pill is deformed for its use, spacing and layout are left unpolished; fix, do not report.

## Assessment A (design review)
# Assessment A: design review of `/tv/:id`

I ran this in my own tab (isolated context `critique-a-show`, now closed) and only looked, apart from opening one season panel. Pages checked:

| Page | State |
|---|---|
| `/tv/1668` Friends | Ended, 228/228 owned |
| `/tv/2316` The Office | 2 pending proposals, S03 at 22/23, S04 at 10/14 |
| `/tv/221817` La Fièvre | 6 wanted episodes, aired 03/2024 |
| `/tv/1396` Breaking Bad | Not in library |

The Simpsons was open in another agent's tab, so I skipped it. I captured desktop 1440×900 and mobile 390×844. The captures are only in the MCP responses: saving to the scratchpad was refused because the path is outside the Chrome MCP's allowed roots.

## Design specificity verdict
The frame is Sensorr's own, but the core of the page is generic.
- **Frame:** it reuses the Details layout (billboard, poster palette, `Warning`), the emoji status set (📼 🍿 🛎️ 📅 🔕), Fira Code for machine data, and coverage labels like `S03`.
- **Core:** the proposal row is "release name, size, Accept, Refuse", and the season list is an accordion with a progress bar. Any Sonarr clone could use both unchanged.
- **Missing:** the transition pill, which DESIGN.md calls "the component that makes Sensorr look like Sensorr", appears nowhere on the page.

## Nielsen heuristics (21/40, Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Season headers show no 🛎️ or 🍿 count. The S04 row says 10/14 and hides that E02, E04, E06 and E08 are Proposed. La Fièvre has 6 episodes wanted for 18 months and nothing says whether they were searched. |
| 2 | Match with the real world | 3 | `S03`, `E01` and `22/23` are the user's vocabulary. "181/186 aired owned" reads awkwardly. TMDB's "Saison 1" and "Épisodes spéciaux" sit next to the English "24 episodes". |
| 3 | User control and freedom | 3 | Every follow toggle can be undone. Remove asks for confirmation. Auto has "Use the job setting". Refuse cannot be undone, by design. |
| 4 | Consistency and standards | 2 | The same follow checkbox is drawn at 10px (show), 16px (season) and 14px (episode). Episode columns don't line up with season columns. The status badge stretches to 362px. The proposal row leaves the Swaps pill vocabulary. |
| 5 | Error prevention | 2 | Auto squeezes three states into one checkbox. Accepting a 7.5 GB `S03` pack doesn't say it fills one missing episode. |
| 6 | Recognition rather than recall | 2 | To judge a proposal, you have to match it by hand with the season row further down. Auto says "Follows the job setting" without saying what that setting is. |
| 7 | Flexibility and efficiency | 2 | The season toggle is a good bulk action. But `Gestures shortcuts={false}` (`Proposals.tsx:27`) turns off A/R, there is no way to jump to incomplete seasons, and no manual search. |
| 8 | Aesthetic and minimalist design | 2 | 23 identical stretched "Owned" pills per season. A 0/93 grey bar for specials. An empty right column next to the controls. |
| 9 | Recognize, diagnose, recover from errors | 1 | Load errors use `Warning` with the message. But every write swallows its error: `Toggle.tsx:9`, `Actions.tsx:74` and `:88`, `Proposals.tsx:31` all `.catch(() => null)`. A failed toggle or Accept just snaps back with no message. |
| 10 | Help and documentation | 2 | Every show control has a help sentence that changes with its state, which is good. That text is set at 6.25px and can't be read (Issue 2). |

## Cognitive load
Three checklist items fail, so the load is moderate.
- **Visual hierarchy:** what needs the user comes late.
  - On desktop, proposals start around 1.3 screens down and seasons around 1.5 screens.
  - On mobile, proposals are at 1565px and seasons at 1875px, out of a 3625px page.
- **Working memory:** the user has to link the proposal row to its season, and remember what the job setting is.
- **Progressive disclosure:** the accordion is right, but it opens the wrong season. It opens the last one (S9, 23/23 owned) while S03 and S04 have gaps and proposals.
- **Decision point with more than 4 options:** the show control column. It holds Follow, Follow new seasons, the Policy select, Auto, Use the job setting and Remove from library: six controls with the same weight. The destructive action sits in the same column as routine toggles.

## Emotional journey
- **Arrival (high):** the Friends billboard and poster palette look good. The not-in-library state is calm: one button and one sentence.
- **Valley:** the control column's 6px text, and the search for what needs you, below 10 closed seasons.
- **Peak:** 228/228 on a full green bar feels like success.
- **End (negative):** the page ends on the "Épisodes spéciaux 0/93" empty grey bar. On Friends, specials show "TBA · 📅 Upcoming" for a show that ended in 2004. By the peak-end rule, a complete show ends on a failure.
- **High-stakes moment:** Accept on a 6–7.5 GB pack gives no reassurance about what it adds or replaces.

## Strengths
1. **Reuse:** the Details layout, poster palette, `Warning` and not-in-library state are the same as the movie page. This follows the principle "reuse what the app already draws".
2. **Seasons:** the accordion is well built. It has progress per season, a follow toggle per season as a bulk action, and specials last. The episode list is virtualized above 60 (`Seasons.tsx:8`). It uses `aria-expanded` and `aria-controls`. Machine data is in Fira Code, as the rules ask.
3. **Help text:** each show control states its consequence and changes with its state. Examples: "Sensorr searches nothing for this show", "Follow the show first", "Their files stay on disk".

## Priority issues

**Issue 1: episode rows split into three equal columns (P1)**
- **What happens:** `Seasons.tsx:274` sets `'>span': { flex: 1 }`. That selector matches three spans: the episode title, the `EpisodeStatus` badge root and the `Toggle` root. Each gets `flex: 1`.
  - At 1440px, each column is 362px wide.
  - The status pill becomes a 362px bar that reads like an empty input.
  - The episode toggle lands at x=990, while the season toggle is at x=1336.
  - At 390px, each column is 88px. Titles are cut to "Les nouvea…" next to an 88px emoji-only oval, with about 80px of empty space on the right.
- **Why it matters:** it is the most visible grid on the page, and on mobile the episode names can't be read.
- **Fix:**
  - Aim the rule at the title only, with `>span:first-of-type` or a dedicated element.
  - Give the badge and toggle `flexShrink: 0` and a natural width.
  - Line the trailing cells up with the season summary: the `5.5em` count, the `10em` bar and the toggle (`Seasons.tsx:167-183`).
- **Command:** `/impeccable layout`

**Issue 2: show controls render at 10px and 6.25px (P1)**
- **What happens:** `Actions.tsx:150` has a `'>span'` rule that styles section headings (`fontSize: 7`). It also matches the Toggle's root `<span>` (`Toggle.tsx:15`). Measured values:
  - checkbox: 10×10px
  - help text: 6.25px (`help` `fontSize: 7` stacks on the already shrunk 10px)
  - "Follow" heading: 10px
- **Accessibility:** the Follow checkbox's accessible name is its help sentence, and that sentence flips when toggled. The word "Follow" is an unlinked span. Auto has the same problem.
- **Why it matters:** these are the page's main controls. They are unreadable, and they miss touch targets by more than 4×.
- **Fix:**
  - Make the section heading its own element (`<h5>`, or a `label` tied to the input) with its own selector.
  - Put the help text on `aria-describedby`.
  - Drop the double `fontSize: 7`.
- **Commands:** `/impeccable typeset`, then `/impeccable harden`

**Issue 3: the proposal row lacks what the decision needs (P1)**
- **Rule:** PRODUCT.md says a proposal is decided on three things: language, disk space, and whether it's worth it.
- **What the row shows** (`Proposals.tsx:21-25`): coverage, raw release name and size.
- **Real cases:**
  - `S03`, 7.5 GB, fills 1 missing episode (22/23 owned).
  - `S04`, 6.26 GB, fills E02, E04, E06 and E08.
- **On mobile:** the release name is cut at "MULTi-VFF.…", so resolution and codec disappear.
- **Fix:**
  - Add "fills 4 of 14 · E02 E04 E06 E08", computed from the release's `coverage` against owned episodes.
  - Add a size transition pill, owned size to release size, reusing `Proposal.tsx`'s pill.
  - Add a language pill.
  - Link the row to its season so a click opens and scrolls to it.
- **Command:** `/impeccable shape` on the proposal row

**Issue 4: what needs attention is not put first (P2)**
- **What happens:** the default open season is the last one (`Seasons.tsx:34`), whatever its state. Season headers carry no status counts.
- **Why it matters:** PRODUCT.md says "put what matters first". Here the gaps are the least visible thing on the page.
- **Fix:**
  - Open the first season with wanted or proposed episodes, and fall back to the last one.
  - Add emoji counts to each header summary, for example `🛎️ 4 · 🍿 1`.
  - Consider moving the seasons above the fold on desktop, into the empty right column under the overview.
- **Command:** `/impeccable layout`

**Issue 5: Auto hides a third state (P2)**
- **What happens:** `Actions.tsx:79-90` has `checked={proposal_only === false}`. So an unchecked box means either "inherit the job setting" or "always ask", and the inherited value is never shown.
- **Why it matters:** getting this wrong downloads 3–40 GB packs with no one asked.
- **Fix:** use a three-option segmented control: Job setting (currently: ask) / Ask / Auto. At minimum, name the inherited value in the help text.
- **Command:** `/impeccable clarify`

## Persona red flags

**Alex, power user**
- A/R shortcuts are turned off on proposals (`Proposals.tsx:27`), though Swaps has them.
- No "next incomplete season" jump.
- No manual search on a show whose 6 episodes have been wanted since 03/2024.
- One-by-one Accept, with no "accept all proposals for this show".

**Sam, accessibility**
- 10px checkboxes (Issue 2).
- The Follow and Auto accessible names flip with their state.
- On mobile, episode status is emoji-only, with the label only in `title`.
- "Contribute to TheMovieDB" is `#333` on black, about 1.7:1 (inherited from Details).
- Accept uses white on `primary` at 2.04:1, a known recorded deviation.
- Failed writes are silent: no live region, no message.
- Accordion semantics are correct.

**Casey, mobile**
- Touch targets are 10, 14 and 16px against 44px.
- The first decision (proposals) is two full screens down.
- Episode titles are cut at 88px.
- Release quality is cut out of the proposal row.
- `title` tooltips are the only way to see full names, and they don't exist on touch.

## Minor observations
- **Missing air dates:** `episode.ts:12` treats `air_date == null` as `upcoming`. On Friends, 37 of 39 specials have no date and render "TBA · 📅 Upcoming" on an ended show. This breaks the principle "never claim more". Unfollowed specials also draw an empty bar (0/2, 0/93). Mute that summary to "Not followed".
- **Partial progress is green:** 22/23 is almost the same green bar as 23/23. The One Green Rule makes green mean "yes", and a partial season isn't one. Show the missing count, or keep the bar neutral until complete.
- **Owned pills are noise:** each owned episode repeats its "📼 Owned" pill. Consider muting owned rows and colouring only exceptions.
- **Confirm text:** `Actions.tsx:109` reads "from the library ? Their files", with a French space before "?" in an English string.
- **Show status:** Ended or Returning is not shown, only "1994 - 2004".
- **Episode rows:** the date column is hidden on mobile, which is fine. The `E01` code column is `minWidth: 3.5em` while the season count is `5.5em`, so the left edges don't line up either.

## Provocative questions
1. If a season is 23/23 owned and followed, why draw 23 rows that each say "Owned"? Should an owned row say nothing?
2. Is a proposal about a release, or about the missing episodes? Should the proposal live inside the season row it fills, instead of in its own band?
3. Sensorr is a VCR you program once. Does a per-show Auto override belong on the page you visit most?
4. What should the page say about an episode searched for 18 months with nothing found? Is "Wanted" still true, or is it a separate state?
5. Should "Remove from library" have the same weight and column as "Follow new seasons"?

## Assessment B (detector and browser)
The CLI scan came back clean, but the browser pass on four page loads found one real bug that belongs to this branch: the Follow and Auto help text renders at 6.25px. The other browser findings come from shared components or are false positives.

Method: Assessment B only (detector plus browser). No design review. Tab 9 (`isolatedContext=critique-b-show`) is still open, titled `[Human] Sensorr - Friends (1994)`. No file in the repo was changed: `git status` is clean.

## 1. CLI scan

| Target | Exit | Findings |
|---|---|---|
| `apps/web/src/pages/Shows` (10 files) | 0 | `[]` |
| `libs/ui/src/components/Show` (4 files) | 0 | `[]` |

- Running again with `--no-config` also returned `[]`, so no config, ignore file or inline comment is hiding anything.
- There is no `.impeccable/critique/ignore.md`, and no `impeccable-disable` comment in either folder.

## 2. Browser pass

**Preflight.** Both mutations worked: `document.title` changed and an injected inline `<script>` ran.

**Live server.** It started with `live-server --background` (pid 6284, port 8400). `detect.js` loaded on every page. I stopped it with `impeccable live-server stop` and checked that the port answers 000 and the pid is gone.
- `stop` printed `config_missing` while trying to remove a live script tag. No tag had been injected into any HTML entry, so there was nothing to remove.
- The server had created an untracked `apps/web/.impeccable/live/`. `stop` removed it.

**Logging in.** The new tab opened on `/login`, so I filled in `sensorr` / `sensorr`. The only thing clicked after that was Login itself.

Findings per page:

| Rule | 1668 Friends desktop (22) | 456 Simpsons (14) | 2316 Office, proposals (26) | 1668 mobile 390 (22) |
|---|---|---|---|---|
| clipped-overflow-container | 4 | 4 | 4 | 5 |
| layout-transition (height ×2, margin ×2, width) | 5 | 5 | 5 | 5 |
| undersized-ui-text, 10px labels `Follow`/`Policy`/`Auto`/`Episodes` + remove help | 5 | 1 (Add help) | 5 | 5 |
| undersized-ui-text, **6.25px** help under Follow / Follow new seasons / Auto | 3 | 0 | 3 | 3 |
| tiny-text 10px | 1 | 1 | 1 | 1 |
| tight-leading 1.2 | 3 (1 span, script, style) | 2 (script, style) | 5 (+2 in proposals) | 3 |
| low-contrast: white on `#04ae65`, 2.9:1 (PolicyInput pill) | 1 | 0 | 1 | 1 |
| low-contrast: white on `#01d076`, 2.0:1 (`Add to library` / `Accept`) | 0 | 1 | 2 | 0 |
| line-length ~122 chars (overview) | 1 | 1 | 1 | 0 |
| overused-font: Open Sans 70–90% | 1 | 1 | 1 | 1 |
| skipped-heading: `<h1>` then `<h4>` | 1 | 1 | 1 | 1 |

State of each page:
- **1668 Friends:** in the library, 228/228 episodes owned.
- **456 The Simpsons:** not in the library. It shows the `Add to library` state, not the owned state.
- **2316 The Office:** 2 pending proposals (S03, S04) and wanted episodes. I found it through read-only GETs on `/api/shows/metadata`.

Captures were taken at desktop 1440×900 and mobile 390×844 with the overlay on. They exist only in the tool output. The MCP refused to write into the scratchpad because it is outside its workspace roots.

## 3. What is real

**The 6.25px help text is a real bug in this branch.** Root cause:
- `Actions.tsx:150` styles `'>span'` with `fontSize: 7` (0.625em), semibold and grayDarkest. The intent is the block labels.
- `Toggle.tsx:14` wraps each toggle in a `<span>`, so that rule matches the wrapper too. The wrapper computes to 10px semibold.
- The help `<small>` (`Actions.tsx:176`, again 0.625em) then shrinks to 10 × 0.625 = 6.25px.
- I checked the computed chain: `SMALL 6.25px` sits under `LABEL 10px`, under `SPAN.wrapper 10px`, under the block `DIV 16px`.
- The "Follow new seasons" text is also semibold for the same reason.

**The 10px labels and help (fontSize 7) are real as measured.** They are below the 11px floor. They are a deliberate token choice here, so whether they are a defect is a design call.

**Found by the detector, but coming from shared code rather than this branch:**
- Line-length: the overview is 976px wide at 16px. It comes from `pages/Details/Details.tsx`, which the movie page shares.
- Skipped heading: `Details.tsx:114` renders the `<h1>` and `:122` / `:144` the `<h4>`.
- Low contrast: white on primary in the shared `Button variant='contain'` and the `PolicyInput` pill. The computed colour really is `rgb(255,255,255)`, so the ratio is a real measurement. It is a system-wide choice, not something Shows introduced.

## 4. False positives and noise

| Finding | Why |
|---|---|
| tight-leading on `<script>` / `<style>` | Not rendered text. |
| tight-leading on proposal `code`, `strong`, `span` and buttons | 1.2 is the `DESIGN.md` line-height token for small and monospace text. Single-line items. |
| overused-font (Open Sans) | It is the body font set in `DESIGN.md`. |
| layout-transition (margin 400ms on the `Details.tsx:209` and `:231` columns, height on the backdrop, width on the scrollbar) | All in shared layout or overlayscrollbars. None of them is in `pages/Shows` or `libs/ui/Show`. The Shows files only transition color, opacity and background-color. |
| clipped-overflow-container ×4–5 | Shared backdrop and Details wrappers (`Details.tsx:230` `overflow: hidden`) plus the nav. Nothing clipped in the Shows blocks. |
| Mobile horizontal overflow (`innerWidth` 559) | Caused by the detector's own labels and the nav's scrollable link row and off-canvas aside. `clientWidth` and `visualViewport` are both 390. |

## 5. Skipped or failed steps

- **The Simpsons is not in the library.** Its owned state (38 seasons) could not be examined. Only the `Add to library` state was scanned.
- **Mobile overlay capture.** Once scrolled, the overlay labels drift away from their elements because the live server was already stopped. Positions in that capture are not reliable.
- **Files kept in the scratchpad.** Only the detector JSON was saved there (`detect-pages.json`, `detect-ui.json` in the session scratchpad). Screenshots could not be written to disk.
