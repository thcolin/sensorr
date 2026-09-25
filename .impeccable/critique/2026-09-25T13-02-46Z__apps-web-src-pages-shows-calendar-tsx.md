---
target: the series calendar /tv/calendar
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/thcolin/orca/workspaces/sensorr/feat-tvshows/apps/web/src/pages/Shows/Calendar.tsx"
target_fingerprint: "sha256:5510cfe7c9d86be5c7c1415ec3be82b95b3fdbd0148d933286c96ab10a9c5fce"
target_path: /Users/thcolin/orca/workspaces/sensorr/feat-tvshows/apps/web/src/pages/Shows/Calendar.tsx
timestamp: 2026-09-25T13-02-46Z
slug: apps-web-src-pages-shows-calendar-tsx
---
Method: dual-agent (Assessment A et B : deux sous-agents isolés, workflow)

# Critique de `apps/web/src/pages/Shows/Calendar.tsx` (`/tv/calendar`), 2026-09-25, après le tour de retours

Score : 25/40, Acceptable.

Banc local sur le port 4453, Agenda et Month (septembre et octobre 2026) en 1440×900 et 390 px, `/movie/calendar` en référence. Aucune action d'écriture. Seul geste de B dans l'app : un clic sur le mois `oct.`, un filtre de lecture.

## Design Health Score

| # | Heuristique | Score | Problème principal |
|---|---|---|---|
| 1 | Visibilité de l'état du système | 2 | `8667 Results` en Agenda ne correspond à rien de visible. Une case de Month cache des lignes sans signe (jeudi 3 septembre). Aujourd'hui n'est pas distingué en Agenda. Month charge sur une grille vide. |
| 2 | Correspondance avec le monde réel | 3 | « Results » n'a pas de sens dans un calendrier. Les spéciaux `S00E79 Épisode 79` sont listés sans vrai titre. |
| 3 | Contrôle et liberté | 3 | Vue dans l'URL, mois dans l'historique. Aucun retour à aujourd'hui après un scroll ou un changement de mois. |
| 4 | Cohérence et standards | 2 | Pastille d'état à deux endroits selon la vue. Aujourd'hui et le passé marqués autrement d'une vue à l'autre. « Results » ne mesure pas la même chose que sur le film. Sélecteur de mois plus large que celui du film. |
| 5 | Prévention des erreurs | 3 | Écran en lecture seule, aucune action risquée. |
| 6 | Reconnaissance plutôt que rappel | 2 | L'état n'existe qu'en emoji avec un `title`. Aucune légende pour 📅, 📼, 🛎️, 🍿 et 📺 éteint. |
| 7 | Flexibilité et efficacité | 2 | Aucun raccourci (aujourd'hui, mois précédent ou suivant). Un jour de Month ne s'ouvre pas. Aucun filtre, le film a « Hide Library ». |
| 8 | Esthétique et minimalisme | 3 | Environ 630 px de vide entre le texte et la pastille en Agenda. Bandeau vert de 76 px pour un seul compteur sur mobile. |
| 9 | Récupération des erreurs | 3 | La sentinelle propose « Unable to load… retry ». `Warning` couvre l'échec et le vide. |
| 10 | Aide et documentation | 2 | L'état vide dit qu'il faut suivre des séries. Rien n'explique les états. |
| **Total** | | **25/40** | **Acceptable** |

Aucune heuristique `n/a`. Maximum applicable : 40.

## Design Specificity Verdict

**LLM assessment** : le vocabulaire est celui de Sensorr, la structure est celle de n'importe quel agenda.
- Propre au produit : les emoji d'état d'`EpisodeStatus`, le code `SxxEyy` en Fira Code, le regroupement `S02E01-E06 · 6 episodes` de `coverageLabel`, le header vert de `withControls`.
- Générique : une liste chronologique et une grille de 7 colonnes, comme Google Agenda.
- Occasion manquée : Sensorr sait quels épisodes attendent l'utilisateur, 🍿 wanted et 🛎️ proposed. Ils ont pourtant le poids de 📼 owned et 📅 upcoming, dans la même pastille grise (32 px en Agenda, 24 px en Month). L'écran montre ce qui sort, pas ce qui demande une action.
- La date en colonne, au lieu du badge `📅 02/09` sur l'affiche du film, est la décision du 2026-09-25. Le reste de la ligne n'a pas été calé sur un rôle existant (voir P1 n°1).

**Deterministic scan** : `impeccable detect --json` rend `[]` (code 0) sur `Calendar.tsx`, sur tout `apps/web/src/pages/Shows/`, sur le calendrier film et sur `State.tsx` / `FilterReleaseDate.tsx`. Le scan statique ne trouve rien, ni sur la cible ni sur sa contrepartie film.

Dans le navigateur, le détecteur relève 59 constats en Agenda et 5 en Month (septembre). Tri :

| Règle | Nombre | Verdict |
|---|---|---|
| `buried-raster` | 50 | Faux positif. Fondu d'entrée de `Picture` (`opacity` 0 → 1, délai 400 ms). Après chargement, chaque `img` est à `opacity: 1`. |
| `clipped-overflow-container` | 3 | Faux positif. `overflow: hidden` voulu de l'habillage d'affiche et du header. |
| `tight-leading` | 3 | Faux positif. Deux nœuds `<script>` / `<style>`, et un `span` au `line-height` du token `body`. |
| `overused-font` | 1 | Faux positif. Open Sans est la police body de `DESIGN.md`. |
| `skipped-heading` | 1 | Faux positif. Le `<h2>` « Sorry, no results » est celui du panneau de recherche caché, sur toutes les pages. |
| `low-contrast` du `h4` `Calendar` | 1 | Écart connu, consigné dans `DESIGN.md` (« Known deviation », 2026-09-18), identique sur le film. |
| `flat-type-hierarchy` | 1 | À moitié système (h5 = body = 16 px). L'autre moitié est réelle : la date `h5` en Raleway 800 pèse plus que le nom de la série en Open Sans 14 px 700. |
| `low-contrast` du bouton pressé de `ViewSwitch` | 1 par vue | **Vrai constat.** `primary` sur `whitePure`, 2,0:1 pour du 16 px. Même habillage que le mois choisi du `CalendarMonthPicker` film : parité, pas invention. |

Ce que le détecteur et les mesures de B ajoutent à A :
- **La case du 3 septembre déborde.** A pensait qu'aucun jour ne débordait sur septembre et octobre. B mesure un `ul` à `scrollHeight` 142 pour `clientHeight` 95 : The Gentlemen S02E01-E08 est invisible sur la capture. Cela passe de l'observation mineure au P1.
- Le contraste du bouton pressé, que A n'avait pas relevé.
- La largeur du sélecteur de mois : 902 px contre 760 px sur le film.

Là où A et B concordent : le compteur « Results » qui ne compte pas ce qu'on voit, les spéciaux S00 dans l'Agenda, l'ordre du DOM de la toolbar, le mois choisi sans état exposé.

**Visual overlays** : l'injection a réussi (`document.title` préfixé `[Human]`, `detect.js` injecté depuis `live-server` sur le port 8400). Le serveur est arrêté et l'onglet de B est fermé : **aucun overlay n'est visible dans le navigateur**. En Agenda, l'injection a suivi un `scrollTo(0,0)` qui a chargé le passé : l'overlay a couvert juillet et août, pas la semaine en cours. `apps/web/src/index.html` n'a pas bougé (même md5).

## Overall Impression

L'Agenda s'ouvre pile sur aujourd'hui, groupe bien les épisodes et garde sa date sticky à la hauteur d'une ligne. C'est la bonne base. Ce qui ne tient pas : l'écran dit des choses fausses ou cachées. Un compteur qui compte l'historique entier, une case du mois qui avale une série sans le montrer, une pastille d'état à 630 px de ce qu'elle qualifie. La plus grosse occasion : faire ressortir les 🍿 et 🛎️, les seuls épisodes qui demandent quelque chose.

## What's Working

1. **Le regroupement des épisodes.** `groupByDay` (`agenda.ts:53-60`) fusionne les épisodes consécutifs d'une série au même état. Une saison sortie d'un bloc tient en une ligne : `S03E01-E10 · 10 episodes` pour Nobody Wants This, `S03E01-E08` pour Lupin. C'est la densité que demande `DESIGN.md`.
2. **L'axe de l'Agenda.** La date est sticky, à la hauteur exacte d'une ligne (`ROW = '4em'`, `Calendar.tsx:18`, repris par `date.height` et `line.minHeight`). Elle reste alignée sur la première ligne de son jour. Le scroll ne saute pas quand le passé se charge au-dessus (`useLayoutEffect`, `Calendar.tsx:243-262`). Sur mobile, elle devient un en-tête de jour sur `grayLightest`, sans deuxième mise en page, et la page ne défile pas en largeur (`scrollWidth` 390).
3. **La bascule Agenda │ Month.** Elle reprend le dessin des mois du `DatePicker` et reste à x 1148 dans les deux vues, sans saut au changement de vue. Elle expose `aria-pressed`. Elle est masquée sur mobile comme décidé. Les cases du mois font toutes 196×128, et le survol est carré (`0px` de rayon), conforme à la décision.

## Priority Issues

**[P1] En Agenda, la pastille d'état est détachée de la ligne qu'elle qualifie**
- **Pourquoi c'est un problème** : à 1440 px, le texte finit vers x 738 et la pastille est à x 1368. L'œil traverse environ 630 px de vide pour relier « Brothers S01E01-E02 » à 🛎️. En Month, la même pastille suit le code. C'est la famille « indicateur détaché » que Thomas a déjà signalée.
- **Correction** : dans `UILine`, rendre `EpisodeStatus` juste après le `<code>`, comme dans `UICell`. Une seule place pour l'état dans les deux vues.
- **Commande** : `/impeccable layout`

**[P1] Le compteur « Results » ne compte pas ce qu'on voit**
- **Pourquoi c'est un problème** :
  - en Agenda, `8667` vient de `past.total + future.total` (`Calendar.tsx:210`) : tout l'historique daté des séries suivies, spéciaux compris, alors qu'une centaine de lignes sont chargées ;
  - en Month, `30` (septembre) et `33` (octobre) comptent les épisodes des 6 semaines de la grille (`weeksRange`), jours hors du mois compris, et pas les lignes affichées ;
  - sur le film, `55` compte les films du mois : même mot, même place, autre mesure ;
  - sur mobile, ce chiffre est le seul contenu du bandeau vert de 76 px ;
  - il est aussi à droite de la bascule (x 1314), alors que la décision met la bascule à droite de la toolbar.
- **Correction** :
  - Agenda : retirer `results` de `withControls`, ou le remplacer par un chiffre qui sert à décider (épisodes à venir, nombre de 🍿 et 🛎️) ;
  - Month : ne compter que les jours du mois, et compter les lignes affichées, pas les épisodes ;
  - dans les deux grilles (`Calendar.tsx:817`, `:837`), placer `results` avant `view` pour que la bascule soit le dernier élément, au même x dans les deux vues.
- **Commande** : `/impeccable clarify`

**[P1] Une case de Month cache des sorties sans aucun signe**
- **Pourquoi c'est un problème** : le jeudi 3 septembre porte 3 lignes (Chad Powers, Silo, The Gentlemen). L'`ul` de la case mesure 142 px de contenu pour 95 px visibles : The Gentlemen S02E01-E08 n'apparaît pas. Le seul indice est `scrollbarWidth: thin`, invisible sous macOS avec les barres en overlay. Une saison entière sort ce jour-là et la vue ne le montre pas.
- **Correction** : dans `UIMonth` (`'>ul'`, `Calendar.tsx:701-713`), réduire le `gap: 11` / `margin: 12` / `padding: 12` qui mangent la case, et quand les lignes dépassent quand même, afficher les premières puis un « +N » cliquable qui ouvre l'Agenda sur ce jour. Les cases gardent leur taille, comme décidé.
- **Commande** : `/impeccable layout`

**[P2] L'ordre du clavier et l'état exposé ne suivent pas la toolbar**
- **Pourquoi c'est un problème** :
  - dans le DOM : bascule, `h4` `Calendar`, `Results`, puis le sélecteur de mois. À l'écran : titre, sélecteur, bascule, compteur. Tab va d'abord à droite, puis revient à gauche dans les 17 contrôles du sélecteur. Un lecteur d'écran entend la bascule avant le titre de la page ;
  - le mois choisi du `CalendarMonthPicker` n'a ni `aria-pressed` ni `aria-current` : il n'est annoncé que par la couleur ;
  - le bouton pressé de la bascule est à 2,0:1 (`primary` sur `whitePure`), comme le mois choisi du film.
- **Correction** : rendre `view` après `air_date` dans l'ordre des composants de `withControls`, ou le placer par `grid-area` sans le remonter dans le DOM. Ajouter `aria-pressed` au mois choisi et revoir le contraste du bouton pressé : les deux touchent aussi le film, c'est à valider avec Thomas avant de changer le rendu film.
- **Commande** : `/impeccable harden`

**[P2] Aujourd'hui et le passé ne se lisent pas pareil dans les deux vues**
- **Pourquoi c'est un problème** :
  - en Month, aujourd'hui est un disque plein sur le numéro du jour ; en Agenda, « ven. 25 sept. » a le même blanc que les jours à venir ;
  - la ligne « Today ──── » prend une ligne entière de 4em même quand rien ne sort ce jour-là (`Calendar.tsx:340-342`, `394-412`) ; sur mobile, le jour même prend deux blocs avant la première sortie ;
  - l'Agenda grise les dates passées (`grayDarkest`), Month ne grise que les jours hors du mois (`opacity: 0.4`).
- **Correction** : en Agenda, donner à la date du jour le traitement du numéro du jour en Month (fond `text`, couleur `white`). Faire de « Today » un filet sans hauteur propre quand le jour est vide. Griser le passé dans les deux vues, ou dans aucune.
- **Commande** : `/impeccable polish`

## Persona Red Flags

**Alex (utilisateur avancé, desktop et clavier)** : aucun raccourci pour revenir à aujourd'hui ou changer de mois. Loin dans l'Agenda, seul un rechargement le ramène à aujourd'hui. En Month, cliquer sur « 22 » n'ouvre pas l'Agenda à ce jour. Pour trouver ses 🛎️ et 🍿, il lit toutes les lignes, faute de filtre. Il ne voit pas The Gentlemen le 3 septembre.

**Sam (clavier et lecteur d'écran)** : ordre de tabulation inversé dans la toolbar, bascule annoncée avant le titre. Mois choisi annoncé par la seule couleur. Bouton pressé de la bascule à 2,0:1. Point positif : chaque ligne a un `aria-label` complet (« Brothers S01E01-E02, 2 episodes, Proposed ») et chaque jour est une `section` étiquetée par son `h5`.

**Casey (mobile, PWA)** : 76 px de bandeau vert pour « 8667 Results » seul, là où le film met son sélecteur de mois. Le jour même prend deux blocs, l'en-tête « ven. 25 sept. » puis « Today ────── », avant la première sortie. Pastilles de 28 px, mais toute la ligne est cliquable : acceptable.

## Minor Observations

- **Spéciaux et épisodes non suivis dans l'Agenda.** House of the Dragon `S00E79` à `E89`, « Épisode NN » 📺 éteint, revient une semaine sur deux entre les vrais épisodes de S03. B compte 6 lignes S00 sur les 58 du premier chargement, A environ un tiers des lignes de juillet et août. Chad Powers `S02E01-E06` est aussi non suivi. Le film a « Hide Library », la série rien. La décision « épisode non suivi = 📺 éteint » dit comment l'afficher, pas s'il faut l'afficher : une case « Hide not followed » sur le modèle de `hide_library` (`apps/web/src/pages/Calendar/Calendar.tsx:128-144`), ou la saison 0 exclue par défaut, est une question de périmètre pour Thomas.
- **Colonne du nom trop étroite en Agenda.** Fixée à `12em` (`Calendar.tsx:555`) : « Le Seigneur des anneaux : Les Anneaux de pouvoir » est tronqué alors que la moitié droite de la ligne est vide. `minmax(12em, max-content)` avec un plafond garderait l'alignement des codes.
- **Hiérarchie de la ligne.** La date `h5` (Raleway 16 px 800) pèse plus que le nom de la série (`strong`, Open Sans 14 px 700). Le code à `#999` sur noir est à 7,4:1, correct.
- **Pastilles illisibles en Month.** 24 px, emoji de 12 px, et 📼 sur fond `gray` se voit à peine. Nom et code à 12 px.
- **Chargement de Month.** Grille vide avec `aria-busy`, alors que l'Agenda a ses `PLACEHOLDERS`.
- **Sélecteur de mois plus large que celui du film.** 902 px (colonne `1fr`, grille `title air_date view results`) contre 760 px : les mois ne tombent pas aux mêmes x d'un calendrier à l'autre.
- **Jours de la semaine décalés.** Les libellés « lun. », « mar. »… sont environ 3,5 px à gauche des numéros (`weekdays.paddingX: 8` à `fontSize: 6` contre `cell.padding: 10` + `time.paddingX: 9`).
- **Aujourd'hui au ras du haut.** Rien d'hier n'est visible à l'ouverture, donc rien n'indique qu'un passé existe au-dessus.
- **Survol à peine visible en Agenda.** `white` vers `grayLighter` (4 %). Carré, conforme à la décision.
- **Années jusqu'à 1900.** Le sélecteur va de 1900 à 2033, hérité du film, sans objet pour des épisodes de séries suivies.
- **« Proposed » dans le nom accessible.** Le libellé visuel est parti, l'`aria-label` le garde via `EpisodeStatusOptions[status].label`. C'est voulu : c'est la seule façon pour un lecteur d'écran de lire l'état.
- **Console.** `ReferenceError: en is not defined` en warn au chargement de l'app, hors cible. `A form field element should have an id or name attribute` vient du champ de recherche du header.

## Questions to Consider

- **Et si l'Agenda partait de ce qui attend une action ?** Les 🍿 wanted et 🛎️ proposed de la semaine en tête, puis la chronologie. `PRODUCT.md` dit « put what matters first ».
- **Le calendrier doit-il lister ce qu'on ne suit pas ?** Un épisode 📺 éteint dans un calendrier de séries suivies est une information, ou du bruit ?
- **À quoi sert le compteur ?** Si aucun chiffre n'aide à décider, la case `results` a-t-elle sa place dans la toolbar de la série ?
- **Une seule pastille d'état pour les deux vues ?** Même place, même taille en Agenda et en Month : la bascule changerait la mise en page, pas la façon de lire l'état.

**Trend for `apps-web-src-pages-shows-calendar-tsx`** : premier passage sur cette cible, pas encore de tendance (25/40).
Wrote `.impeccable/critique/2026-09-25T13-02-46Z__apps-web-src-pages-shows-calendar-tsx.md`.

Questions skipped: polish enchaîne sur le snapshot, Thomas juge l'écran au point de contrôle 3
