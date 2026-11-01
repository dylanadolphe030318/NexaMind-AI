---
story: 3-4-supprimer-une-recherche-de-son-historique
title: Supprimer une recherche de son historique
epic: 3
sprint: 4
status: ready-for-dev
---

# Story 3.4 : Supprimer une recherche de son historique

## Récit utilisateur

En tant que membre, je veux supprimer une recherche de mon historique, afin de ne conserver que les recherches qui me sont utiles.

## Critères d'acceptation

1. Étant donné que je demande la suppression d'une recherche, quand la confirmation s'affiche, alors elle identifie la recherche et propose de confirmer ou d'annuler.
2. Étant donné que je confirme la suppression, quand l'action est terminée, alors la recherche disparaît de mon historique et ne peut plus être rouverte ; si j'annule, elle reste présente.
3. Étant donné qu'une recherche appartient à un autre membre, quand je tente de la supprimer, alors l'action est refusée.
4. Étant donné qu'un membre tente directement dans Supabase de supprimer la recherche d'un autre membre, quand l'opération est exécutée avec sa session, alors RLS la refuse et la recherche reste disponible pour son propriétaire.

## Limites de la story

Suppression d'une recherche à la fois, avec confirmation sur une page dédiée (même principe que la story 2.6). Pas de « tout effacer ».

## Textes d'écran

- Bouton sur chaque ligne de l'historique : « Supprimer ».
- Page de confirmation : « Supprimer cette recherche ? », la requête affichée entre guillemets, boutons « Confirmer la suppression » et « Annuler ».
- Après suppression, retour à l'historique avec le message de succès neutre : « La recherche a été supprimée. »
- Recherche introuvable ou appartenant à un autre membre : page « introuvable » (sans révéler qu'elle existe).

## Notes pour le développement

- Politique RLS `delete` sur `searches` déjà prévue en story 3.2 (propriétaire uniquement) : vérifier, ne pas dupliquer.
- Action serveur : supprimer avec `.select("id")` pour détecter 0 ligne supprimée (refus RLS), comme `deleteResource`.
- Tests d'intégration : un membre ne peut pas supprimer la recherche d'un autre (critère 4) ; nettoyage dans le `finally`.
- Règle de fin de story : accents et ton des messages vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Cliquer sur « Supprimer » : la confirmation montre la requête.
- [ ] « Annuler » : la recherche reste dans l'historique.
- [ ] « Confirmer la suppression » : elle disparaît et le message de succès s'affiche.
- [ ] Ouvrir l'adresse de confirmation d'une recherche d'un autre membre : page « introuvable ».
- [ ] Les accents s'affichent correctement.
