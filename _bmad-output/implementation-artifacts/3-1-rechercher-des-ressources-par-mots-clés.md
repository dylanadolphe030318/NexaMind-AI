---
story: 3-1-rechercher-des-ressources-par-mots-clés
title: Rechercher des ressources par mots-clés
epic: 3
sprint: 3
status: ready-for-dev
---

# Story 3.1 : Rechercher des ressources par mots-clés

## Récit utilisateur

En tant que membre, je veux rechercher les ressources par mots présents dans le titre ou le texte, afin de retrouver rapidement une information partagée.

## Critères d'acceptation

1. Étant donné qu'une ressource contient les mots recherchés dans son titre ou son texte, quand je lance la recherche, alors cette ressource apparaît dans les résultats.
2. Étant donné que des résultats sont affichés, quand je les consulte, alors chacun montre le titre, un extrait du texte et un lien pour ouvrir la ressource.
3. Étant donné qu'aucune ressource ne correspond, quand la recherche se termine, alors l'écran indique qu'aucun résultat n'a été trouvé et me laisse modifier la recherche.
4. Étant donné qu'une ressource a été supprimée, quand je recherche un terme qui figurait dans son titre ou son texte, alors cette ressource ne figure plus dans les résultats.

## Limites de la story

Recherche par mots-clés uniquement : aucune IA, aucun embedding (Epic 4). Pas d'historique des recherches (stories 3.2 à 3.4), donc aucune table nouvelle.

## Notes pour le développement

- Architecture : lecture côté serveur avec la session de la personne ; la RLS existante sur `resources` limite les résultats aux ressources accessibles. Aucune migration attendue.
- Formulaire de recherche (GET) sur une page `/resources/search?q=...` ou sur la liste, avec un lien d'accès depuis `/resources`. Recherche insensible à la casse et aux accents si possible, sur titre et texte.
- Les caractères spéciaux saisis (`%`, `_`, virgules) doivent être échappés pour ne pas fausser le filtre ni provoquer d'erreur ; une saisie vide ou trop longue (limite raisonnable, ex. 100 caractères) affiche un message clair.
- Extrait du texte tronqué de façon sûre (rendu en texte, pas en HTML), avec accents corrects.
- Cette story dépend de 2.6 pour son critère 4 : tester après la suppression d'une ressource.
- Règle de fin de story (rétro sprint 2) : accents vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Rechercher un mot du titre d'une ressource : elle apparaît.
- [ ] Rechercher un mot du texte : elle apparaît, avec titre, extrait et lien d'ouverture.
- [ ] Rechercher un mot inexistant : message « aucun résultat » et champ de recherche modifiable.
- [ ] Supprimer une ressource, puis rechercher un de ses mots : elle n'apparaît plus.
- [ ] Saisir `%` ou une recherche vide : pas d'erreur, message clair.
- [ ] Les accents s'affichent correctement.
