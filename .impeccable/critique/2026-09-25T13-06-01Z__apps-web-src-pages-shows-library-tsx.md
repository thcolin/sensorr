---
target: the series library /tv/library
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-tvshows/apps/web/src/pages/Shows/Library.tsx"
target_fingerprint: "sha256:2425d6010309ba73287c1244fad01836634a44f806f4877595aef779cd43f04d"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-tvshows/apps/web/src/pages/Shows/Library.tsx
timestamp: 2026-09-25T13-06-01Z
slug: apps-web-src-pages-shows-library-tsx
---
Method: dual-agent (Assessment A et B : deux sous-agents isolés, workflow)

# Critique de `apps/web/src/pages/Shows/Library.tsx` (`/tv/library`), 2026-09-25, après le tour de retours

Score : 26/40, Acceptable.

Banc local sur le port 4453, 246 séries. `/tv/library` et `/movie/library` en 1440×900 et 390 px. Cas regardés : cartes en cours, complètes, Upcoming (filtre Status › Upcoming), la série à 32 saisons, menu 🛎️ ouvert puis Échap, panneau de filtres ouvert puis Échap. Aucune action d'écriture, aucun fichier suivi modifié par les deux assessments.

Captures sous `tmp/captures/retours/` :
- A : `critiqueA-tv-library-desktop.png`, `critiqueA-movie-library-desktop.png`, `critiqueA-tv-library-mobile.png`, `critiqueA-movie-library-mobile.png`, `critiqueA-tv-library-upcoming.png`, `critiqueA-tv-library-32seasons.png`, `critiqueA-tv-library-filters.png`, `critiqueA-tv-library-proposal-menu.png`.
- B : `critique-library-b-desktop.png`, `critique-library-b-desktop-upcoming.png` (overlays), `critique-library-b-desktop-filters.png`, `critique-library-b-mobile.png`, `critique-library-b-movie-desktop.png`, `critique-library-b-movie-mobile.png`.

## Design Health Score

| # | Heuristique | Score | Problème principal |
|---|---|---|---|
| 1 | Visibilité de l'état du système | 3 | Pill et barre lisibles. Au chargement, la moitié haute de la pill passe par-dessus le skeleton. Un épisode manquant sur 33 fait 1 à 2 px de gris dans la barre. |
| 2 | Correspondance avec le monde réel | 3 | L'état s'appelle « Pinned », le bulk dit « Unfollow », le filtre s'intitule « Follow ». La date Upcoming suit la locale du navigateur (`25/11/2026`) dans une interface en anglais. |
| 3 | Contrôle et liberté | 3 | Sélection, filtres et Cancel corrects. Confirmations par `confirm()` natif, comme le film. |
| 4 | Cohérence et standards | 2 | Pas de badge de note en haut à gauche. Coche de sélection visible au repos sur mobile. 3 tris contre 7. Lien demandeur vers les films. Filtre d'état écrit pour la page au lieu de `FilterStates`. « Last Refresh » contre « Last Update ». |
| 5 | Prévention des erreurs | 3 | Le bulk n'agit que sur les ids visibles avec les filtres en cours (`Library.tsx:149-151`), et chaque action demande confirmation. |
| 6 | Reconnaissance plutôt que rappel | 3 | Nombres et `title` au survol. La saison incomplète ne se retrouve qu'en lisant la barre au pixel près. |
| 7 | Flexibilité et efficacité | 2 | Aucun filtre ni tri sur la complétude. Pas d'aperçu au long-press sur mobile. Name trié Z→A par défaut. |
| 8 | Esthétique et minimalisme | 3 | Desktop propre. Sur mobile, la pill est aussi grosse que le titre. À 32 saisons, la barre devient un code-barres. |
| 9 | Récupération des erreurs | 2 | Toast générique « Error while loading library statistics », sans relance. |
| 10 | Aide et documentation | 2 | L'en-tête du panneau de filtres explique les filtres. La pill n'a qu'un `title`. |
| **Total** | | **26/40** | **Acceptable** |

Aucune heuristique `n/a`. Maximum applicable : 40.

## Design Specificity Verdict

**LLM assessment** : l'écran est fait pour Sensorr.
- Le mur d'affiches est celui des films, la grille garde ses colonnes et son rythme.
- Les emoji servent d'états (📺 / 📍).
- Le compteur possédés/sortis reprend la `TransitionPill` via `ProgressPill` au lieu d'inventer un widget de progression, comme le demande `DESIGN.md` (« extend its vocabulary rather than inventing a second diff widget »).
- La barre découpée par saison est propre au domaine.

Rien ne ressemble à un template SaaS interchangeable. La faiblesse est ailleurs : la carte série n'est pas encore la carte du film. Le badge de gauche manque, le pied de carte n'a pas été dessiné pour 96 px de large, et deux raccourcis ont été copiés du film sans être adaptés (l'avatar du demandeur pointe sur `/movie/requests`, le tri par nom part en décroissant).

**Deterministic scan** : `impeccable detect --json` rend `[]` (code 0) sur `Library.tsx`, sur `libs/ui/src/components/Show/Show.tsx`, `Show/ProgressPill`, `Show/State`, `apps/web/src/pages/Shows/components` et `apps/web/src/components/Show`. Aucun constat statique sur le code des séries.

Sur la contrepartie film, 2 constats :
- `design-system-radius` (advisory), `apps/web/src/pages/Library/Library.tsx:205`, `borderRadius: 2px` hors de l'échelle `rounded`. Film, hors périmètre.
- `layout-transition` (warning), `libs/ui/src/components/Movie/Badges/ReviewsBadge.tsx:50`, `transition: width`. Il compte ici : la correction du P1 ajoute ce badge aux cartes série, et avec lui cette transition.

Dans le navigateur, le détecteur relève 218 constats sur `/tv/library` desktop. Tri :

| Règle | Nombre | Verdict |
|---|---|---|
| `undersized-ui-text` | 157 | Réel mais système. Ligne année · genres à 10 px (token `caption`, 0.625em), `📅 Upcoming` et sa date à `fontSize: 7`. Même token sur `/movie/library`. |
| `low-contrast` blanc sur `#03a05c` | 41 | Écart connu, documenté dans `DESIGN.md` (Transition Pill, « Known deviation ») : moitié droite des `ProgressPill` `held`, 3,4:1. |
| `low-contrast` du `h4` `Library` | 1 | Écart connu (`primary`, décision de marque), identique sur le film. |
| `buried-raster` | 7 | Faux positif. Affiches en fondu d'entrée (`ready`) dans la grille virtualisée. |
| `text-occlusion` | 5 | Faux positif mesuré. Sur « 16/16 », la pill du dessus (x 255,9) ne couvre que le padding droit de celle du dessous, dont les chiffres finissent vers x 247. |
| `clipped-overflow-container` | 3 | Layout global (wrapper du header, `div.sensorr-621fpm`). Aucun rognage visible. |
| `skipped-heading` | 1 | Réel mais global. Le `h2` « Sorry, no results » du panneau de recherche caché précède le `h4` de page, sans `h1`. Même structure sur le film. |
| `tight-leading` | 2 | Faux positif (`<script>`, `<style>`). |
| `cramped-padding` | 1 | Probable faux positif, non vérifié : barre `Bulk` cachée tant que rien n'est sélectionné. |
| `overused-font` | 1 | Faux positif. Open Sans est la police body de `DESIGN.md`. |
| `layout-transition` | 1 | Au niveau `body`, source introuvable dans le DOM. Seule source connue : `ReviewsBadge.tsx:50`, côté film. |

Ce que B ajoute à A :
- **La date Upcoming suit la locale du navigateur.** `toLocaleDateString(undefined, …)` (`libs/ui/src/components/Show/Show.tsx:145`) sort `25/11/2026` dans une interface en anglais.
- **Le filtre d'état n'est pas le composant du film.** Le film utilise `FilterStates`, titré « State ». La série passe par un `OneOf` écrit pour la page (`Library.tsx:222-229`), titré « 📺 Follow ». `FilterStates` ne connaît que `movie` et `person` (`FilterStates.tsx:16`). A voyait le libellé, B donne la cause.
- **Le tri par défaut ne dit pas la même chose** : « Last Refresh » (`refreshed_at`) côté série, « Last Update » (`updated_at`) côté film.
- **Console** : `Each child in a list should have a unique "key" prop` dans `UIControls` → `UIAside`, `ReferenceError: en is not defined` (warn), `defaultProps` sur `VirtualGrid`. Non comparés avec `/movie/library`.

Là où A et B concordent : la coche ✓ permanente sur mobile et sa cause dans `Poster.tsx`, le coin haut gauche vide sur desktop, le bord gauche de la barre qui bouge avec la largeur de la pill (97, 83 ou 69 px), la barre à 32 saisons illisible (segment le plus étroit 1,66 px), le vocabulaire Follow / Unfollow / Pinned, le pas de grille à 374 px (346 + `extra: 28`) et les 8 px sous année · genres.

**Visual overlays** : l'injection a réussi (`document.title` modifié, `<script>` ajouté, `detect.js` chargé depuis `live-server` sur le port 8400). Les overlays sont visibles dans l'onglet **`[Human] Sensorr - Shows · Library`**, resté ouvert. Le live server ne tourne plus : rien n'écoute sur 8400. L'overlay ne couvre que `/tv/library` desktop, les vues mobiles et la référence film ont été capturées sans.

## Overall Impression

La grille tient le rythme du film et le compteur est le bon composant. Une rangée de pills vertes « 16 16 » dit d'un coup d'œil que la bibliothèque est complète. Ce qui ne tient pas : la carte série n'a pas la silhouette de la carte film, et sur mobile elle affiche une coche qui ment. Son pied n'a pas été dessiné pour ses tailles réelles. La plus grosse occasion : la carte pose la question « qu'est-ce qui manque ? », et la bibliothèque ne sait ni filtrer ni trier dessus.

## What's Working

1. **Le compteur est le bon composant.** `ProgressPill` réutilise `TransitionPill` avec ses deux teintes : `held` vert quand tout est là, `quiet` sinon. Le vert garde son sens « le système dit oui ». La pill et la barre sont centrées sur le même axe à 0,1 px près (pill y 522,6 h 20,4, barre y 530,8 h 4).
2. **Le rythme de la grille est tenu exprès.** `extra: 28` (`Library.tsx:74`) ajoute exactement la hauteur du pied : 374 px contre 346 px pour le film, mêmes colonnes, même écart. La ligne Upcoming prend la hauteur minimale de la pill (`Show.tsx:159`) : une carte « 📅 Upcoming … 25/11/2026 » s'aligne sur ses voisines, centre vertical identique à celui des pills (`cy` −149,2).
3. **Le bulk est sûr et connu.** La sélection est filtrée par les ids des filtres en cours avant d'agir (`Library.tsx:149-151`). Le toolbar est le gabarit du film (`results bulk toggle sort_by`), rien à réapprendre.

## Priority Issues

**[P1] Le coin haut gauche de la carte série est vide, et sur mobile la coche de sélection s'y affiche au repos sur chaque affiche**
- **Pourquoi c'est un problème** :
  - le film porte en haut à gauche le `ReviewsBadge` (« 🙌 82 % »), qui recouvre aussi la coche au repos ; la série n'a rien (`Show.tsx:74-79` ne déclare ni `reviews` ni `focus` par défaut), donc les deux murs n'ont pas la même silhouette ;
  - la coche n'est cachée qu'en `@media (hover: hover)` (`Poster.tsx:128`) ; en 390 px, les 246 cartes portent un rond ✓ gris permanent ;
  - ce ✓ se lit « fait / possédé », juste au-dessus d'un compteur de complétude : un indicateur qui ment.
- **Correction** : ajouter à `badges` dans `libs/ui/src/components/Show/Show.tsx:75` l'entrée `reviews: { component: ReviewsBadge, props: { entity, display } }`, comme `Movie.tsx:85`. `ReviewsBadge` calcule son score depuis `entity.vote_average`, que `/api/shows?progress=true` renvoie (7.49 sur la première carte). La coche repasse sous le badge au repos, sans toucher `Poster`. Le badge amène sa `transition: width` (`ReviewsBadge.tsx:50`, constat `layout-transition`) : c'est un rendu film, à ne pas changer ici.
- **Commande** : `/impeccable layout`

**[P2] Le pied de carte n'est pas dessiné pour ses tailles réelles**
- **Pourquoi c'est un problème** :
  - mobile : la pill reste à `fontSize: 6`, soit 12 px comme le titre, et prend 50 px sur 96. Le `Poster` réduit titre et sous-titre par breakpoint (`title [6,5]`, `subtitle >small [8,7]`), pas la pill. Elle devient l'élément le plus lourd de la carte ;
  - desktop : la largeur de la pill suit le nombre de chiffres (50,4 px pour « 8 8 », 64,8 px pour « 16 16 », environ 78 px pour « 138 416 »). La barre fait 97, 83 ou 69 px et son bord gauche change d'une carte à l'autre dans la même rangée ;
  - beaucoup de saisons : à 32 saisons (« Comment c'est fait »), les 31 séparateurs font un code-barres, segment le plus étroit 1,66 px. Philadelphia (18) et Nus et Culottés (13) s'en approchent.
- **Correction** : `fontSize: [7, 6]` sur `ShowProgress`, ou le pied sous l'échelle du `Poster`. Une largeur minimale en `ch` sur la pill (par exemple `minWidth: '7ch'` côté `to`) pour que les barres d'une rangée partent du même x. Dans `Progress`, abandonner les séparateurs quand un segment tomberait sous 4 px environ, et garder la barre continue avec le gris des saisons incomplètes à sa place.
- **Commande** : `/impeccable layout`

**[P2] Au chargement, la moitié « aired » de la pill passe au-dessus du skeleton**
- **Pourquoi c'est un problème** : côté `after`, la pill est en `position: relative` (`TransitionPill.tsx:66`). Tant que la carte n'est pas prête, le skeleton est en `position: absolute; zIndex: 0` (`Poster.tsx:275-279`). Des pastilles « 16 », « 6 », « 33 » flottent seules sur des rectangles gris à chaque navigation. Le film n'a pas de pied, donc pas ce défaut.
- **Correction** : ne rendre `footer` que si `ready`, ou le passer en `opacity: ready ? 1 : 0` avec la transition de 400 ms du reste de la carte.
- **Commande** : `/impeccable polish`

**[P2] L'avatar du demandeur sur une carte série mène à la liste des films**
- **Pourquoi c'est un problème** : `Show.tsx:77` réutilise `Guests` du film, qui code en dur `to: '/movie/requests'` et un filtre `state: 'archived|wished|pinned|missing|ignored'` (`libs/ui/src/components/Movie/Guests/Guests.tsx:14-17` et `:34-37`). Un clic sur l'avatar de Black Doves ouvre les films demandés par cette personne. La destination est fausse et rien ne le signale.
- **Correction** : passer le `link` en prop de `Guests`, le film par défaut, et que `Show.tsx` fournisse `/tv/requests` avec les contrôles de série.
- **Commande** : `/impeccable harden`

**[P2] La bibliothèque ne sait pas répondre à la question que pose sa carte : « qu'est-ce qui est incomplet ? »**
- **Pourquoi c'est un problème** :
  - l'information principale de la carte est owned/aired, et aucun filtre ni tri ne s'appuie dessus ;
  - 3 tris (Last Refresh, Name, First Air Date, `Library.tsx:216-218`) contre 7 pour le film, ni Popularity ni Vote Average alors que les données sont là ;
  - pour trouver les 1 à 2 séries sur 246 à qui il manque un épisode, il faut faire défiler tout le mur ;
  - choisir « Name » garde `sort: true` (desc, `Library.tsx:210`) : la liste part de Zorro.
- **Correction** : un filtre « 📼 Complete / Incomplete » (owned < aired) et un tri « Missing episodes » (aired − owned, desc), côté API sur `progress`. Aligner les tris TMDB sur le film. Faire partir Name en ascendant au changement de tri.
- **Commande** : `/impeccable shape`

## Persona Red Flags

**Alex (utilisateur avancé)** : aucun filtre ni tri sur la complétude, 246 cartes à parcourir pour trouver les 2 incomplètes. « Name » part de Z, un clic de plus sur la flèche. Le bulk n'offre ni 🔕 Ignore, ni « Follow new seasons » (`monitor_new_seasons`), réglable pourtant sur la fiche.

**Casey (mobile, PWA)** : un rond ✓ permanent sur chaque affiche, qui ressemble à un état « fait ». Une pill aussi grosse que le titre. Pas de long-press vers l'aperçu : le film est composé avec `withLongPressBehavior` (`apps/web/src/components/Movie/Movie.tsx:19`), la série non (`apps/web/src/components/Show/Show.tsx`), alors que le poster est `interactive` sur mobile. Pastilles orphelines pendant le chargement.

**Sam (lecteur d'écran)** : la pill n'a qu'un `title`, un lecteur d'écran lit « 8 8 » ou « 32 33 » sans contexte. Il lui faut un `aria-label` « 32 of 33 aired episodes owned », la barre l'a déjà. Le lien de l'affiche n'a pas de nom accessible (`link url=…/tv/108545` sans texte), comme sur le film. Le bouton de sens du tri n'en a pas non plus. La page n'a pas de `h1`, son titre est un `h4` précédé du `h2` caché de la recherche. Le vert « complet » est doublé par l'égalité des deux nombres : correct.

## Minor Observations

- **Vocabulaire.** Le groupe de filtre s'appelle « Follow » (`Library.tsx:226`), le film dit « State ». Le bulk propose « Unfollow » avec 📍 (`Library.tsx:183`), alors que l'état s'appelle « Pinned » (décision du 2026-09-25 : 🔕 Ignored · 📍 Pinned · 📺 Followed).
- **Date Upcoming.** Format de la locale du navigateur (`Show.tsx:145`) dans une interface en anglais.
- **Compteur répété.** Le menu 🛎️ d'une carte affiche « 📼 32/33 aired episodes owned » (`Show.tsx:70`), juste au-dessus de la pill qui dit la même chose.
- **Ligne Upcoming.** L'emoji 📅 et la date sont à 10 px `#999`, nettement plus légers que la pill des voisines. La hauteur est alignée, le poids non.
- **Payload.** `/api/shows?progress=true` renvoie `releases`, `seasons`, `alternative_titles` et `external_ids` complets pour chaque carte. La carte n'utilise que `progress`, les méta TMDB et les propositions. À mesurer avec `/impeccable optimize`.
- **Console.** Warning `key` dans `UIControls` → `UIAside`, `ReferenceError: en is not defined`, `defaultProps` sur `VirtualGrid`. Non comparés avec le film.
- **Défauts partagés avec le film.** « 1 Results », « Show 1 Filters », toolbar qui défile en largeur à 390 px (« Show Filters » coupé), `confirm()` natifs, texte `caption` à 10 px. Pas propres à cet écran, à ne pas changer ici.
- **« Plus d'espace sous année · genres » (décision du 2026-09-25).** Vérifié : 8 px (`0.5em`) entre le sous-titre et le pied, contre 4 px entre titre et sous-titre. Sur l'échelle.

## Questions to Consider

- Si la carte doit dire « il te manque quelque chose », pourquoi n'affiche-t-elle pas *quoi* ? « S02 · 1 manquant » en `title` ou sous la pill, au lieu d'un trou de 2 px dans la barre.
- La `TransitionPill` se lit « l'ancien devient le nouveau ». « 32 devient 33 » se lit-il bien « 32 sur 33 », ou la pill de progression a-t-elle besoin d'un ordre ou d'un séparateur à elle ?
- Une carte complète affiche une pill verte et une barre pleine verte. Si la pill suffit à dire « complet », la barre ne devrait-elle apparaître que sur les séries incomplètes ?
- La bibliothèque de séries doit-elle s'ouvrir triée par « ce qui manque » plutôt que par « Last Refresh », puisque l'utilisateur s'arrête avant la fin de toute liste (`PRODUCT.md`) ?

**Trend for `apps-web-src-pages-shows-library-tsx`** : premier passage sur cette cible, pas encore de tendance (26/40).
Wrote `.impeccable/critique/2026-09-25T13-06-01Z__apps-web-src-pages-shows-library-tsx.md`.

Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3
