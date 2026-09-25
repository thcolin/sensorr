---
target: filtres rapides Jobs + Notifications
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:apps/web/src/pages/Jobs/Jobs.tsx"
target_fingerprint: "sha256:3bc57246c01c1b22da8c3ba90c87d33faa3521d572450ea5d6c904b98e0d1702"
target_path: apps/web/src/pages/Jobs/Jobs.tsx
timestamp: 2026-09-23T16-23-55Z
slug: src-pages-jobs-jobs-tsx
---
# Critique : filtres rapides de /jobs et du volet Notifications

Method: dual-agent. Le passage navigateur de A a échoué (le MCP chrome-devtools dépassait le délai sur Network.enable). B est passé en CDP brut, complet sur /jobs, partiel sur le volet.

Cibles : Jobs.tsx:212-238 et styles.filters:365, Notifications.tsx:71-92 et styles.filters:224.

## Heuristiques (14/40, Poor)
1 Visibilité de l'état : 1. Aucun filtre et tous les chips cochés s'affichent pareil. Pas de compteur.
2 Correspondance avec le monde réel : 2. Le volet affiche `missing`/`request` mais filtre sur `sync`/`keep-in-touch`, et les emoji changent d'un écran à l'autre.
3 Contrôle et liberté : 1. Pas de « tout » ni de reset.
4 Cohérence : 1. Deux barres copiées-collées sans le même vocabulaire. `Options` fait autrement (compteur, reset par clic sur le label).
5 Prévention des erreurs : 2. `migrate` n'a pas de chip et disparaît dès qu'un filtre est actif.
6 Reconnaissance : 2. Les emoji aident, mais l'état actif ne tient qu'à une opacité de 50 %.
7 Flexibilité : 1. Pas de clavier, pas de geste « seulement celui-ci », pas de compteur.
8 Esthétique : 2. Une bande verte saturée sur un contrôle secondaire.
9 Récupération : 1. « Up to date / Not notifications yet » s'affiche quand un filtre masque tout.
10 Aide : 1. Rien n'indique que la sélection est multiple.

## Priorités
- [P0] Chips en `<div onClick>`, tabIndex -1, sans role ni aria-pressed : inaccessibles au clavier et au lecteur d'écran.
- [P1] Modèle de sélection ambigu, sans reset. Le premier clic isole au lieu de masquer.
- [P1] Contraste de 2.98:1 (label 12px `rgb(230,230,230)` sur `rgb(6,152,89)`), environ 2:1 à l'état non sélectionné.
- [P2] Libellé et valeur divergent dans le volet, et son état vide est faux.
- [P2] Pas de compteur, `migrate` inaccessible. Trois tables d'emoji recopiées.

## Détecteur
CLI : 7 findings, dont `design-system-radius` 1em sur les chips (Jobs.tsx:382, Notifications.tsx:241). DESIGN.md:478 l'autorise, alors que sa propre règle dit « un rectangle = une action ». Overlay : 170 findings sur /jobs, aucun sur les chips. Le contraste des chips n'a été vu que par la sonde manuelle.
