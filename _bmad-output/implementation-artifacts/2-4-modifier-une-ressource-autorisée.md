---
story: 2-4-modifier-une-ressource-autorisée
title: Modifier une ressource autorisée
epic: 2
sprint: 2
status: ready-for-dev
---

# Story 2.4 : Modifier une ressource autorisée

## Récit utilisateur

En tant que membre, je veux modifier mes propres ressources, afin de garder les informations de l'équipe à jour.

## Critères d'acceptation

1. Étant donné qu'une ressource m'appartient, quand je modifie son titre, son texte ou sa catégorie et enregistre, alors les changements sont visibles et sa date de mise à jour est actualisée.
2. Étant donné que je suis responsable, quand je modifie une ressource partagée, alors les changements sont enregistrés même si la ressource appartient à un autre membre.
3. Étant donné que je suis membre et qu'une ressource appartient à quelqu'un d'autre, quand je tente de la modifier, y compris par son adresse directe, alors aucun changement n'est enregistré.
4. Étant donné qu'un membre tente directement dans Supabase de modifier la ressource d'un autre membre, quand l'opération est exécutée avec sa session, alors RLS refuse la modification et les données restent inchangées ; le propriétaire et le responsable peuvent modifier les ressources qui leur sont permises.

## Limites de la story

Modification uniquement : pas de suppression (story 2.6), pas de réindexation (Epic 4). Le propriétaire d'une ressource ne change pas.

## Notes pour le développement

- Architecture : AD-3. Mise à jour par Server Action avec la session de la personne ; politique RLS `update` limitée au propriétaire ou au responsable, qui ne peuvent pas modifier `owner_id` ni le workspace. Date de mise à jour actualisée en base.
- L'accès par adresse directe d'une ressource d'autrui doit refuser l'édition côté serveur, sans s'appuyer uniquement sur le masquage du bouton.
- Étendre `tests/supabase-rls.test.mjs` avec trois cas : propriétaire autorisé, autre membre refusé (données inchangées), responsable autorisé. Dépend d'un compte responsable de test.
- Dépend des stories 2.1 à 2.3.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Modifier le titre d'une de ses ressources : le changement est visible et la date de mise à jour change.
- [ ] Avec le compte responsable : modifier la ressource d'un autre membre, cela fonctionne.
- [ ] Avec un compte membre : ouvrir l'adresse de modification de la ressource d'un autre, aucun changement n'est enregistré.
- [ ] Refus RLS pour un autre membre, accès propriétaire et responsable : vérifiés par `npm run test:integration`.
