---
story: 2-6-supprimer-une-ressource-autorisée
title: Supprimer une ressource autorisée
epic: 2
sprint: 3
status: ready-for-dev
---

# Story 2.6 : Supprimer une ressource autorisée

## Récit utilisateur

En tant que membre, je veux supprimer mes propres ressources après confirmation, afin de retirer les informations qui ne sont plus utiles.

## Critères d'acceptation

1. Étant donné que je demande la suppression d'une ressource, quand la confirmation s'affiche, alors elle nomme la ressource et propose clairement de confirmer ou d'annuler.
2. Étant donné que je suis membre propriétaire ou responsable, quand je confirme la suppression, alors la ressource n'apparaît plus dans les écrans de liste ou de détail déjà disponibles ; si j'annule, elle reste disponible.
3. Étant donné que je suis membre et qu'une ressource appartient à quelqu'un d'autre, quand je tente de la supprimer, alors aucun changement n'est enregistré ; après suppression autorisée, la ressource n'apparaît plus dans la liste et son écran de détail n'est plus accessible.
4. Étant donné qu'un membre tente directement dans Supabase de supprimer une ressource d'un autre membre, quand l'opération est exécutée avec sa session, alors RLS la refuse et la ressource reste présente.

## Limites de la story

Suppression de ressources uniquement. Pas de suppression de catégorie. Les passages indexés de l'Epic 4 n'existent pas encore et ne sont pas traités ici.

## Notes pour le développement

- Architecture : AD-3 et AD-4. Suppression par Server Action avec la session de la personne ; politique RLS `delete` limitée au propriétaire ou au responsable. Pas de clé privilégiée.
- La confirmation nomme la ressource ; l'accès direct au détail d'une ressource supprimée renvoie une page « introuvable » claire.
- Étendre `tests/supabase-rls.test.mjs` : autre membre refusé (ressource toujours présente), propriétaire et responsable autorisés. Nécessite les comptes de test membre et responsable.
- Dépend des stories 2.2 à 2.4.
