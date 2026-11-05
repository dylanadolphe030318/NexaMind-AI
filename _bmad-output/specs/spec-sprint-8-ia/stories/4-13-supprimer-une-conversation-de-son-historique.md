---
story: 4-13-supprimer-une-conversation-de-son-historique
title: Supprimer une conversation de son historique
epic: 4
sprint: 8
status: ready-for-dev
context:
  - ../SPEC.md
---

# Story 4.13 — supprimer une conversation

## Ce que cela permet

Retirer un échange de son historique, après avoir confirmé son choix.

## Critères d'acceptation

1. Étant donné une conversation du membre, quand il demande sa suppression, alors la confirmation nomme l'échange et propose « Supprimer » ou « Annuler ».
2. Étant donné une annulation, quand elle est choisie, alors la conversation, les messages et les sources restent inchangés.
3. Étant donné une confirmation autorisée, quand la transaction termine, alors conversation/messages/sources disparaissent ensemble et l'ancienne URL n'est plus ouvrable.
4. Étant donné une tentative sur la conversation d'autrui, quand elle passe par l'interface ou Supabase avec une session membre/responsable, alors elle est refusée et l'échange reste intact.
5. Étant donné une erreur ou une génération encore en cours, quand la suppression est tentée, alors aucun faux succès n'est affiché ; une finalisation tardive ne recrée ni conversation ni message.
6. Étant donné une ressource citée, quand une conversation est supprimée, alors la ressource, ses passages et les échanges d'autres personnes ne sont pas supprimés.

## Décisions de comportement

- Suppression définitive, sans corbeille ni suppression collective ; mutation par action serveur, jamais par lien GET.
- Réutiliser les relations en cascade et les protections de 4.10 ; propriétaire seulement, sans privilège supplémentaire pour responsable.
- Après succès : retour à « Mes conversations » et message explicite ; après échec : conserver l'écran et proposer de réessayer.

## Carte du code et tâches

- Service serveur de conversations : suppression autorisée et transactionnelle.
- Action serveur et confirmation dans la liste/détail ; clavier, focus et annulation accessibles.
- Tests unitaires : confirmer/annuler, échec explicite, aucune suppression des ressources.
- `tests/conversations-rls.test.mjs` : suppression tiers refusée, cascade vérifiée, finalisation après suppression refusée.

## Textes d'écran

« Supprimer la conversation « {titre} » ? », « Supprimer », « Annuler », « La conversation a été supprimée. », « La conversation n'a pas pu être supprimée. Réessayez. »

## Vérification

Scénarios S8-H et S8-F de [tests-ia.md](../../../../tests-ia.md). Dépend de 4.12 pour vérifier l'interaction avec une génération en cours.
