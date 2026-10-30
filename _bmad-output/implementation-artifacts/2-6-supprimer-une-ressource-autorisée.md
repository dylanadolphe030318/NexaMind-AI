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

Suppression définitive d'une seule ressource à la fois ; pas de corbeille ni de restauration. Pas de suppression de catégorie ni de compte.

## Notes pour le développement

- Architecture : AD-3. Suppression par Server Action avec la session de la personne ; nouvelle migration (suite de `20261030191000`) ajoutant une politique RLS `delete` limitée au propriétaire ou au responsable (via `private.is_workspace_responsable`). Aucune clé `service_role`.
- Dylan applique la migration dans le SQL Editor de Supabase : fournir les étapes précises et mettre à jour l'ordre des migrations dans le README.
- Confirmation sur un écran ou un dialogue accessible qui nomme la ressource, avec deux actions distinctes « Supprimer » et « Annuler » (l'action destructive n'est pas signalée par la couleur seule). L'adresse directe de confirmation refuse côté serveur si la personne n'a pas le droit.
- Après suppression : retour à la liste avec un message de réussite ; l'adresse de détail renvoie « introuvable ».
- Tests : étendre `tests/supabase-rls.test.mjs` (propriétaire autorisé, autre membre refusé et ressource intacte, responsable autorisé). Action du sprint 2 : faire nettoyer au test les ressources et données qu'il crée (préfixes `RLS-TEST-`), y compris à la fin de la story.
- Prévoir la recréation des 3 comptes de test (membre A, membre B, responsable) avant les tests : les anciens ont été supprimés ; étapes dans le README.
- Dépend des stories 2.2 à 2.4.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Sur une de ses ressources, « Supprimer » ouvre une confirmation qui cite le titre.
- [ ] « Annuler » : la ressource reste en place.
- [ ] « Confirmer » : elle disparaît de la liste, et son adresse de détail affiche « introuvable ».
- [ ] Avec le compte responsable : supprimer la ressource d'un autre membre fonctionne.
- [ ] Avec un compte membre : la ressource d'un autre n'offre pas de suppression, et l'adresse directe est refusée.
- [ ] Refus RLS : vérifié par `npm run test:integration`.
