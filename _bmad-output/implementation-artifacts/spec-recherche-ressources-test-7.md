---
title: 'Corriger les références de la recherche de ressources après le test 7'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: f32f1fc8e8d6328406884c5884658dc8a2e6cf9d
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-4-4-corriger-classement-recherche-semantique.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-recherche-phrase-pertinente-llm.md'
  - '{project-root}/tests-ia.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Au test 7, les passages attendus pour Q1 et Q3 sont écartés par le seuil et la fenêtre de similarité actuels. Pour Q6, le bon passage est retrouvé, mais le LLM choisit la phrase décrivant l'action plutôt que celle décrivant le résultat observé.

**Approach:** Pour `/resources/search` seulement, utiliser un seuil de 0,20 et une fenêtre hybride de 0,20, puis préciser que les questions sur un résultat observé doivent sélectionner le résultat et non l'action ou l'attente. Ne pas modifier le découpage ni le parcours de l'assistant. Conserver les droits RLS, cinq passages au maximum et le résultat exact issu d'une seule ressource.

**Décisions confirmées par Dylan :** accepter les résultats secondaires potentiellement moins pertinents pour réparer Q1/Q3 ; ne pas appliquer la migration Supabase sans action manuelle. Pour Q6, privilégier la phrase qui décrit le résultat observé plutôt que l'action ou l'attente.

## Boundaries & Constraints

**Always:** Seuil de 0,20 et fenêtre de 0,20 réservés à la recherche de ressources ; l'assistant garde son seuil de 0,4 et son classement actuels. Les appels IA restent côté serveur, sous le quota actuel, avec la session Supabase et la RLS. Les cinq résultats restent visibles.

**Never:** Ne pas modifier les documents importés, les droits d'accès, le nombre maximal de résultats ou le comportement de l'assistant. Ne pas appliquer une migration Supabase sans l'action de Dylan. Ne pas marquer une story terminée.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Gestion d'erreur |
|----------|---------------|------------------|------------------|
| Passage Q1 ou Q3 faible | Question de test et passage accessible sous le seuil actuel | Le passage attendu peut entrer dans les cinq candidats et sa phrase exacte peut être sélectionnée | Aucun passage interdit ni phrase inventée |
| Compte rendu Q6 | « mots similaires dans la recherche pour le sprint 4 » | Sélectionner la phrase « les deux recherches ont été regroupées en une seule avec la même date », pas l'action effectuée | Si aucune phrase exacte ne répond, signaler qu'aucune phrase n'a été sélectionnée |
| Question Q5 | « recherche vide à la story 3.1 » | Garder la phrase exacte déjà sélectionnée et le classement actuel des résultats | Ne pas traiter les résultats visibles supplémentaires comme une nouvelle citation |

</frozen-after-approval>

## Code Map

- `src/features/resources/semantic-search-core.ts` — seuil global `0.4` et filtre après RPC ; il s'applique aussi à l'assistant.
- `supabase/migrations/20261105140000_search_resource_chunks_hybrid.sql` — fenêtre hybride `0.10`, RLS par `SECURITY INVOKER`, limite à cinq.
- `src/features/resources/relevant-search-phrase-core.ts` — consigne de sélection et validation stricte de la phrase exacte.
- `src/app/resources/search/page.tsx` — affiche la phrase sélectionnée et conserve les passages classés visibles.
- `tests/semantic-search-rls.test.mjs` et `tests/relevant-search-phrase.test.mjs` — tests contrôlés du classement, des droits et de la sélection.
- `tests-ia.md` — résultats attendus des Q1, Q3, Q5 et Q6.

## Tasks & Acceptance

**Execution:**
- [x] Isoler le seuil de 0,20 à la recherche de ressources et porter sa fenêtre SQL à 0,20 dans une nouvelle migration.
- [x] Clarifier la sélection des résultats de compte rendu ; tester la consigne et le choix de la phrase observée.
- [x] Préserver l'ordre des résultats, la limite de cinq, la session et la RLS ; ne pas modifier la recherche de l'assistant.
- [x] Documenter les tests ciblés et les étapes manuelles pour appliquer la nouvelle migration Supabase.

**Acceptance Criteria:**
- Étant donné les questions Q1 et Q3, quand la recherche de ressources s'exécute, alors le passage accessible qui contient la réponse peut être sélectionné selon le seuil choisi.
- Étant donné Q6 et son passage, quand le LLM sélectionne une phrase, alors il cite le résultat observé plutôt que l'action effectuée.
- Étant donné Q5, quand la sélection s'exécute, alors sa phrase exacte actuelle reste correcte.
- Étant donné une recherche par l'assistant, quand elle s'exécute, alors son seuil et son classement restent inchangés.
- Étant donné une recherche de ressources, quand les résultats sont retournés, alors la RLS et le maximum de cinq passages sont toujours respectés.

## Implementation Notes

- Le seuil de 0,20 est passé uniquement pour la recherche de ressources ; l'assistant conserve le seuil par défaut de 0,40 et le classement vectoriel.
- La migration `20261107100000_search_resource_chunks_hybrid_window.sql` porte à 0,20 la fenêtre SQL et conserve `SECURITY INVOKER`, le seuil brut et la limite de cinq. Elle n'a pas été appliquée.
- La consigne demande de choisir le résultat observé pour Q6 ; les tests vérifient la phrase attendue de Q6 et la citation exacte de Q5.
## Spec Change Log

## Review Triage Log

- **low — patch** — `src/features/resources/relevant-search-phrase-core.ts` pouvait inclure une citation droite ouvrante après une phrase dans la phrase précédente, et rendre la suivante non validable. Le test de régression a échoué avant la correction puis réussit avec la frontière préservée.
- **medium — patch** — aucun test ne vérifiait que le wrapper de production transmet le seuil dédié uniquement à `/resources/search`; le test du cœur fournissait déjà ce paramètre. `tests/semantic-access.test.mjs` vérifie maintenant le routage des deux wrappers.

## Verification

**Commands:**
- `npm run test:unit` — tests unitaires ciblés et existants réussis.
- `npm run test:integration` — RLS, classement et limites réussis après application manuelle de la migration, si elle est retenue.
- `npx tsc --noEmit` — aucune erreur TypeScript.
- `npx eslint src tests` — aucune erreur ESLint.

**Vérification manuelle :**
- Rejouer Q1, Q3, Q5 et Q6 sur `/resources/search`; confirmer les sources et phrases attendues.
- Confirmer que `/assistant` conserve son comportement.

**Résultats de l'implémentation :**
- `npm run test:unit` : réussi, 85 tests.
- `npx tsc --noEmit` : réussi.
- `npx eslint src tests` : réussi.
- `git diff --check` : réussi.
- `npm run test:integration` : 38 tests réussissent sur 40 ; un contrôle de recherche vectorielle échoue car la réponse RPC ne contient pas `chunk_id`/révision. Le test ajouté pour le seuil et la fenêtre 0,20 réussit.
- Évaluation Dylan du 2026-11-07 : scénarios dédiés de S8-1 validés ; résultat global IA 7/10, deux abstentions respectées et aucune fuite.
- La migration SQL n'est pas appliquée par le dépôt ; Dylan l'a exécutée manuellement avant son évaluation. L'échec d'intégration de la recherche vectorielle reste à diagnostiquer.
- Les contrôles manuels de recherche demandés ont été évalués par Dylan ; l'objectif global de qualité de l'epic reste à améliorer.
