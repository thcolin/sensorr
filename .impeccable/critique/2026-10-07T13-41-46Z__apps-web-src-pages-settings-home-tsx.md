---
target: Settings › Home
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/i18n/apps/web/src/pages/Settings/Home.tsx"
target_fingerprint: "sha256:967b17ae981d944d34b24f9383632ac313fcbd5724244a892fd152784ee83606"
target_path: /Users/thcolin/orca/workspaces/sensorr/i18n/apps/web/src/pages/Settings/Home.tsx
timestamp: 2026-10-07T13-41-46Z
slug: apps-web-src-pages-settings-home-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 31/40 (Good)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Save toast exists; `Auto` never shows what it resolves to |
| 2 | Match System / Real World | 3 | Endonyms right; "wrapped", "TMDB region" assume insider knowledge |
| 3 | User Control and Freedom | 3 | Another language is the undo; failure reverts (`Home.tsx:95`) |
| 4 | Consistency and Standards | 2 | Language saves on change, Home needs Save, on one page |
| 5 | Error Prevention | 2 | Native radio arrows change the selection: each arrow saves and relanguages the UI |
| 6 | Recognition Rather Than Recall | 4 | All options visible |
| 7 | Flexibility and Efficiency | 3 | One click; ↑/↓ on rows |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, the two sections are not chunked |
| 9 | Error Recovery | 3 | Generic error toast, state reverts |
| 10 | Help and Documentation | 3 | Inline help; Home paragraph long on mobile |

## Design Specificity Verdict
Home part product-specific (emoji, Fira Code kind column, locked rows, drop-to-group). Language part generic; its one specific consequence, friends' mails and wrapped, sits at the end of the help sentence. Detector: 0 findings on Home.tsx and Capsule.tsx (CSS-in-JS); in page 32, relevant: Capsule contrast (white on #01d076, 2.0:1), 10px nav group labels. Both assessments agree on contrast.

## Priority Issues
1. [P1] Arrow keys commit: every arrow press saves, relanguages the UI and toasts. Fix: commit once the selection settles. /impeccable polish
2. [P1] Capsule contrast: checked pill 2.0:1, against DESIGN.md "White text never sits on primary". Pre-existing, shared by the Home and Update capsules. Fix: Command Tabs recipe (accentDarkest track, accentDarker pill). Out of the chantier, Thomas decides.
3. [P2] Language filed under Home: Thomas's choice, kept.
4. [P2] No separation between the Language and Home sections (23px both inside and between). /impeccable layout
5. [P3] `Auto` opaque: show the resolved language, "Auto (Français)". /impeccable clarify

## Persona Red Flags
- Sam: each arrow changes the page's voice; `English`/`Français` lack `lang` (WCAG 3.1.2); 2:1 on the checked pill.
- Owner on the PWA: Language block and an 11-line paragraph push the rows below the fold.

## Minor Observations
- EN help "the mails and the wrapped of your friends" is heavy.
- Help → Capsule gap 8px, tighter than Home paragraph → Capsule.

## Questions to Consider
- Should Home rows also save on change, removing the mixed model?
- Is the language an owner-identity setting, closer to Mail or Friends?
