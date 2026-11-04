---
story: 4-1-découper-une-ressource-en-passages
title: Découper une ressource en passages
epic: 4
sprint: 5
status: done
---

# Story 4.1 : Découper une ressource en passages

## Récit utilisateur

En tant que membre, je veux que le texte de ma ressource soit découpé en passages enregistrés, afin que ses informations puissent être préparées pour la recherche sémantique.

## Critères d'acceptation

1. Étant donné que j'enregistre ou modifie une ressource, quand sa préparation commence, alors son texte est découpé en passages liés à cette ressource.
2. Étant donné que la préparation des passages est terminée, quand le traitement est vérifié, alors les passages sont conservés durablement dans Supabase/PostgreSQL.

## Limites de la story

Découpage et enregistrement des passages seulement. Pas d'embeddings (story 4.2), pas d'affichage de l'état (story 4.3), pas de recherche sémantique (sprint 6). Texte seul, pas de fichiers.

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Déclencheur : à la création et à chaque modification du titre/texte d'une ressource ; le début d'une révision retire les anciens passages.
- [ ] Taille d'un passage : environ 800 caractères, avec un chevauchement d'environ 100 caractères, coupé de préférence en fin de paragraphe ou de phrase (valeurs provisoires, réglables après essais).
- [ ] Texte court (moins d'un passage) : un seul passage ; texte vide impossible (déjà refusé par la base).
- [ ] Les passages portent un numéro d'ordre ; le titre de la ressource n'est pas un passage.
- [ ] Ressource modifiée sans changement du texte : aucun nouveau découpage.
- [ ] Suppression d'une ressource : ses passages disparaissent avec elle.
- [ ] Si le découpage échoue, la ressource reste enregistrée mais non interrogeable (état « failed », voir 4.3) ; aucun succès simulé.

## Notes pour le développement

- Architecture : AD-4 (numéro de révision, état `processing`/`ready`/`failed`, fonction PostgreSQL atomique de début de révision qui met à jour le texte et retire les anciens passages) ; AD-5 (découpage côté serveur) ; AD-3 (passages accessibles uniquement via leur ressource parente).
- Nouvelle migration (suite de `20261101200000`) : colonnes `resources.revision` (int, défaut 1) et `resources.indexing_status` (`processing`/`ready`/`failed`) ; table `resource_chunks` (`id`, `resource_id` → `resources` `on delete cascade`, `revision`, `position`, `content`, `created_at`) ; RLS : lecture via la ressource parente, aucune écriture directe ; fonctions SQL atomiques appelées sous la session de la personne (propriétaire ou responsable), sans `service_role`.
- Les ressources existantes doivent rester lisibles : valeur initiale de l'état à définir dans la migration (ex. `processing` pour relancer la préparation).
- Découpage dans `src/features/resources` (fonction pure, testable) ; appelé depuis `createResource` / `updateResource` (`resource-actions.ts`).
- Dylan applique la migration dans le SQL Editor de Supabase : fournir les étapes et mettre à jour l'ordre des migrations dans le README.
- Tests : unitaires du découpage (texte court, long, paragraphes) ; d'intégration RLS étendus (`tests/supabase-rls.test.mjs`) : passages visibles par un membre du workspace, aucune écriture directe, suppression en cascade ; nettoyage des données de test.
- Règle de fin de story : limites imposées en base ; textes d'écran éventuels vérifiés (accents).

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Créer une ressource : sa préparation démarre sans erreur visible.
- [ ] Dans Supabase (Table Editor), `resource_chunks` contient des passages liés à cette ressource, dans l'ordre.
- [ ] Modifier le texte : les anciens passages sont remplacés par les nouveaux.
- [ ] Supprimer la ressource : ses passages disparaissent.
- [ ] `npm run test:integration` passe.
