---
story: 2-1-gérer-les-catégories
title: Gérer les catégories
epic: 2
sprint: 2
status: ready-for-dev
---

# Story 2.1 : Gérer les catégories

## Récit utilisateur

En tant que responsable, je veux créer et renommer les catégories, afin que les ressources de l'équipe soient classées de manière cohérente.

## Critères d'acceptation

1. Étant donné que je suis responsable, quand je crée une catégorie, alors elle apparaît dans la liste des catégories disponibles.
2. Étant donné que je suis responsable, quand je renomme une catégorie, alors son nouveau nom est affiché partout où cette catégorie est proposée.
3. Étant donné que je suis membre, quand je consulte les catégories disponibles, alors je peux les voir et les choisir, mais pas les créer ni les renommer.
4. Étant donné qu'un membre tente directement dans Supabase de créer ou renommer une catégorie, quand l'opération est exécutée avec sa session membre, alors la politique RLS la refuse ; la même opération réussit avec la session du responsable.

## Limites de la story

Création et renommage uniquement : pas de suppression de catégorie, pas de ressources (stories 2.2 à 2.4). Aucune clé Supabase privilégiée : tout passe par la session de la personne et RLS.

## Notes pour le développement

- Architecture : AD-2 et AD-3. Migration SQL versionnée dans `supabase/migrations/`, table `categories` rattachée au workspace unique, RLS activée, privilèges `anon` révoqués. Lecture pour tout membre du workspace ; écriture réservée au responsable, via une fonction SQL privée oui/non au chemin de recherche fixé (évite la récursion sur `profiles`).
- Mutations par Server Actions ; lecture par Server Components. Code métier dans `src/features/resources`.
- Dépendance : un compte responsable doit exister pour tester (action ouverte « Créer le responsable initial » du sprint-status). Le test d'intégration RLS étend `tests/supabase-rls.test.mjs` avec les comptes de test membre et responsable (sans clé de service).
- Ne pas modifier le rôle d'un profil depuis l'application.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Avec le compte responsable : créer une catégorie, elle apparaît dans la liste.
- [ ] Renommer cette catégorie : le nouveau nom s'affiche partout où elle est proposée.
- [ ] Avec un compte membre : les catégories sont visibles, sans bouton pour en créer ou en renommer.
- [ ] Déconnecté : la page de gestion renvoie vers `/login`.
- [ ] Refus RLS (création et renommage par un membre) : vérifié par `npm run test:integration`.
