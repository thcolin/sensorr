---
target: "la diffusion des séries, fiche /tv/:id et cartes"
total_score: 20
max_score: 32
na_heuristics: 3,5
p0_count: 0
p1_count: 1
target_identity: "file:apps/web/src/pages/Shows/Show.tsx"
target_fingerprint: "sha256:2cf2d7e5caf09b2ef6c0e66b941480e48bb04312eb1477ff3618977496ea45a4"
target_path: apps/web/src/pages/Shows/Show.tsx
timestamp: 2026-09-26T10-11-58Z
slug: apps-web-src-pages-shows-show-tsx
---
Method: dual-agent (Assessment A et B : deux sous-agents isolés, workflow)

# Critique de la diffusion des séries (`apps/web/src/pages/Shows/Show.tsx` et cartes série), 2026-09-26

Score : 20/32, Acceptable (62 %). Heuristiques 3 et 5 en `n/a`.

Périmètre : la diffusion ajoutée par `a24b594`, `ed49fed` et `2685156`, plus le working tree non commité de `feat/tvshows-diffusion`. Elle couvre la pill violette des cartes, le footer des cartes, la pill de diffusion de la fiche et la règle des saisons. Banc local sur `https://localhost:4453`, copie des données de production. Vues en 1440×900 et 390 px, mode sombre, le seul que l'interface atteint. Aucune action d'écriture.

Captures : dans le scratchpad de la session, hors dépôt, notées `captures/diffusion/` plus bas. `review-*.png` viennent de A, `browser-*.png` de B.

## Design Health Score

| # | Heuristique | Score | Problème principal |
|---|---|---|---|
| 1 | Visibilité de l'état du système | 3 | Chaque carte dit si la série est encore diffusée, la fiche donne la date suivante. Sur Discover et Trending, les footers arrivent 1 s après la carte, sans fondu. |
| 2 | Correspondance avec le monde réel | 3 | « Airing · next 29/09 » et « Ended · 2004 » se lisent seuls. VisionQuest dit « Upcoming · 14/10/2026 » dans la pill et « 📆 2026 - Airing » deux lignes plus bas. |
| 3 | Contrôle et liberté | n/a | Le changement affiche une information. Il n'ajoute ni action ni état à quitter. |
| 4 | Cohérence et standards | 2 | Hors bibliothèque, la pill passe sous l'année, alors que le film garde son année en ligne. Rangée Requests de Home en escalier. Ligne d'en-tête à deux hauteurs (17,8 px arrondi, 21,2 px carré). Pill terminée et pill de taille dans deux gris. |
| 5 | Prévention des erreurs | n/a | Affichage seul. |
| 6 | Reconnaissance plutôt que rappel | 2 | A notait 3. Le sens du violet n'est écrit que sur la fiche. Sur les cartes, la date suivante n'est que dans le `title` d'une pill non focusable, hors du lien de la carte : souris seule, ni clavier ni tactile (B). |
| 7 | Flexibilité et efficacité | 3 | Repérer les séries encore diffusées dans Library se fait d'un coup d'œil. |
| 8 | Esthétique et minimalisme | 3 | Sobre, fait de pièces existantes. La diffusion est dite deux fois sur la fiche (pill et ligne `📆`). |
| 9 | Récupération des erreurs | 2 | Quand la requête de progression ou de détails TMDB échoue, la carte n'a pas de footer et ressemble à une série sans données. L'échec part dans `console.warn`, sans retry. |
| 10 | Aide et documentation | 2 | Les `title` des pills portent le détail (« · next episode on 29/09 »), `DESIGN.md` documente les états. L'app n'a aucune légende du violet. |
| **Total** | | **20/32** | **Acceptable (62 %)** |

Maximum applicable : 32, heuristiques 3 et 5 en `n/a`. Une seule note change par rapport à A : la 6, de 3 à 2, sur le constat de B que la pill n'est ni focusable ni dans le lien de la carte. Les autres constats de B confirment les notes de A.

## Design Specificity Verdict

**LLM assessment** : le changement est fait pour Sensorr.
- Il étend le composant signature du produit, `TransitionPill` et `ProgressPill`, au lieu d'ajouter un widget. Pas d'emoji ni de badge à côté de la barre.
- Le violet ajouté est désaturé (teinte 265, saturation 50 %). Le vert reste la seule couleur forte, conforme à la One Green Rule.
- La pill de l'en-tête reprend le `ReleaseTag` de la taille voisine.
- L'idée neuve, du violet sur le côté diffusé, entre dans le vocabulaire existant ancienne valeur, nouvelle valeur.

**Deterministic scan** : `impeccable detect --json` sur 30 fichiers (`git diff --name-only origin/dev -- apps/web libs/ui libs/theme`, plus `limited.ts` et `limited.spec.ts` non suivis). Code 2, 4 findings.

| Règle | Où | Origine | Verdict |
|---|---|---|---|
| `layout-transition` `transition: width` | `libs/ui/src/atoms/Progress/Progress.tsx:64` | `05e3a05c`, déjà sur `dev` | Réel, hors de ce changement |
| `design-system-radius` `0.125em` | `Progress.tsx:82` | `f6ccbfab`, déjà sur `dev` | Hors de ce changement |
| `design-system-radius` `0.125em` | `Progress.tsx:97` (`&[data-notched]`) | **nouveau, `a24b594`** | À trancher : `DESIGN.md` décrit les bouts arrondis en prose, mais l'échelle `rounded:` (0.25em, 0.25rem, 1.5em, 2em) n'a pas de 0.125em. Ajouter un token ou accepter. |
| `design-system-radius` `1em` | `libs/ui/src/atoms/TransitionPill/TransitionPill.tsx:54` | `4b5c32a7`, déjà sur `dev` | Faux positif : `DESIGN.md` dit « Each pill takes a 1em radius », valeur absente de l'échelle de tokens. |

Dans la page, le détecteur a tourné sur `/tv/library`, `/tv/1399` et `/tv/discover`. Limité aux éléments de la fonctionnalité (`[role=progressbar]`, `[data-diffusion]`, `[data-notched]`, pills) :
- `text-occlusion` ×5 sur Library et ×1 sur la fiche : faux positif. Les glyphes de « 32 » finissent à x 656,9, le côté diffusé commence à x 665,9. Le recouvrement ne touche que les 21 px de padding droit, c'est la construction de la `TransitionPill`.
- `low-contrast` « 3.4:1 #ffffff on #03a05c » ×11 sur la fiche, ×2 sur Discover : réel mais préexistant. `DESIGN.md` l'accepte (« 3.40:1, below AA, kept »). Il apparaît maintenant sur chaque série terminée et complète.
- Manqué par le scan : le `<code>` de la pill de diffusion mesure 9,19 px, sous les 10,5 px de la pill de comptes voisine. A le relève aussi.
- Le reste (255 `undersized-ui-text` sur Library) vient des métadonnées de carte à 10 et 10,5 px, préexistantes.

Là où A et B concordent : la pill orpheline hors bibliothèque, « Airing » dit deux fois sur la fiche, l'écart entre `DESIGN.md:624` et l'écran sur la « ligne All seasons », la barre crantée qui se lit en pointillés sur les cartes denses.

Ce que B ajoute à A : le décalage de mise en page de 33 px hors bibliothèque, le côté possédé gris à 1,17:1 sur le fond, la pill non focusable, la barre de progression annoncée deux fois au lecteur d'écran, les deux hauteurs de la ligne d'en-tête, le token de rayon manquant, les 502 du front du banc.

Ce que A ajoute à B : la rangée Requests de Home en escalier, le violet de « All seasons » au-dessus de saisons vertes, les deux gris des pills d'en-tête, le footer gris d'une série à venir contre sa pill violette.

**Visual overlays** : l'injection a réussi sur les trois pages, dans l'onglet de B. B a arrêté le live-server avec `live-server stop --keep-inject` puis fermé son onglet. Aucun overlay n'est visible à la fin du run. Aucun fichier suivi n'a changé (`git status` identique avant et après, même md5).

## Overall Impression

Les quatre états de carte se distinguent, et le rythme de chaque grille tient. La fiche est le point faible :
- hors bibliothèque, la pill reste seule sur sa ligne et pousse la page de 33 px ;
- la même information y figure deux fois, et les deux copies se contredisent sur une série à venir ;
- la ligne « All seasons » est violette au-dessus d'une saison verte identique.

Plus grosse occasion : tirer la pill et la ligne `📆` d'une seule source, et mettre la pill là où le violet demande une explication.

## What's Working

1. **Les quatre états de la pill se lisent d'un coup d'œil.** Vert sur vert (terminée, tout possédé), violet sur violet (diffusée, à jour), gris et violet (diffusée, épisodes manquants), gris sur gris (terminée, manquants). Blanc sur `airingDark` à 7,97:1, calculé par A et B. Captures `review-design-progress-pill.png`, `review-library-desktop-states.png`, `review-library-desktop-footers.png`.
2. **Le rythme reprend celui des écrans film.** Le pas de la grille TV Library vaut celui du film plus 28 px (`FOOTER_HEIGHT`). L'écart footer, badges de la rangée suivante vaut l'écart légende, badges du film : 86 px de capture dans les deux cas. `FOOTER_HEIGHT` réserve la place : CLS 0 sur Discover, Trending, Search et Requests (B). Sur `/person/15831`, 255 cartes lancent 170 requêtes `tv/{id}` sans doublon, par vagues de 40 au plus toutes les 250 ms, sans 429.
3. **La règle des saisons, la barre crantée et la pill d'en-tête.** Ted Lasso : S1 à S3 vertes, S4 violette avec E09 et E10 encore datés (`review-show-97546-seasons-desktop.png`). La barre crantée a des jonctions plates, des écarts de 1 px et des bouts ronds (`review-design-progress-notched-zoom.png`). La pill d'en-tête est la sœur de la pill de taille : même boîte, Fira Code 600, 21 px de haut, rayon 0.25em (`review-show-97546-desktop-pills.png`).

## Priority Issues

**[P1] Hors bibliothèque, la pill de diffusion tombe seule sur sa ligne et décale la page de 33 px**
- **Écran** : `/tv/1396` (Breaking Bad), `/tv/213375` (VisionQuest), toute fiche hors bibliothèque, desktop et mobile.
- **Élément** : le `<code>` du résumé dans `ShowSubtitle` (`apps/web/src/pages/Details/Details.tsx:356-364`), qui porte seul la pill `ReleaseTag[data-diffusion]` hors bibliothèque (`apps/web/src/pages/Shows/Show.tsx:96-98`).
- **Preuves** : `captures/diffusion/review-show-1396-desktop-header.png`, `review-show-213375-desktop.png`, `review-show-1396-mobile.png`, `browser-show-1396-desktop.png`, `browser-show-1396-mobile.png`. Le film garde son année en ligne : `review-movie-864370-desktop.png`. « (2008) » est à x 384, la pill à x 394,5, y 610 : un retrait de 10,5 px, le `marginLeft: 6` du style `summary`. La pill arrive à 761 ms, quand `metadataLoading` finit. À 786 ms, les lignes de détails dessous descendent de 33 px : entrée layout-shift de 0,1002, partagée avec le bloc Recommendations qui sort du viewport.
- **Cause, vérifiée** : le style `subtitle` (`Details.tsx:262-269`) ne pose pas de `display`, donc le `h4` est un bloc. Seul `metadata >summary >h4` le met en `inline-block` (`Details.tsx:298-301`), et cette branche `<details>` n'existe que quand `actions` est passé (`Details.tsx:145-157`), en bibliothèque. Sur `origin/dev`, le résumé valait `null` hors bibliothèque : le cas ne se rendait jamais. `Details.tsx` n'a pas changé.
- **Désaccord** : sur mobile, A mesure la pill 5 px à côté du centre de la page, B la trouve lisible centrée sous l'année. Le décalage de 5 px vient du même `marginLeft`.
- **Pourquoi c'est un problème** : c'est une casse neuve sur l'écran où l'on découvre une série. La pill paraît détachée, là où sa sœur en bibliothèque est accrochée à l'année. Et la page bouge une fois chargée.
- **Correction** : garder le `h4` en ligne hors de `<details>`, comme dedans, ou mettre année et pills dans une rangée flex qui passe à la ligne. Remplacer le `marginLeft` du résumé par un `columnGap` de la rangée, pour qu'une pill passée à la ligne n'ait pas de retrait. Sur desktop, la pill reste alors sur la ligne de l'année et le décalage de 33 px disparaît.
- **Commande** : `/impeccable layout`

**[P2] La diffusion est dite deux fois sur la fiche, et les deux copies se contredisent sur une série à venir**
- **Écran** : `/tv/213375` (contradiction), `/tv/1668`, `/tv/97546`, `/tv/105169` (redite).
- **Élément** : la pill de diffusion contre `meaningful.release_dates_range` (`📆 …`), construit dans `transformShowDetails` (`libs/ui/src/components/Show/Show.tsx:239-241`).
- **Preuves** : `review-show-213375-desktop.png` : « Upcoming · 14/10/2026 » et « 📆 2026 - Airing ». `review-show-1668-desktop.png` : « (1994) », « Ended · 2004 » et « 📆 1994 - 2004 ». `review-show-97546-desktop.png` : « Airing · next 29/09 » et « 📆 2020 - Airing », 190 px plus bas. `review-show-105169-desktop-header.png` : « Canceled · 2023 » et « 📆 2023 - 2023 ».
- **Cause, vérifiée** : la ligne 241 teste `ENDED.includes(entity.status)`. Une série à venir n'est pas dans `ENDED`, donc elle reçoit « Airing ». Le même fichier calcule déjà `diffusionOf` à la ligne 62, pour les cartes.
- **Pourquoi c'est un problème** : sur une série à venir, la page affirme deux choses contraires à 270 px d'écart. Ailleurs, la même information prend deux lignes. `PRODUCT.md` demande de reprendre ce que l'app dessine déjà.
- **Correction** : réduire `release_dates_range` à la plage (`1994 - 2004`, `2020 -`, `2023` pour une seule année) et laisser le mot d'état à la pill. Autre voie : construire le texte depuis `diffusionOf`, qui retire la contradiction mais garde la redite.
- **Commande** : `/impeccable distill`

**[P2] Le côté possédé gris disparaît sur le fond, et « diffusée, incomplète » se distingue mal de « terminée, incomplète »**
- **Écran** : `/tv/library`, `/tv/discover`, `/tv/trending`, Home, crédits de personne : chaque carte d'une série encore diffusée avec des épisodes manquants (Black Mirror 32|33 ; 10 cartes sur 246 dans Library).
- **Élément** : `ProgressPill` avec `neutral.from` (`libs/ui/src/components/Show/ProgressPill/ProgressPill.tsx:26-27`), qui prend la teinte `quiet.before`, `gray` sous `grayDarkest` (`libs/ui/src/atoms/TransitionPill/TransitionPill.tsx:77-79`).
- **Preuves** : `browser-library-desktop.png`, `browser-gallery-progress-pill.png`, `review-library-desktop-states.png`. Côté possédé `#1a1a1a` sur le fond `#050505` : 1,17:1. Côté diffusé violet `#6537a4` contre `grayDark` `#333` : 1,58:1 de luminance. En mode clair, calculé depuis les tokens sans rendu : le compte possédé passe à 2,22:1 (gray-500 sur gray-200).
- **Pourquoi c'est un problème** : la pill se lit comme un « 32 » isolé à gauche d'une pastille violette. L'état qui appelle un geste, diffusée et incomplète, ne diffère de « à jour » que par la moitié gauche d'une petite pill (Alex). En niveaux de gris ou en basse vision, gris et violet se confondent avec gris et gris (Sam). B note que la couleur ne joue pas sur la seule teinte (luminances 0,082 et 0,033), mais l'écart reste mince. Le gris existait déjà, le violet voisin le rend visible.
- **Correction** : donner au côté possédé neutre un bord visible dans `ProgressPill` seulement, par exemple un contour intérieur de 1 px en `grayDark` ou un fond neutre plus clair. Ne pas toucher `quiet.before` : cette teinte dessine aussi le côté `?` des pills de Swaps du film, que A et B ont vu inchangé.
- **Commande** : `/impeccable polish`

**[P2] Home, rangée Requests : les cartes film tombent 15 px sous les cartes série**
- **Écran** : `/`, rangée « Requests », desktop.
- **Élément** : `UIList.styles.row.container`, `alignItems: 'center'` (`libs/ui/src/elements/List/List.tsx:136`, vérifié).
- **Preuves** : `review-home-desktop-requests.png`. Titres à top 397 pour VisionQuest, À l'est d'Éden, Neuromancien, M, contre 412 pour Incantation et Baskın. Sur mobile, la grille virtuelle aligne déjà en haut : `review-home-requests-mobile.png`.
- **Cause** : `RequestedMoviesAndShows` demande `progress: 'true'`, donc les cartes série de cette rangée dessinent un footer de 28 px. Les cartes film, plus courtes, sont centrées plus bas.
- **Pourquoi c'est un problème** : la rangée est sur le premier écran de l'app et casse la ligne des titres.
- **Correction** : `alignItems: 'flex-start'` sur le conteneur de la rangée. Le lien More a déjà `alignSelf: 'center'`. `List` sert toutes les rangées, films compris : une rangée de cartes de même hauteur ne bouge pas.
- **Commande** : `/impeccable layout`

**[P2] La ligne « All seasons » est violette au-dessus d'une saison verte identique, sans explication à l'écran**
- **Écran** : `/tv/108545` (Le Problème à 3 corps, série renouvelée, 8/8 possédés, rien de daté), `/tv/97546` (violet au-dessus de S1 à S3 vertes).
- **Élément** : la `ProgressPill` de la ligne « All seasons » de la section Seasons (`apps/web/src/pages/Shows/components/Seasons.tsx:177`).
- **Preuves** : `review-show-108545-seasons-desktop.png`, `review-show-97546-seasons-desktop.png`, `browser-show-97546-seasons-desktop.png`. « 8|8 » violet est juste au-dessus de « Saison 1 8|8 » vert. Sur S4 et sur « All seasons » 42|42, la barre et le check Complete restent verts à côté de la pill violette.
- **Écart de doc, vu par A et B** : `DESIGN.md:624` et les commentaires `Show.tsx:80` et `:253` placent la pill de diffusion « in the "All seasons" row ». À l'écran, elle est dans la ligne du titre, « ▼ (2020) [42|42] [66 GB] [Airing · next 29/09] ». La ligne « All seasons » de Seasons n'en a pas. L'ancre des propositions fait défiler jusqu'à `#seasons`, hors de vue de l'en-tête.
- **Pourquoi c'est un problème** : la règle de la série (violet tant qu'elle est diffusée) et celle de la saison (vert quand elle est complète et finie) sont justes chacune. Côte à côte, elles se lisent comme une contradiction, et l'explication est hors écran.
- **Correction** : dessiner la pill de diffusion après « 📦 5.23 GB » dans la ligne « All seasons » de Seasons, comme `DESIGN.md` le décrit déjà. Sinon, garder la pill dans l'en-tête seul et renommer la ligne dans `DESIGN.md:624` et les deux commentaires. La première voie ajoute une troisième mention de la diffusion tant que la ligne `📆` n'est pas réduite à la plage.
- **Commande** : `/impeccable clarify`

## Persona Red Flags

**Alex (utilisateur avancé)** : sur 246 cartes de Library, 10 sont diffusées avec des épisodes manquants. Elles ne diffèrent des 28 cartes à jour que par la moitié gauche d'une petite pill, gris à 1,17:1 sur le fond. La date suivante (« next episode on 05/11 ») demande un survol par carte.

**Sam (lecteur d'écran, clavier, basse vision)** :
- Gris et violet (diffusée, manquants) contre gris et gris (terminée, manquants) : 1,58:1 de luminance sur le côté diffusé. En niveaux de gris, les deux états se confondent.
- La pill est un `span role="img"`, non focusable (`tabIndex` -1) et hors du lien de la carte, qui n'entoure que le titre. Au clavier, la date suivante est inaccessible.
- La barre `div role="progressbar"` a `aria-valuenow` et `aria-valuemax` mais pas d'`aria-label`. Son nom vient de son `title`, identique à l'`aria-label` de la pill : le lecteur annonce la même phrase deux fois par carte.
- Ce qui marche : l'`aria-label` de la pill dit « still airing », « ended in 2013 », « canceled in 2018 ». La pill de diffusion est du vrai texte, son `title` est le statut TMDB brut (« Returning Series », « Ended »).
- Anneau de focus des cartes : celui de Chrome par défaut, préexistant.

**Casey (PWA, 390 px, tactile)** :
- Les cartes montrent la pill sans barre, sans `title` au toucher. « next 29/09 » n'existe que sur la fiche.
- La ligne d'en-tête de Ted Lasso remplit exactement 390 px, bord droit à 370. Un badge de proposition en attente ou « Upcoming · 25/11/2026 » la fera passer sur deux lignes (`review-show-97546-mobile.png`, `browser-show-97546-mobile.png`).
- Hors bibliothèque, la pill est 5 px à côté du centre sous l'année (`review-show-1396-mobile.png`).
- Pas de défilement horizontal à 390 px.

## Minor Observations

- **Deux gris dans la ligne d'en-tête.** La pill terminée ou annulée est en `grayDark` `rgb(51,51,51)`, la pill de taille voisine en `gray` `rgb(26,26,26)` (`review-show-1668-desktop.png`, `review-show-105169-desktop-header.png`). Deux boîtes identiques dans deux gris se lisent comme un état survolé ou sélectionné. C'est ce que dit `DESIGN.md` (« fill of the aired side »), mais la pill est une sœur `ReleaseTag`, pas une moitié de `TransitionPill`. Prendre le `gray` de la taille, ou écrire dans `DESIGN.md` pourquoi elle diffère. `Show.styles.pills` (`Show.tsx:264-271`).
- **Deux hauteurs dans la ligne d'en-tête.** `ProgressPill` fait 17,8 px avec un texte de 10,5 px et des bouts ronds. La taille et la diffusion font 21,2 px, texte à 9,19 px, rayon 2,3 px. Une pastille violette arrondie de 17,8 px voisine avec une pill violette carrée de 21,2 px. L'écart de hauteur existait déjà avec la taille.
- **Série à venir : carte et fiche divergent.** La fiche d'une série « In Production » a la pill violette, sa carte garde un footer gris « 📅 Upcoming 14/10/2026 » (`review-show-213375-desktop.png`, `review-trending-upcoming-desktop.png`).
- **Les footers apparaissent d'un coup.** Sur Discover et Trending, ils arrivent 1 s après la carte, via `limited` puis la requête TMDB, sans l'`opacity 400ms` standard de l'app.
- **Barre crantée, le seuil est une décision.** À 8 saisons, les parts arrondies se lisent encore en pointillés (Game of Thrones, `review-person-footers-zoom.png`). Deux cartes voisines changent de style entre 4 saisons ('Til Death) et 9 (Peep Show) (`review-show-2710-related-footers.png`). À 25 parts sur une barre de carte de 83 px (544 épisodes), chaque part fait 2,4 px et 29 % de la barre est de l'écart : elle se lit comme une règle graduée (`browser-discover-notched-544-x3.png`, `review-notched-zoom.png`).
- **Échec silencieux d'une requête de progression.** `console.warn`, pas de retry, pas de footer. `FOOTER_HEIGHT` garde la place, rien ne bouge.
- **502 du banc, hors du diff.** Sur `/tv/requests`, 22 puis 18 requêtes `/api/shows/:id/progress` sur 49 rendent 502, ainsi que `/api/persons/metadata?page=5` et `/api/movies/metadata?page=5`. Cause, reproduite par B : `tools/dev/h2-front.mjs:26` ouvre `http.request({ host: 'localhost' })`, alors que le serveur de dev n'écoute que sur `[::1]:4210`. Sous une rafale, le happy-eyeballs de Node 24 abandonne après 250 ms par essai, et la ligne 30 répond `writeHead(502)`. Avec `host: '::1'` ou `--network-family-autoselection-attempt-timeout=2000` : 35 sur 35 en 200, trois fois. Le front vient de `cf0d2a6` et sert aussi `yarn web`. La production passe par Caddy.
- **Côté diffusé tenu sous AA.** Blanc sur `#03a05c` à 3,39:1 sur les cartes (12 px) et la fiche (10,5 px). Préexistant et accepté dans `DESIGN.md`, maintenant sur chaque série terminée et complète.
- **Part du violet selon l'écran.** Library : 38 cartes distinctes sur 209 (28 à jour, 10 incomplètes), contre 150 vertes et 21 grises. Elles se groupent en première rangée, Library étant triée par dernier rafraîchissement : 41 des 49 pills du premier écran sont violettes des deux côtés. Trending et la rangée « Airing » de Home sont presque toutes violettes, c'est attendu. Le footer violet ne touche jamais les badges de l'affiche.
- **Chernobyl (`/tv/87108`)** est en bibliothèque : 5|5 vert, 22.13 GB, « Ended · 2019 ».
- **Écrans film inchangés.** Movie Library sans violet, même disposition. Swaps : le côté `?` de la pill de transition reste gris. Fiche film : année en ligne (`review-movie-library-desktop.png`, `review-movie-swaps-desktop.png`, `review-movie-864370-desktop.png`).
- **Console.** Rien du code de la fonctionnalité. Préexistant sur chaque page : `ReferenceError: en is not defined`, avertissements future-flag de React Router, 3 `AbortError` venus de `PersonsMetadata.tsx:38`, clé manquante dans `UIControls`, `defaultProps` dans `VirtualGrid`, avertissements de precache webpack.
- **Couverture de B.** Mode clair calculé depuis les tokens, sans rendu : écrire `theme-ui-color-mode` dans le localStorage partagé aurait basculé les onglets des autres sessions. Discover compté sur les 49 premières cartes. `Atoms / TransitionPill` de la galerie non inspecté seul.

## Questions to Consider

- La pill d'en-tête et la plage `📆` doivent-elles devenir un seul élément tiré de `diffusionOf`, au lieu de deux qui peuvent se contredire ?
- Le Problème à 3 corps a diffusé son dernier épisode en 03/2024 et n'a rien de daté, mais il s'affiche « Airing » en violet. TMDB dit « Returning ». « Airing » est-il le mot à lire là ? Les libellés sont décidés, la question vérifie leur formulation sur des données réelles.
- La ligne « All seasons » de Seasons serait-elle plus claire avec la pill, maintenant que son violet peut différer de chaque saison dessous ?
- La date suivante d'une carte doit-elle être atteignable sans survol, dans le nom accessible du lien de la carte ou sur une pill focusable ?

**Trend for `apps-web-src-pages-shows-show-tsx` (last 4 runs): 21/40 → 23/40 → 26/40 → 20/32.** Les trois premiers runs notaient toute la fiche sur 10 heuristiques. Celui-ci note la diffusion sur 8 : la comparaison n'est pas à périmètre égal (65 % puis 62 %).
Wrote `.impeccable/critique/2026-09-26T10-11-58Z__apps-web-src-pages-shows-show-tsx.md`.

Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3
