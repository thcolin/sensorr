---
target: "the series page /tv/:id"
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:apps/web/src/pages/Shows/Show.tsx"
target_fingerprint: "sha256:e55ce61a09d35f207c680038213dbe464b90a42aa36f8de42296be03cf185dfa"
target_path: apps/web/src/pages/Shows/Show.tsx
timestamp: 2026-09-25T07-03-11Z
slug: apps-web-src-pages-shows-show-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

# Critique of apps/web/src/pages/Shows/Show.tsx (/tv/:id), second run, 2026-09-25, on 80ea56c after the parity pass

Score: 23/40, Acceptable.

## Assessment A
The `/tv/:id` critique is below. I checked it on the local bench (port 4453) with Friends, The Office (2 pending proposals), Brothers (2 pending, unaired episodes) and The Simpsons (not in the library), at 1440×900 and 390×844. My own tab is closed. I clicked nothing that writes and wrote no file in the repo. The heuristics total 23/40, in the Acceptable band (20–27). The most serious problem: the page tells the user something false about owned episodes on double-episode files, and then proposes packs to fix it.

## Design-specificity verdict

The vocabulary belongs to Sensorr; the layout is the standard one for this kind of app.
- **Specific to Sensorr:**
  - the coverage label (`S03`, `S01E01`) and "fills 1 of 23 · E11";
  - the owned/aired count as the unit of progress;
  - the file parsed in Fira Code on each episode row (`720p · MULTi · 156 MB`);
  - the green ✓ only when a season is complete (One Green rule respected);
  - the `#season-N` deep link.
- **Standard for the category:** seasons as an accordion with progress bars and a settings form above them. Sonarr has the same thing.
- **Missed chance:** the proposal row, where the policy decision matters most, does not use the transition pill (DESIGN.md calls it the component that makes Sensorr look like Sensorr). It reuses `Release` with `valid: true` forced (`Proposals.tsx:37-42`), so every axis shows as a neutral grey badge.

## Nielsen heuristics (23/40)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Per-season counts and bars are clear. The show-level summary (181/186 · 29.52 GB) sits below the settings, the overview and the proposals: 2228 px down on a phone. Whether the show is followed is only a poster badge. |
| 2 | Match with the real world | 2 | The group "Auto" has an option also called "Auto" (`Actions.tsx:8-12`, `:53`). "Jobs" means "inherit". The file column says `MULTi` for `the_office_us_s04e01-02_VOST-FR-EN_x265_720p`. French TMDB text ("Saison 1", "Épisodes spéciaux") sits next to English chrome ("24 episodes"). |
| 3 | User control and freedom | 3 | Toggles can be undone, and Remove asks a native `confirm()` first. There is no Ban on this page, but the notifications pane has one. So a refused release comes back on the next `record` run. |
| 4 | Consistency and standards | 2 | Following the show is a poster badge. Following a season is a checkbox in a column labelled "Follow", but the "All seasons" row under that label has no control. Proposals use neutral badges instead of the pill. Errors are toasted in Notifications (commit `0f89c78`) but not here. |
| 5 | Error prevention | 2 | "Fills 1 of 23" is the only hint that 7.5 GB buys one episode. Double-episode files produce false "Proposed" episodes and a 6.26 GB pack to "fill" them. |
| 6 | Recognition over recall | 3 | Owned / upcoming / not-followed are emoji-only circles (📼 📅 🔕) with just a `title` tooltip. Wanted and Proposed do carry a label. |
| 7 | Flexibility and efficiency | 2 | Following a whole season at once and the deep link are good. The A/R keys are turned off (`shortcuts={false}`, `Proposals.tsx:45`), and there is no way to answer all of a show's proposals at once. |
| 8 | Aesthetic and minimalist design | 3 | Clean and dense. Noise: a 🛎️ on the title and on every row, "fills 1 of 1", and about 1000 px of empty space between a season's name and its bar at 1440. |
| 9 | Recognize and recover from errors | 1 | A failed Accept, Refuse, follow or episode toggle is silently reverted: `Proposals.tsx:49`, `Show.tsx:64`, `Toggle.tsx:9` and `Actions.tsx:32,91` all end in `.catch(() => null)`, and the context says nothing for a single show (`ShowsMetadata.tsx:176-179`). |
| 10 | Help and documentation | 2 | Help lines under the settings are good. Episode states are explained only by tooltips. The policy help is cut off to "sor…" on desktop (`Actions.tsx:47`). |

## Cognitive load

Three checklist items fail and one partly fails: moderate load.
- **Visual hierarchy fails.** The first block under the title is a six-control settings form. What the show is waiting for comes later.
- **Minimal choices fails.** The settings block shows six options at one decision point: the policy select, three radios, "Follow new seasons" and "Remove from library". A destructive action sits at the same level as the settings.
- **Chunking fails.** When The Simpsons is not in the library, it shows 39 flat season rows that do nothing, before the recommendations.
- **Working memory partly fails.** You have to remember what the emoji-only statuses mean.

## Emotional journey

- **Arrival is strong:** billboard, trailer and the poster's palette.
- **Then a valley:** an admin form (Policy, Auto, Remove from library) before anything about the show's state.
- **The peak, answering a proposal, has no reassurance.** Nothing says the language improves (VOST to VFF), what 7.5 GB brings, or whether the policy holds. After Accept the row just disappears, even when the request failed.
- **The end depends on the show.** A complete show (Friends, all ✓, 112.79 GB) feels good. An incomplete one ends on recommendations, and the wanted count is never totalled.

## Strengths

1. **Season grid.** Count, bar, ✓ and follow share one grid track with the header (`SUMMARY`, `Seasons.tsx:18`), with tabular figures. You can scan 10 seasons in one look.
2. **Episode row follows the type rules.** Fira Code for machine values (`E01`, file parse, date), Open Sans for titles. The synopsis folds open. The list is virtualized past 60 episodes. The season that waits on something opens first.
3. **Reuses what the app already has.** The Details layout, `Release` and `Gestures` are reused, and the coverage label names the concept that is new to shows.

## Priority issues

**[P1] The proposal row hides what the decision rests on.**
- **Why it matters:** PRODUCT.md says a proposal is decided on language, disk cost and worth. The row shows none of these next to what is already owned. The Office S03 is 8 057 886 847 bytes for coverage `[S03E11]`, with 22 episodes already owned at about 150 MB each. The policy verdict is hidden by the forced `valid: true` (`Proposals.tsx:37-42`).
- **Fix:**
  - render the axes as transition pills: the owned episodes' value under the proposed one (language `VOST` to `VFF`, resolution 720p to 1080p), held or broken per the policy;
  - write the size as "7.5 GB for 1 episode" in the coverage cell (`Proposals.tsx:30-34`);
  - hide the "fills" line when the total is 1.
- **Command:** `/impeccable shape`, then `/impeccable clarify`.

**[P1] Answers and toggles fail silently.**
- **Why it matters:** Accept and Refuse cannot be undone. A failed request just brings the row back, with nothing to say it failed. The notifications pane got `toast.error` in `0f89c78`; this page did not.
- **Fix:** reuse that pattern, `toast.error('Error while answering the proposal')`, in the `onGesture` catch (`Proposals.tsx:49`). Do the same for `setState` (`Show.tsx:64`) and `Toggle` (`Toggle.tsx:9`), or make `setShowMetadata` toast for single ids too (`ShowsMetadata.tsx:176`).
- **Command:** `/impeccable harden`.

**[P1] The page says more than it knows about owned episodes.**
- **Evidence:** in The Office S04, E01's file is `the_office_us_s04e01-02_…` and E03's is `…e03-04…`. Yet E02, E04, E06 and E08 show as "Proposed", the season reads 10/14, and a 6.26 GB S04 pack is proposed to "fill 4 of 14". The same file is labelled `MULTi` when it is VOST (`Seasons.tsx:372-378`).
- **Why it matters:** a false "wanted" leads straight to a wrong Accept, and PRODUCT.md says never to claim more than the policy decided.
- **Fix:**
  - read episode ranges (`e01-02`, `E01E02`) when `sync-shows` matches files, and mark every episode in the range owned;
  - the File cell should show the range it covers;
  - show the language oleoo actually parsed, or nothing, rather than a guess.
- **Command:** `/impeccable harden`. The root cause is in the sync job, not this screen.

**[P2] The show's status is below the fold, behind the settings.**
- **Why it matters:** the design you validated puts owned/aired and size under the billboard. They are in the "All seasons" header instead (`Seasons.tsx:81-95`). On a phone: settings at 855 px, proposals at 1641 px, seasons at 2228 px, with an 844 px viewport.
- **Fix:**
  - put a line like `181/186 · 29.52 GB · 🛎️ 2 · 🍿 n` in `ShowSubtitle`, next to the year (`Details.tsx:339-345`);
  - consider closing the settings `<details>` by default once the show has a policy (`Details.tsx:145`, `metadataState ?? true`);
  - move "Remove from library" below the seasons.
- **Command:** `/impeccable layout`.

**[P2] The follow and auto controls are named and placed inconsistently.**
- **Why it matters:** the "Follow" column label (`Seasons.tsx:93`) has no control under it. "Follow the show first" (`Actions.tsx:109`) points to a poster badge 500 px away. And the "Auto" group contains an "Auto" option.
- **Fix:**
  - put the show-level follow toggle in the "All seasons" row, in that Follow column, so the show and its seasons use the same control;
  - rename the group, for example "Downloads", with options "As jobs", "Ask first" and "At once".
- **Command:** `/impeccable clarify`.

## Persona red flags

**Alex (power user, keyboard, clears the backlog in sittings)**
- The A and R keys are off on this page (`Proposals.tsx:45`).
- There is no way to accept all of a show's proposals at once.
- There is no Ban, so a refused S03 pack comes back on the next `record` run.
- To follow half a season, you tick the episodes one by one.

**Sam (screen reader, keyboard only)**
- A failed toggle or answer is never announced.
- The owned, upcoming and not-followed badges are emoji with only a `title`.
- The "Follow" header uses `gray-600` (40% lightness) at `fontSize: 7`: about 3.4:1, which fails AA (`Seasons.tsx:285-290`).
- Accept is white on `primary`, 2.04:1. This is the known deviation already recorded in DESIGN.md.
- Good: the season heads and episode titles are real buttons with `aria-expanded`, and the toggles have labels.

**Casey (phone PWA)**
- The proposals are two screens down.
- Each season head wraps to two lines, so The Simpsons' 39 rows are about 3500 px long.
- The "Follow new seasons" checkbox is left-aligned in an otherwise centred block.
- Good: Accept and Refuse are full width and taller than 44 px.

## Minor observations

- Specials read as broken: "39 episodes · 0/2" on Friends, "106 episodes · 0/93" with an empty bar on The Office. The count is every episode, the aired figure is only dated ones. They also get the same visual weight as regular seasons.
- The 🛎️ appears on the section title and again on every release row.
- On desktop, the second settings row does not line up with the first ("Library" and "Auto" start at different x).
- The raw tokens `gray-550` and `gray-600` are not in the DESIGN.md frontmatter (`Actions.tsx:158`, `Toggle.tsx:17`, `Seasons.tsx:288`).
- A show not in the library renders 39 season rows that do nothing (`Seasons.tsx:96-160`). A single line such as "38 seasons · 787 episodes · 1989–2026" would do the same job.
- The season bar is a fixed `10em` at 1440 px, which leaves a large empty band. It could hold the wanted and proposed counts.

## Questions to consider

- What if the proposal row led with the verdict ("VOST to VFF · +1 episode · 7.5 GB") and the release name came second?
- A VCR is programmed once. Should settings you set once really take the first block on every visit?
- Should a season pack bought for a single missing episode be proposed at all, or ranked below an episode search?
- Why is following a show a poster badge when following a season is a checkbox under a "Follow" label?
- For a show not yet followed, is a list of 38 seasons useful, or should the page lead with Follow and a one-line summary?

Files reviewed:
- `apps/web/src/pages/Shows/Show.tsx`
- `apps/web/src/pages/Shows/components/Proposals.tsx`
- `apps/web/src/pages/Shows/components/Seasons.tsx`
- `apps/web/src/pages/Shows/components/Actions.tsx`
- `apps/web/src/pages/Shows/components/Toggle.tsx`
- `apps/web/src/pages/Details/Details.tsx`
- `apps/web/src/contexts/ShowsMetadata/ShowsMetadata.tsx`

## Assessment B
Assessment B for `/tv/:id`: the source detector found nothing, and the browser detector found 1,711 to 2,691 issues per page. About 90% of the browser findings come from the cast credits wall, and the rest are shared layout, not `Show.tsx` itself. The detector ran in the page on all three pages, and the overlays stayed on `/tv/1668` in tab 43, titled `[Human] Sensorr - Friends (1994)`. The live server is stopped.

## 1. CLI scan (`impeccable detect --json`)

| Target | Exit | Findings |
|---|---|---|
| `apps/web/src/pages/Shows` (9 markup files) | 0 | `[]` |
| `libs/ui/src/components/Show` (4 files) | 0 | `[]` |
| Both, with `--no-config` | 0 | `[]` |

There are no inline `impeccable-disable` comments and no `.impeccable/critique/ignore.md`, so the clean result is real and not the effect of an ignore rule. The static scan simply cannot see the runtime sizes and colors, which live in theme-ui `sx` objects.

## 2. Browser detector, per page

Desktop 1440×900. Mutation preflight passed: title set, script tag appended, no CSP. Live server ran on port 8400, stopped with `live-server stop --keep-inject`.

### `/tv/1668` Friends: 1,920 anti-patterns

| Rule | Count | What and where |
|---|---|---|
| `undersized-ui-text` | 1,186 | 432 are `"Loading"`, the rest are credit role lines and genre/year captions |
| `buried-raster` | 721 | `<img>` at opacity 0 |
| `low-contrast` | 702 | 701 are `#666666` on `#050505`, 3.5:1 |
| `tiny-text` | 471 | 10px body text |
| `tight-leading` | 10 | line-height 1.20 |
| `layout-transition` | 4 | height, margin, margin, width |
| `clipped-overflow-container` | 3 | `sensorr-621fpm`, `sensorr-19ty091`, one bare `div` |
| `skipped-heading` | 1 | `<h1> "Friends"` followed by `<h4> "(1994)"` |
| `overused-font` | 1 | Open Sans, 64% of text |
| `line-length` | 1 | about 122 characters per line |

Where the findings come from:
- **Credit cards** (`libs/ui/src/elements/Entity/Poster/Poster.tsx:281-296`, `styles.subtitle:417-421`):
  - The role line is 10px in `grayDarker` (`#666`).
  - `buried-raster`: 721 of the 730 page images are lazy (`loading=lazy`) and not yet loaded, still behind the skeleton.
  - `"Loading"`: 432 cards far to the right in the horizontal scroll (x about 4,352px) still show the `!ready` placeholder at line 286.
- **Settings block** (`apps/web/src/pages/Shows/components/Actions.tsx:39` and the blocks after it):
  - Field labels `Policy`, `Auto`, `Follow new seasons`, `Library` are 10px `#666`. The styles come from the shared `MetadataStyles` in Details.
  - The `<small>` help lines are 10px with line-height 1.2, which are the `tight-leading` hits.
- **Transitions**, all in shared Details code:
  - height: `apps/web/src/pages/Details/components/Head.tsx:39`
  - margin: `Details.tsx:222` and `:244`
  - width: the OverlayScrollbars handle, a third-party element.
- **Heading**: `skipped-heading` is `Details.tsx:340-344`, the `<h4>` subtitle.
- **Line length**: the overview `<p>`, 976px wide at 16px.

### `/tv/456` Les Simpson: 2,691 anti-patterns

The show is not in the library, and wanted episodes are shown.

| Rule | Count |
|---|---|
| `undersized-ui-text` | 1,796, of which 718 are `"Loading"` |
| `tiny-text` | 995 |
| `low-contrast` | 995, all `#666` on `#050505` |
| `buried-raster` | 883 |
| `tight-leading` | 119 |
| `layout-transition` | 4 |
| `clipped-overflow-container` | 3 |
| `theater-slop-phrase` | 1, `"the Theater"` |
| `skipped-heading` | 1 |
| `overused-font` | 1, 65% |
| `line-length` | 1 |

Rules and origins are the same as on Friends. There is simply more cast, and the multi-line `tight-leading` hits are header nav links.

### `/tv/2316` The Office: 1,711 anti-patterns

The show is in the library, 181/186 episodes, with pending proposals.

| Rule | Count |
|---|---|
| `undersized-ui-text` | 1,054, of which 316 are `"Loading"` |
| `low-contrast` | 694 |
| `buried-raster` | 638 |
| `tiny-text` | 541 |
| `tight-leading` | 14 |
| `layout-transition` | 4 |
| `clipped-overflow-container` | 3 |
| `skipped-heading` | 1 |
| `overused-font` | 1, 62% |
| `line-length` | 1 |

What this page adds, all in the proposals panel:
- `low-contrast` 2.0:1: white on `#01d076`, the two `Accept` buttons.
- `low-contrast` 2.9:1: white on `#04ae65`, the checked policy chip `🇺🇳 MULTi-VF2`.
- `low-contrast` 3.4:1: `#666` on `#0a0a0a`, the 9px `.torrent` suffix inside a `<code>` link.
- `undersized-ui-text`: 10.5px `"Proposed"` label.
- `undersized-ui-text`: 10px `"1 episode"`, ten times.

### Other console output, not from the detector

- `ReferenceError: en is not defined`, logged as a warning.
- React `Each child in a list should have a unique "key" prop`.
- React Router v7 future-flag warnings.
- webpack-dev-server warnings.

## 3. False positives and design-system context

| Finding | Verdict | Why |
|---|---|---|
| `buried-raster` (638 to 883) | False positive | Lazy images not loaded yet. The opacity-0 image sits behind the skeleton until it loads (`Poster.tsx:270-277`). |
| `theater-slop-phrase` "the Theater" | False positive | A TMDB character name in a credit role, not UI copy. |
| `overused-font` Open Sans 62-65% | False positive | `DESIGN.md` makes Open Sans the body face for every human-written string. |
| `layout-transition` width | False positive | OverlayScrollbars handle, third-party. |
| `clipped-overflow-container` on the page and header wrappers | Likely false positive | Intentional `overflow: hidden` on full-width layout wrappers. Nothing visibly clipped in the capture. |
| `tiny-text`, `undersized-ui-text` and `tight-leading` on captions | Sanctioned, not false | `DESIGN.md:385` defines caption as `0.625em` at line-height 1.2. The accessibility concern is real, but the fix is a scale decision, not a bug in `Show.tsx`. |
| `"Loading"` | Real, low | Real text in the DOM for off-screen cards. It inflates the count by 316 to 718 per page. |
| White on `#01d076` (Accept) | Known deviation | Recorded on purpose in `DESIGN.md:662-677` as a brand decision. |
| `#666` on `#050505` (3.5:1) | Real | `grayDarker` is a border color (`DESIGN.md:291-293`), used here as text: Poster subtitle `Poster.tsx:421`, Actions field labels. |
| White on `#04ae65` (2.9:1) | Real | Same green-family gap on the checked policy chip, not covered by the recorded deviation. |
| `skipped-heading`, `line-length` | Real, shared | Both come from the shared Details hero (`Details.tsx:340`, overview `<p>`), same on movie pages. |

## 4. Skipped or failed steps

- **Mobile capture**: taken for `/tv/1668` at 390×844. The overlay did not survive the viewport change, so there are no mobile console findings. The detector ran at desktop only.
- **Saving screenshots**: saving to the scratchpad was refused because the path is outside the MCP workspace roots, so the captures were only returned inline, not saved.
- **`/tv/456`**: not in the library, so the settings block and proposals were not exercised there.
- **Files and writes**: no repository file was written, and `git status` is clean. The live server's own `server.json` and annotation session were removed by `stop`. `apps/web/.impeccable/live/sessions/` is an empty directory that predates this run (00:50), so I left it.
- **Nothing clicked**: no page element was clicked.
- **Tab 9**: it shares the `critique-b-show` context name but was not opened by this run, and I did not touch it.

Raw console dumps were kept in the session scratchpad: `c1668.txt`, `c456.txt`, `c2316.txt`.
