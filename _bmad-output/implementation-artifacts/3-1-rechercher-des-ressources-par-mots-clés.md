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

Recherche classique par mots-clés uniquement : pas de recherche par le sens, pas d'embeddings, pas d'IA (Epic 4). L'enregistrement de l'historique des recherches relève des stories 3.2 à 3.4 et n'est pas fait ici.

## Notes pour le développement

- Architecture : AD-1, AD-2, AD-3. La recherche passe par le client Supabase de la session, donc RLS limite les résultats aux ressources accessibles. Aucune clé privilégiée.
- Requête de type recherche texte ou correspondance partielle sur titre et texte ; la saisie de la personne est paramétrée, jamais assemblée dans une requête SQL. Extrait du texte construit côté serveur.
- Requête vide ou très courte : message clair, sans erreur technique.
- Dépend des stories 2.2, 2.3 et 2.6 pour le critère de suppression.
