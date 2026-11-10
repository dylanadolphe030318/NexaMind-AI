---
title: Rétablir les références des passages de recherche hybride
type: bugfix
created: 2026-11-10
status: in-review
route: oneshot
---

<frozen-after-approval>

## Intent

Corriger le retour de `search_resource_chunks_hybrid` : rétablir `chunk_id` et `revision` attendus par les consommateurs et le test d'intégration, sans modifier le classement, les seuils, la limite de cinq résultats, les permissions ou la RLS. Préparer une nouvelle migration SQL transactionnelle que Dylan appliquera lui-même, sans toucher aux migrations déjà appliquées ni aux autres modifications locales. Ajouter une vérification de non-régression et des instructions d'application.

</frozen-after-approval>

## Implementation Notes

- Cause reproduite : test `tests/semantic-search-rls.test.mjs`, assertion du champ `hybridHit.chunk_id`, résultat `undefined`. La migration du 7 novembre remplace la fonction et omet identifiant et révision.
- Reprendre exactement son calcul, sa fenêtre 0,20, ses paramètres et permissions ; ajouter les colonnes depuis `resource_chunks` au CTE puis à la projection finale.
- Changement de type de retour : `DROP FUNCTION` sans `CASCADE`, puis recréation dans la même transaction ; en cas de dépendance bloquante, ne pas forcer.
- Aucun effet distant pendant la préparation ; application et validation réelle en attente de Dylan. Ne pas clôturer une story standard ou IA par ce correctif.
- Livré : migration `20261110143000_restore_hybrid_chunk_references.sql`, instructions dans `README.md`, test de contrat dans `tests/semantic-search.test.mjs`.
- Vérification locale : 23 tests réussis avec `node --test --test-reporter=dot tests/semantic-search.test.mjs tests/semantic-access.test.mjs` ; `git diff --check` sans erreur. Le test compare la nouvelle définition à la précédente après retrait des seules colonnes ajoutées et de la transaction.
- Relecture directe du petit correctif : type de retour conforme à la définition du 6 novembre ; classement du 7 novembre et permissions conservés ; aucune dépendance supprimée par cascade. Aucun problème additionnel constaté. Pas de délégation nécessaire.
- Le contrôle SQL textuel ne prouve pas l'exécution PostgreSQL. L'intégration Supabase reste à relancer après application manuelle ; ce correctif reste en évaluation et aucune story n'est marquée terminée.
