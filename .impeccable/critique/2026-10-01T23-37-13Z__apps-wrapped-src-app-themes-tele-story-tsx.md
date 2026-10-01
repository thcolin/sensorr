---
target: Télé stories
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/wrapped-cartes/apps/wrapped/src/app/themes/tele/Story.tsx"
target_fingerprint: "sha256:95975c3b2a112e3efde099b9ac223bfb2bdc82b36e7b0e047262e622e5dc76b8"
target_path: /Users/thcolin/orca/workspaces/sensorr/wrapped-cartes/apps/wrapped/src/app/themes/tele/Story.tsx
timestamp: 2026-10-01T23-37-13Z
slug: apps-wrapped-src-app-themes-tele-story-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

Target: the Télé look's stories (`apps/wrapped/src/app/themes/tele/Story.tsx`, Stories section of `tele.css`) in the shell `apps/wrapped/src/app/Stories.tsx`, at 390×844 and 390×699, on a heavy (15 stories), a median and a short guest, and the 15 shared 1080×1920 cards.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | current segment drawn like the done ones |
| 2 | Match System / Real World | 3 | « 1 / tous les 1 jours » on Binge (sheets.ts) |
| 3 | User Control and Freedom | 2 | index lost on reload; 14 taps back from the summary |
| 4 | Consistency and Standards | 3 | |
| 5 | Error Prevention | 3 | 50/50 tap zones invite accidental back taps |
| 6 | Recognition Rather Than Recall | 3 | |
| 7 | Flexibility and Efficiency | n/a | Experience surface |
| 8 | Aesthetic and Minimalist Design | 3 | bare lower third on most pages; short summary overflows |
| 9 | Error Recovery | 2 | « Réessayer » says nothing; no feedback after download |
| 10 | Help and Documentation | n/a | Experience surface |
| **Total** | | **22/32** | Acceptable |

## Design Specificity Verdict

LLM: authored for the product. Every story is a page of « Télé <name> »: folio with rubric and even page numbers, condensed headlines on a band, red and yellow figure tags, the blue Horoscope page, the Exclusivité ribbon, the test card and « Fin. », the cover reprinted with the rank sticker. Missed opportunity: a TV weekly page is dense to the trim, most stories stop at 55-65 % of the height.

Deterministic: `impeccable detect` on Story.tsx and Stories.tsx: 0. On themes/tele/: 10, all design-system-color/radius from the web app's DESIGN.md, which does not apply (0 with --no-design-system). In page, on stories 0, 3, 5, 11, 14: low-contrast on the cover figures and the night's headline (false positives: the detector read the section background, the text sits on a dark photo overlay), all-caps-body, tight-leading and body-text-viewport-edge on display lines (intended), dark-glow and repeating-stripes on body (not traced). No horizontal overflow, no console error, no request off localhost, every img has an alt. Inactive segments: cream at 0.3 opacity on ink, about 2.5:1, under 3:1 for a graphic that carries the position.

## Overall Impression

The magazine reads as a magazine, page after page, and ends on its best moment. What weakens it: half-empty pages, an overflowing summary for a short year, and a shell that hides the content from VoiceOver.

## What's Working

- The folio system makes every card a page torn from one issue.
- The Feuilleton's reduced calendar: three bands of days struck one after the other, readable at a glance and good motion.
- The ending: test card and « Fin. », then the cover with the rank sticker as the image to share.

## Priority Issues

- **[P1] The short-year summary overflows and clips in the shared image.** `Summary` stacks lede, title, four figure lines, insets, `colophon.short` and `colophon.text`; the colophon ends at story-y ~698 of 704, cut in the image and under Safari's bar. Fix: drop the inset row when `colophon.short` is set, tighten the cover lines, keep the colophon above the free zone. `/impeccable layout`
- **[P1] The tap buttons cover the page for VoiceOver.** `.stories-tap-*` are empty buttons over the content; focus stays after the content, and drops to BODY when the last story disables the focused button. Fix: hide the zones from assistive tech, keep real labelled previous/next buttons for keyboard and screen readers, move focus to the frame on change, `aria-disabled` instead of `disabled`. `/impeccable harden`
- **[P1] The lower 30-45 % of most stories is bare paper, on screen and in the image.** Fix: anchor the last block to the foot (`margin-top: auto`), let the hero figure and the poster row grow where there is room, check Grille and Binge still fit. `/impeccable layout`
- **[P2] Fast tapping queues renders behind the story you stop on.** `ShareImage` fetches on mount and never aborts; the server draws one image at a time. Fix: ask for the image after ~700 ms on screen. `/impeccable optimize`
- **[P2] Position lost on reload or tab eviction.** Fix: keep the index in the URL hash. `/impeccable harden`

## Persona Red Flags

- Friend on an iPhone in the evening: back zone under a right thumb (50/50 split, the stories convention is a left third); « Revoir en » wraps at 390×699; no feedback after the download fallback; index lost on reload.
- Screen reader: tap zones over the content; focus lost on the last story; the rank sticker is aria-hidden so the summary never says the rank; « Partager » does not say what it shares.
- Short-year guest: overflowing summary; the only shareable cover carries « 75e sur 79 ».

## Minor Observations

- Ton jumeau: the Venn breaks a long name mid-word (« KAKEEN / N »).
- Dernière partie and Exclusivité use the poster where a still (`kind="art"`) would read better under the headline.
- « LE 1ER DÉCEMBRE » upper-cased in the colophon line.
- The Conception says 4 lines for the night's listing, the code shows 3.
- Binge: four competing hero numbers, « 145 » collides with its tag.

## Questions to Consider

- What if the empty foot of a page carried a real magazine element, « Suite p. 6 »?
- Should a bottom-quartile rank still be the sticker of the image a light viewer is invited to post?
- Would Binge be stronger with one hero figure and the rest as body text?
