---
story: 4-8-afficher-les-sources-de-la-réponse
title: Afficher les sources de la réponse
epic: 4
sprint: 7
status: ready-for-dev
---

# Story 4.8 : Afficher les sources de la réponse

## Récit utilisateur

En tant que membre, je veux voir et ouvrir les sources utilisées pour la réponse, afin de vérifier d'où vient l'information.

## Critères d'acceptation

1. Étant donné que l'assistant répond à ma question, quand sa réponse s'affiche, alors les sources utilisées sont présentées séparément de la réponse.
2. Étant donné qu'une source est affichée, quand je la sélectionne, alors elle identifie et ouvre la ressource correspondante.

## Limites de la story

Liste de sources sous la réponse de la page « Assistant » (story 4.7). Dépend de la story 4.7. Pas de lien entre chaque phrase et sa source (story 4.14 plus tard), pas d'historique.

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Les sources affichées sont uniquement les passages que le modèle déclare avoir utilisés, après vérification par le serveur qu'ils font bien partie des passages envoyés (jamais un titre inventé par le modèle).
- [ ] Chaque source affiche le titre de la ressource et un court extrait (même découpage de 200 caractères que la story 4.5), avec le lien « Ouvrir la ressource » vers `/resources/<id>`.
- [ ] Plusieurs passages de la même ressource donnent une seule source (la ressource n'apparaît qu'une fois).
- [ ] Si le modèle ne déclare aucune source valide, la réponse n'est pas présentée comme fiable : le comportement est celui de la story 4.9 (absence de réponse), et non une réponse sans source.
- [ ] Les titres de sources viennent des ressources que le membre peut voir, déjà filtrées par les droits d'accès : aucune ressource inaccessible ne peut apparaître.

## Textes d'écran

- Titre de la zone : « Sources »
- Lien : « Ouvrir la ressource »

## Notes pour le développement

- Architecture : AD-5 (le serveur vérifie que les références de source appartiennent aux passages retrouvés), AD-2 (RLS).
- Étendre le résultat de l'assistant de la story 4.7 avec la liste des sources validées (id de ressource, titre, extrait via `buildPassageExcerpt`), dédoublonnée par ressource, ordre de proximité décroissant.
- Tests unitaires : dédoublonnage par ressource ; numéro de source inconnu rejeté ; aucune source valide = pas de réponse présentée comme fiable.
- Test d'intégration (compte de test, RLS active, pas de clé de service) : les sources proviennent exclusivement de passages renvoyés par la recherche autorisée.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Question 1 de `tests-ia.md` : sous la réponse, la zone « Sources » cite « Architecture 1 ».
- [ ] Questions 5 et 6 : les sources citent « Retour de test sprint 3 » et « Retour de test sprint 4 » selon la question.
- [ ] Un clic sur « Ouvrir la ressource » ouvre la bonne ressource.
- [ ] Une même ressource n'apparaît qu'une fois dans « Sources ».
- [ ] Les accents s'affichent correctement.
