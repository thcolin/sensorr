---
target: drawer de détails mobile sur une personne (Details.tsx)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/acces-rapide/apps/web/src/pages/Details/Details.tsx"
target_fingerprint: "sha256:8149bcbfc92cdc4158e68487cbcb839bdbb19e2d3603a14caa555ae84cdc973c"
target_path: /Users/thcolin/orca/workspaces/sensorr/acces-rapide/apps/web/src/pages/Details/Details.tsx
timestamp: 2026-10-06T14-52-33Z
slug: apps-web-src-pages-details-details-tsx
---
Method: dual-agent (A: revue design · B: détecteur + navigateur)

Périmètre : drawer de détails mobile ouvert sur une personne (`variant='drawer'`, `behavior='person'`), commit 61a16606. Vu à 390×844 sur données réelles : Keanu Reeves depuis `/movie/603`, Aaron Pierre et Hannah Einbinder depuis `/person/followed`, comparé au drawer d'un film depuis `/movie/library`.

## Design Health Score

| # | Heuristique | Score | Problème principal |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | La pastille affiche `⌛` à l'ouverture, avant que l'état de la personne arrive (`apps/web/src/pages/Details/components/Poster.tsx:49`) |
| 2 | Match System / Real World | 3 | Biographie en français sous une interface en anglais : `en` n'est pris que si `biography` est vide (`libs/ui/src/components/Person/Person.tsx:134`) |
| 3 | User Control and Freedom | 3 | Fermeture par le knob et tap dehors ; la page complète n'est atteinte que par le titre, qui ressemble à du texte (`Details.tsx:301`) |
| 4 | Consistency and Standards | 3 | Même gabarit que film et série ; tête plus maigre sans notes ni externals, c'est voulu (`Details.tsx:312-327`) |
| 5 | Error Prevention | 2 | Cloche follow à 35×35 px, à 1em du knob : un drag raté écrit sur l'instance (`Poster.tsx:104-110`) |
| 6 | Recognition Rather Than Recall | 3 | Le ▶ du résumé cache lieu et date de naissance sans le dire |
| 7 | Flexibility and Efficiency | 2 | Un tap ouvre le drawer, mais la filmographie commence vers 700 px |
| 8 | Aesthetic and Minimalist Design | 3 | Bande vide d'environ 100 px sous la biographie, backdrop qui n'ajoute rien |
| 9 | Error Recovery | 2 | Erreur de chargement : `Warning` générique, sans relance (`apps/web/src/pages/Person/Person.tsx:213-219`) |
| 10 | Help and Documentation | 3 | Divulgations explicites, suffisant pour un seul utilisateur expert |
| **Total** | | **27/40** | **Acceptable, proche de Good** |

## Design Specificity Verdict

**Revue** : spécifique à Sensorr pour l'essentiel. Le drawer reprend le poster qui dépasse du knob, la palette du poster (`paintOf`), la ligne d'emoji (`💼 Acting · 📅 62 y/o`), la pastille d'état à cheval sur le coin, les onglets Known for, Casting, Crew, Shows. Le point faible est le backdrop : sur une palette de portrait sombre, il devient une tache floue générique qui ne dit rien du film d'où il vient.

**Détecteur** : 2 findings sur `Details.tsx` (`layout-transition` à `:507` et `:532`, transition de `margin`), 13 sur `apps/web/src/pages/Details/` (5 `layout-transition`, 8 avertissements `design-system-*` dans `Actions.tsx` et `Metadata.tsx`, hors du drawer personne). Dans le dialog ouvert, l'overlay compte 126 findings : environ 118 `undersized-ui-text` sur les cartes des onglets (genres à 8 px, années à 10 px, pourcentages à 7,7 px), 3 `low-contrast` à 4,3:1 (`#cc9c86` sur `#4b3d36`), 2 `ai-color-palette` et 2 `buried-raster` (faux positifs : image volontairement à opacité 0). Le détecteur trouve les tailles de texte que la revue n'a pas relevées. Les `design-system-color` d'`Actions.tsx:171-250` sont les couleurs d'état de la cloche, pas des défauts.

**Mesures a11y** : `role=dialog` et `aria-modal=true` sans nom accessible (`libs/ui/src/atoms/Drawer/Drawer.tsx:108`) ; le focus reste sur `BODY` ; le bouton chevron de la biographie (272×42) et le bouton backdrop plein écran n'ont pas de nom ; les `<select>` de follow et d'état n'ont pas d'`aria-label` ; un seul titre, le `h1`.

## Overall Impression

Le drawer personne est un vrai frère du drawer film, construit sur le même code. Il échoue sur l'ordre : la biographie occupe le premier écran, alors qu'un tap sur une personne demande « qu'a-t-elle fait, je la suis ? ». Et le backdrop, l'apport du commit, ne se voit pas.

## What's Working

- `PersonContent` est réutilisé avec `variant` et `initialPalette`, `useTitle` et la restauration du scroll restent à la page (`apps/web/src/pages/Person/Person.tsx:23-61`). Aucune seconde version de l'écran.
- La palette passe du poster tapé au drawer (`Details.tsx:111`) : il s'ouvre déjà coloré, sans flash gris.
- Notes et externals cachés pour une personne (`Details.tsx:312`) : pas de pastilles vides.

## Priority Issues

**[P1] Backdrop invisible sur les palettes sombres**
- Pourquoi : quatre atténuations s'empilent, `opacity: 0.5` (`Details.tsx:383`), masque en dégradé (`:384`), `fade={0.5}` et `blur={4}` (`Details.tsx:294`). Sur Keanu Reeves l'écart de luminance est de quelques pourcents. Rien ne dit non plus que c'est *The Matrix*.
- Fix : alléger la pile pour `behavior === 'person'` (opacité 0.75 à 1, `fade` 0.2, `blur` 2), ou retirer le billboard quand la palette est sombre. Le choix par `vote_count` sur cast et crew peut aussi prendre un film où la personne n'a qu'un crédit mineur (`Person.tsx:58-60`).
- Commande : `/impeccable bolder`

**[P1] Filmographie sous le premier écran**
- Pourquoi : « Known for » commence vers 700 px. L'ordre `overviewBlock`, `ticketBlock`, onglets (`Details.tsx:330-334`) met la prose devant les films.
- Fix : en drawer personne, réduire la biographie à 2 ou 3 lignes, ou placer les onglets avant `overviewBlock`.
- Commande : `/impeccable layout`

**[P1] Seule action d'écriture trop petite, sans nom, collée au knob ; dialog sans nom ni focus**
- Pourquoi : la cloche follow (35×35, `Poster.tsx:46-54` et `:104-110`) est sous les 44 px, à côté du geste de fermeture, et son `<select>` n'a pas d'`aria-label`. Le dialog n'a ni `aria-label` ni `aria-labelledby` (`Drawer.tsx:108`), le focus n'y entre pas, le chevron de la biographie n'a pas de nom.
- Fix : zone de tap à 44 px par padding ou pseudo-élément ; `aria-label` sur le select et le chevron ; `aria-labelledby` vers le `h1` ; focus déplacé à l'ouverture, comme `Artworks.tsx:313` le fait déjà.
- Commande : `/impeccable harden`

**[P2] Texte des cartes d'onglets sous le lisible**
- Pourquoi : genres à 8 px, années à 10 px, pourcentages à 7,7 px dans les cartes Known for, Casting, Crew. Environ 118 findings de l'overlay dans le dialog.
- Fix : remonter la taille de police du conteneur des cartes en drawer mobile, l'échelle est en `em`.
- Commande : `/impeccable typeset`

**[P2] Bande morte sous la biographie, et langue de la biographie**
- Pourquoi : `ticketBlock` vide pour une personne garde le padding du body et les marges de `ticket` (`Details.tsx:478-484`), environ 100 px de vide. La biographie suit la langue de TMDB (`Person.tsx:134` dans `libs/ui`).
- Fix : ne pas rendre `ticketBlock` pour une personne ; préférer la traduction `en` quand elle existe.
- Commande : `/impeccable polish`

## Persona Red Flags

**Casey (mobile, une main)** : la cloche est dans la zone haute, à côté du knob qu'elle tire pour fermer, un drag raté devient un unfollow. Les films commencent vers 700 px. La page complète se trouve par un titre qui ressemble à du texte.

**Sam (lecteur d'écran)** : dialog sans nom, focus resté sur `BODY`, chevron et select sans nom, aucun titre sous le `h1`. Les onglets sont des boutons, pas des titres.

**Le propriétaire-admin sur la PWA** : attend « cette personne vaut-elle d'être suivie, qu'est-ce que j'ai d'elle ? ». Les badges d'état des posters répondent, mais tard. Venu du casting de Matrix, Known for rouvre sur Matrix. Aucun compte de ses films déjà dans la bibliothèque.

## Minor Observations

- La pastille montre `⌛` le temps que l'état de la personne charge (`Poster.tsx:14,49`).
- Le bord haut du backdrop trace une ligne horizontale nette sur les côtés du poster.
- Les Shows triés par nombre d'épisodes mettent « Gemini Home Entertainment » en tête pour Keanu : le drawer finit sur du bruit.
- Coquille `'Docuemntary'` dans `apps/web/src/pages/Person/Person.tsx:129` et `:227`.
- `transition: margin` à `Details.tsx:507` et `:532` : à vérifier pendant le drag du drawer.

## Questions to Consider

- Dans une app dont le sujet est la release, pourquoi le drawer d'une personne commence-t-il par de la prose plutôt que par « N dans la bibliothèque · M souhaités » ?
- Si le backdrop est invisible sur la plupart des portraits sombres, l'emprunter vaut-il le coût ? Un aplat de la palette du portrait serait-il plus honnête ?
- La seule action d'écriture du drawer doit-elle rester à un centimètre du geste de fermeture ?
