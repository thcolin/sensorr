---
target: "the series page /tv/:id"
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-tvshows/apps/web/src/pages/Shows/Show.tsx"
target_fingerprint: "sha256:bb2c45a8f61c7f7801686824d69ce33f398334ced7498a87a560956977b96db2"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-tvshows/apps/web/src/pages/Shows/Show.tsx
timestamp: 2026-09-25T13-07-34Z
slug: apps-web-src-pages-shows-show-tsx
closed: true
---
Method: dual-agent (Assessment A et B : deux sous-agents isolés, workflow)

# Critique de `apps/web/src/pages/Shows/Show.tsx` (`/tv/:id`), 2026-09-25, après le tour de retours

Score : 26/40, Acceptable.

Banc local sur le port 4453. Vues : `/tv/42009` (Black Mirror, swap S02 en attente), `/tv/1668` (Friends, saisons dépliées, Spéciaux), `/movie/1272` (Sunshine) en référence, en 1440×900 et 390 px. Aucune action d'écriture : saisons et épisodes dépliés par leur bouton `aria-expanded`, aucun 📺, Accept, Refuse ni réglage touché.

## Design Health Score

| # | Heuristique | Score | Problème principal |
|---|---|---|---|
| 1 | Visibilité de l'état du système | 3 | E01 à E03 de S02 ne disent pas qu'un swap en attente les remplace. Seul E04 porte « 🛎️ Proposed ». Sur mobile, les infos de release des épisodes disparaissent (`Seasons.tsx:473`). |
| 2 | Correspondance avec le monde réel | 3 | « S02 » en titre de proposition, « Saison 2 » sur la ligne. « and fills 1 · E04 ». « Auto : As jobs ». |
| 3 | Contrôle et liberté | 3 | Undo avec compte à rebours, Ban au refus. Mais `#season-2` ouvre S02 **et** S07 (`Seasons.tsx:52,117`). |
| 4 | Cohérence et standards | 2 | Mêmes nombres dessinés deux fois (texte mono puis pill). 🛎️ compte deux unités. Colonnes d'état en escalier. Pill 📦 du film absente du swap. |
| 5 | Prévention des erreurs | 2 | Le coût disque du swap est une ligne de prose grise. Les touches A et R globales (`Proposals.tsx:109-132`) acceptent sans indice visible. |
| 6 | Reconnaissance plutôt que rappel | 2 | Pour vérifier le swap, il faut retenir « replaces 3 episodes (1.88 GB) », descendre, déplier S02 : c'est S07 qui est ouverte. |
| 7 | Flexibilité et efficacité | 3 | Raccourcis A/R/Z/B, ancre `#season-N`, suivi d'une saison entière en un clic. |
| 8 | Esthétique et minimalisme | 3 | Complétude encodée trois fois par ligne de saison. Le résumé sous le titre redit « All seasons ». |
| 9 | Récupération des erreurs | 3 | `Warning` sur l'échec des épisodes, toasts d'échec. |
| 10 | Aide et documentation | 2 | Aides sous les réglages. Raccourcis invisibles, sens des icônes en `title` seulement. |
| **Total** | | **26/40** | **Acceptable** |

Aucune heuristique `n/a`. Maximum applicable : 40. Les constats de B confirment les notes de A sans en changer une : le clip des drapeaux et les infos masquées sur mobile tombent sous 1 et 4, déjà notés 3 et 2.

## Design Specificity Verdict

**LLM assessment** : la moitié haute appartient à Sensorr, la moitié basse à la catégorie.
- Propre au produit : billboard, affiche et badge d'état 📺, grille des réglages héritée du film, `TransitionPill` du diff, `Gestures` Accept/Refuse. `Details.tsx` sert les deux pages, qui se lisent comme un seul produit.
- Générique : le bloc des saisons. Chaque ligne répète `ProgressPill`, barre, check vert. Sur Friends, dix lignes vertes identiques. C'est le suivi de séries de Sonarr, pas la voix de Sensorr, qui montre ce que la policy a décidé.
- Occasion manquée : une série dit la même chose qu'un film, à l'épisode près. Rien ne relie la proposition S02 aux épisodes qu'elle remplace. Le diff reste en tête de page, à 400 px de la saison qu'il qualifie.

**Deterministic scan** : `impeccable detect --json` rend `[]` (code 0) sur `Show.tsx`, sur `apps/web/src/pages/Shows/components/` et sur les composants séries de `libs/ui` (`Show`, `ProgressPill`, `State`, `Badge`). Les 16 findings viennent du code partagé avec le film :

| Règle | Où | Verdict |
|---|---|---|
| `design-system-font` ×3 | `Details/components/Actions.tsx:753`, `Metadata.tsx:363`, `components/Sensorr/Release.tsx:74` | Faux positif : clés `body` et `monospace-no-emoji` du thème (`libs/theme/src/lib/theme/font.ts`). |
| `design-system-color` ×5 | `Details/components/Actions.tsx:148-227` | Réel, hors écran série : repli de palette du ticket `RELEASES`, rendu seulement pour `behavior === 'movie'` (`Details.tsx:92`). |
| `design-system-radius` ×2 | `Details/components/Actions.tsx:261`, `:745` | Réel, film seulement. |
| `design-system-radius` | `Details/components/Metadata.tsx:355` | **Réel et visible sur la série** : `2px` sur la pill `MULTi-VF2` de `UIPolicyInput`, contre `rounded.control` = `0.25em`. Partagé avec le film : à valider avec Thomas avant de changer ce rendu. |
| `layout-transition` ×5 | `Details.tsx:223, 245`, `Head.tsx:39`, `Actions.tsx:377, 388` | Réel, identique sur le film. |

Dans le navigateur, le détecteur a tourné sur 4 vues. Il relève 1564 éléments sur Black Mirror, 1874 sur Friends, 343 sur le film. L'écart vient du volume, pas du style.

Ce que B ajoute à A :
- **Les drapeaux des pills de release d'épisode sont coupés** : 6 `clipped-overflow-container` sur `span[data-file]` (S07E01 à E06). L'`abbr` 🇺🇳🇫🇷 dépasse de 2 px, rogné par `overflow: 'hidden'` (`Seasons.tsx:478`). La ligne de release du film n'a pas ce clip.
- **Les infos de release d'un épisode disparaissent à 390 px** : `display: ['none', 'flex']` (`Seasons.tsx:473`). Le film garde ses pills de release sur mobile. La décision du 2026-09-25 met ces infos « avec les pills de release du film » : c'est un écart de parité, pas un choix.
- **Les halves possédés de `ProgressPill` sont à 3,4:1** : blanc sur `#03a05c`, sur « All seasons » et chaque saison complète. Même vert que la pill de transition `MULTi-VFF` du film, donc cohérent, mais sous AA. A notait seulement que la complétude repose sur la couleur.
- **Le DOM des crédits explose** : Friends rend 1403 liens `/person/` et 731 `<img>`, contre une trentaine de personnes sur Sunshine. `aggregateCredits` (`apps/web/src/pages/Shows/credits.ts`) ne plafonne rien et la liste n'est pas virtualisée. C'est la source des 572 et 713 `low-contrast` (`#666` sur `#050505`, « "Rachel Green" · 228 episodes »).

Là où A et B concordent : les onglets Recommendations et Similar en affiches seules, contre les 5 cartes `pretty` et le lien `more` du film (`Movie.tsx:77-98`), `libs/ui/src/components/Show/Show.tsx:24` ne connaissant que `'poster' | 'card'`.

Faux positifs de B : `overused-font` (Open Sans est la police body de `DESIGN.md`), `buried-raster` (fondu d'apparition des `<img>` lazy), 348 et 420 `undersized-ui-text` sur « Loading » (cartes Person hors écran), `text-occlusion` sur « 25 » (chevauchement voulu des halves de `ProgressPill`), `clipped-overflow-container` sur l'habillage du menu d'état et du header, `tight-leading` sur `<script>` et `<style>`.

**Visual overlays** : l'injection a réussi. L'overlay reste visible dans l'onglet **[Human]** `Sensorr - Black Mirror (2011)` (`/tv/42009`, 1440×900). Le live-server est arrêté. Il est tombé une fois en cours de route (pid 60109, sans doute arrêté par un autre agent), relancé (pid 73522), puis arrêté par `live-server stop --keep-inject`. Aucun fichier suivi n'a changé.

## Overall Impression

La fiche reprend le cadre du film et le tient : une décision de swap se lit, se prend et se rattrape. Ce qui ne tient pas : la décision est coupée de ce qu'elle remplace. Le coût disque est en prose, les épisodes remplacés sont dans une saison fermée, et c'est une autre saison qui s'ouvre. La plus grosse occasion : amener la saison concernée sous la proposition, ou la proposition dans la saison.

## What's Working

1. **La réutilisation du cadre film.** Head, Poster, Externals, Overview, `Release`, `Swap`, `Gestures` et `TransitionPill` viennent des mêmes composants (`Details.tsx`, `Releases.tsx:116-135`). Le détecteur ne trouve rien de propre aux séries dans le code : tout ce qu'il signale est partagé.
2. **Le verdict différé.** `usePendingVerdict`, Undo et Ban reprennent le flux de l'écran Swaps. Une décision irréversible reste rattrapable pendant le délai, sans modale.
3. **Les lignes d'épisode portent les tags d'une ligne de release.** `x265`, `1080p`, drapeau et `📦 size` en Fira Code, à la taille de `Release` (`Seasons.tsx:387-400`). La qualité s'audite épisode par épisode, et la liste est virtualisée au-delà de 60 épisodes.

## Priority Issues

**[P1] Le bloc de proposition perd la pill 📦 du film et les fichiers remplacés**
- **Pourquoi c'est un problème** : sur `/movie/1272`, le diff finit par `📦 7.95 GB → 2.23 GB` en vert, sous la release possédée. Sur `/tv/42009`, le coût n'existe qu'en prose mono : « 2.36 GB replaces 3 episodes (1.88 GB) and fills 1 · E04 » (`Proposals.tsx:149-154`). `Swap` est appelé sans enfant (`Proposals.tsx:162-167`). `PRODUCT.md` dit qu'une proposition se tranche sur la langue, l'espace disque et l'intérêt du titre : l'espace disque est relégué en texte gris.
- **Correction** : passer à `Swap` un `Transition axis='size'` avec `from={emojize('📦', filesize.stringify(swap.size))}`, `to={release.size}` et `state={sizeStateOf(release.size - swap.size)}`, comme `Releases.tsx:57-66`. Prendre `swap.size` et non `diff.size` : `proposalDiff` compare à une seule release de base (`queue.ts:109`), faux pour un pack. Garder dans le `<small>` du titre ce que la pill ne dit pas : le nombre d'épisodes remplacés et « fills E04 ».
- **Commande** : `/impeccable layout`

**[P1] La proposition est détachée de la saison qu'elle qualifie**
- **Pourquoi c'est un problème** :
  - le titre « S02 » n'est pas un lien vers `#season-2`, alors que l'ancre est gérée (`Seasons.tsx:53-71`) ;
  - la saison ouverte par défaut est la dernière, S07 (`Seasons.tsx:51-52`, `:117`), pas celle qui attend ; avec l'ancre, S02 **et** S07 s'ouvrent ;
  - dans S02, E01 à E03 n'ont aucune marque d'épisode remplacé ;
  - 🛎️ compte deux unités : « 🛎️ 1 » du titre compte des releases en attente (`Show.tsx:82,88`), celui de la ligne Saison 2 des épisodes proposés (`Seasons.tsx:39,144-146`) ; un pack à 6 manquants afficherait 🛎️ 1 en haut et 🛎️ 6 sur la ligne.
- **Correction** : ouvrir par défaut les saisons qui ont `proposed` ou `wanted`, sinon la dernière, et seulement la cible quand l'ancre est là. Faire du titre de la proposition un lien vers `#season-N`. Marquer les épisodes de `release.coverage` d'un badge 🛎️ compact. Compter dans la même unité partout, ou changer le glyphe d'une des deux.
- **Commande** : `/impeccable clarify`

**[P2] Les lignes de saison et d'épisode ne tiennent pas leurs colonnes ni leurs pills**
- **Pourquoi c'est un problème** :
  - sur Friends S1, le check « fini » de la saison est à x 1252-1268, le badge d'état de l'épisode à x 1288-1312, le 📺 à x 1328 sur les deux : un escalier check, état, toggle. La colonne `4.5em` de `SUMMARY` (`Seasons.tsx:16`) ne contient que le toggle calé à droite, d'où un trou de 60 px ;
  - la colonne d'état mélange des pastilles de 24 px (📼) et une pill « 🛎️ Proposed » de 130 px (S02E04) : `compact` ne vaut que sur mobile (`Seasons.tsx:364`) ;
  - le groupe de tags est en `auto` : x265 et 1080p bougent de 9 à 18 px d'une ligne à l'autre (BM E05 et E06, Friends E12), parce que « 612.8 MB » est plus court ;
  - `overflow: 'hidden'` sur `[data-file]` rogne le haut des drapeaux 🇺🇳🇫🇷 de 2 px (`Seasons.tsx:478`) ;
  - `display: ['none', 'flex']` retire ces pills à 390 px (`Seasons.tsx:473`), alors que le film les garde.
- **Correction** : caler les colonnes de `SUMMARY` sur celles de `UIEpisodes.row`, pour que le check tombe dans la colonne d'état. Garder l'état compact dans les lignes, le libellé en `title` et en nom accessible. Donner à `ReleaseSize` une largeur minimale tabulaire dans `[data-file]`. Retirer le `overflow: 'hidden'` et laisser `nowrap` et la grille tenir la ligne. Afficher `[data-file]` sur mobile, sur une ligne à part sous le titre de l'épisode, comme la release du film en `display='column'`.
- **Commande** : `/impeccable layout`

**[P2] Le résumé sous le titre redit « All seasons » en texte mono**
- **Pourquoi c'est un problème** : « 32/33 · 28.92 GB » est en mono (`Show.tsx:85-90`, `Details.tsx:363`). 400 px plus bas, les mêmes nombres sont en `ProgressPill` et en pill 📦. La décision du 2026-09-25 met les compteurs possédés/sortis en `ProgressPill` ; le titre y échappe. Le film n'a rien à cet endroit. Ce résumé mêle aussi quatre unités : épisodes, octets, releases en attente (🛎️), épisodes voulus (🔍).
- **Correction** : ne garder dans le titre que ce qui appelle un geste, 🛎️ en lien vers le bloc de proposition, et laisser « All seasons » porter la complétude. Autre voie : `ProgressPill` et pill 📦 dans le résumé, et « All seasons » retire sa redite.
- **Commande** : `/impeccable distill`

**[P2] Les crédits rendent 1403 personnes sur Friends**
- **Pourquoi c'est un problème** : 1403 liens `/person/` et 731 `<img>` dans une rangée horizontale, contre une trentaine sur le film. `aggregateCredits` (`apps/web/src/pages/Shows/credits.ts`) ne plafonne rien et la liste n'est pas virtualisée. 348 à 420 cartes restent sur « Loading » hors écran. Le DOM de la page passe de 343 éléments (film) à 1874, sur un écran qu'on ouvre depuis la PWA.
- **Correction** : plafonner `aggregateCredits` au rang où le film s'arrête, trié par nombre d'épisodes, et ajouter un lien `more` vers la liste complète si elle sert. Le style (`SMALL`, 10 px, `#666`) est celui du film, il ne bouge pas ici.
- **Commande** : `/impeccable optimize`

## Persona Red Flags

**Alex (utilisateur avancé, clavier)** : A, R, Z et B existent, mais seul `aria-keyshortcuts` les annonce (`Gestures.tsx:13`). Pour vérifier le swap, il scrolle au-delà des réglages ouverts, cherche Saison 2 et la déplie : S07 est dépliée à la place. Après le verdict, aucun chemin vers la série suivante qui attend : le sous-menu Shows n'a pas de Swaps, contrairement à Movies.

**Sam (lecteur d'écran)** : « Owned » n'est porté que par 📼 et un `title` sur un `span` (`Seasons.tsx:364`). Le check « Every aired episode owned » n'existe qu'en `title` (`Seasons.tsx:193-197`). La complétude repose sur le vert de la pill, à 3,4:1, et la pill se lit « 3 4 » sans « sur ». Les `<img>` des offres JustWatch n'ont pas d'`alt` (`Details/components/Externals.tsx`). Point positif : le toggle 📺 a `aria-pressed` et un libellé explicite.

**Casey (PWA, 390 px)** : les réglages ouverts par défaut (`Details.tsx:147`, `metadataState ?? true`) prennent environ 600 px avant la proposition. Chaque ligne de saison passe sur deux lignes, la pill indentée à x 62 contre le nom à x 44 : dix saisons font un long scroll. Le titre de la release est coupé net au bord droit, sans ellipse (`Black.Mirror.2011.S02.MULTi-VFF.1080p.WEB`). Les infos de release des épisodes n'existent pas à cette largeur.

**Le propriétaire qui vide le backlog par séances** (`PRODUCT.md`, Operating Context) : la langue est bien servie par la pill MULTi → MULTi-VFF. L'espace disque est en prose. Il n'y a pas de file des propositions séries : il ouvre chaque fiche une à une.

## Minor Observations

- **Colonne vide sous l'affiche.** Le film y a le ticket « Search for releases » (`Details.tsx:92-109`). La série n'a rien, 250 px de vide à gauche des réglages. Brancher `Sensorr` sur une série dépend de l'API : à décider avec Thomas, pas à remplir.
- **Copie.** « and fills 1 · E04 » (`Proposal.tsx:60-64`, `Proposals.tsx:152`) : « fills E04 » suffit.
- **Deux noms pour une saison.** « S02 » dans le bloc, « Saison 2 » dans la liste. Les noms TMDB français sont dans une interface anglaise.
- **Recommendations et Similar.** Affiches seules sur la série, 5 cartes `pretty` et lien `more` sur le film (`Movie.tsx:77-99`). `Show` en `libs/ui` n'a pas de display `pretty`.
- **Onglets liés.** Le film a 🎬 réalisateur et 🤵 têtes d'affiche. La série n'a pas d'équivalent pour ses créateurs.
- **Scroll dans le scroll.** La liste virtualisée des épisodes (`maxHeight: 32em`, `Seasons.tsx:408-414`) scrolle dans `#body`.
- **Accept/Refuse diffèrent d'un écran à l'autre.** Verdict différé avec Undo sur la série, envoi immédiat sur le film (`Details.tsx:179-186`).
- **Genres coupés sur mobile.** « Science-Fiction & Fantastique, Drame, Mystère » est en `nowrap` et dépasse son `summary` de 52 px (`scrollWidth` 410 pour 358), sans ellipse. Composant d'en-tête partagé avec le film ; les genres TMDB des séries, plus longs, le font apparaître. La page ne scrolle pas en largeur.
- **Code partagé avec le film, hors périmètre de ce tour.** Libellés et aides des réglages à 10 px et `tight-leading` 1,2. Pill Policy `MULTi-VF2` à 2,9:1 et rayon `2px`. Accept à 2,0:1 (écart connu de `DESIGN.md`). `.torrent` à 3,4:1. `skipped-heading` `<h1>` puis `<h4>` « (2011) ». Synopsis à environ 122 caractères par ligne.
- **Console.** « Each child in a list should have a unique "key" prop » vient du `.map` des offres JustWatch de `UIExternals` (`Details/components/Externals.tsx`, vers la ligne 48).

## Questions to Consider

- Et si la proposition S02 vivait dans la ligne Saison 2, dépliée au-dessus des épisodes qu'elle remplace, au lieu d'un bloc de tête détaché ?
- Le résumé sous le titre doit-il redire « All seasons », ou devenir le raccourci vers ce qui attend une décision ?
- Un 📺 cliquable dans une pastille ronde reste-t-il lisible comme une action, à côté d'un 📼 de même taille qui n'en est pas une ? La « Pill-Is-A-State Rule » de `DESIGN.md` dit qu'une forme ronde est un état.
- Pill verte, barre pleine, check vert : trois signaux de complétude par ligne, sur dix lignes. Lequel suffirait ?
- Faut-il ouvrir les réglages par défaut sur une série déjà réglée, quand une décision attend en dessous ?
- La série doit-elle avoir son « Search for releases » et sa file Swaps, comme le film ?

**Trend for `apps-web-src-pages-shows-show-tsx` (last 3 runs): 21 → 23 → 26 (out of 40)**
Wrote `.impeccable/critique/2026-09-25T13-07-34Z__apps-web-src-pages-shows-show-tsx.md`.

Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3
