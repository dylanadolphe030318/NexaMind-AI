---
story: 1-1-voir-la-page-d-accueil-de-nexamind
title: Voir la page d'accueil de NexaMind
epic: 1
sprint: 1
status: done
baseline_commit: 2ac8f9074d108f6b4ad24d962e518e560dec3651
---

# Story 1.1 : Voir la page d'accueil de NexaMind

## Récit utilisateur

En tant que visiteur, je veux voir une page d'accueil claire afin de comprendre le service et de commencer à créer un compte ou à me connecter.

## Critères d'acceptation

1. Étant donné que j'ouvre l'adresse de l'application, quand la page d'accueil se charge, alors je vois le nom « NexaMind AI » et une courte présentation du service.
2. Étant donné que je consulte la page d'accueil, quand je cherche comment accéder au service, alors je trouve des liens clairement nommés pour créer un compte et me connecter.
3. Étant donné que j'ouvre l'application sur un écran mobile de 375 px ou un écran d'ordinateur de 1280 px, quand la page s'affiche, alors son contenu ne provoque pas de défilement horizontal.

## Limites de la story

Cette story couvre la page publique et ses liens d'accès. La création de compte, la connexion et le tableau de bord sont traités dans les stories suivantes.

## Review Triage Log

| Finding | Verdict | Evidence and route |
|---|---|---|
| Vérification du responsive limitée aux tests automatisés | false | carried — La page a été mesurée en navigateur à 375 px et 1280 px ; aucun élément ne dépasse la largeur visible. La story exige le comportement, pas un test automatisé dédié. |
| Les liens d'inscription et de connexion aboutissent à des routes absentes | medium | carried — `src/app/page.tsx` pointe vers `/signup` et `/login`, sans routes correspondantes ; la story 1.1 réserve ces parcours aux stories suivantes. Le même finding a été rapporté par la revue edge-case ; différé une seule fois. |
| Les statuts de la story et du suivi sprint divergent (`in-review` / `review`) | false | Les fichiers suivent des vocabulaires distincts : `in-review` est le statut de la spec et `review` celui du sprint ; les deux indiquent la même étape et sont mappés par le workflow. |
| Le contexte Epic 1 n'autorise pas explicitement la connexion sans session | medium | Le contexte compilé indique que seule la création de compte est permise sans session, alors que la story 1.3 couvre la connexion. Aucun parcours d'authentification n'est implémenté ici ; différé avant la story 1.3 pour clarifier le contexte. |
| La navigation desktop n'est pas persistante au défilement | false | La story fournie n'exige pas un en-tête fixe ; elle demande la page et ses liens aux largeurs 375 px et 1280 px, qui sont vérifiées. |
| Les critères d'accessibilité du contexte Epic ne sont pas ajoutés à la story | false | Le correctif suit les critères de la story source ; ils ne demandent pas d'ajouter de nouvelles exigences au document. Les liens ont un focus visible dans `src/app/globals.css`. |
| `overflow-x: clip` pourrait masquer un débordement | false | Mesure navigateur à 375 px et 1280 px : `scrollWidth` ne dépasse pas `clientWidth` et aucun élément n'a de boîte hors de la zone visible. |
| Les largeurs intermédiaires et limites des breakpoints ne sont pas testées | false | La story nomme uniquement 375 px et 1280 px ; ces deux cas ont été vérifiés sans débordement. |
| La vérification responsive n'enregistre pas le navigateur ni une preuve reproductible | false | L'exécution directe en navigateur a re-mesuré les deux viewports et les boîtes des éléments ; la story ne demande ni navigateur déterminé ni capture persistée. L'absence de test de régression automatisé est suivie séparément ci-dessous. |
| La colonne Verdict mélange niveaux de gravité et réfutations | false | Les valeurs `false` et `medium` sont des verdicts explicitement autorisés par les instructions de revue ; aucune catégorie de résultat n'est perdue. |
| Le titre « à portée de question » est une formulation non standard | false | Le paragraphe qui suit précise que le service organise les ressources et retrouve des réponses ; le message de la page reste compréhensible. |
| La présentation ne mentionne pas les réponses sourcées | false | Les critères de la story demandent une courte présentation du service, pas des citations ; la page ne prétend pas afficher des sources. |
| La page d'accueil n'a pas de test de régression automatisé | medium | La vérification navigateur manuelle passe aux deux largeurs requises, mais le dépôt n'a pas de script ni de cadre de test d'interface ; l'ajout d'une infrastructure navigateur dépasse un correctif trivial et est différé. |
