---
title: 'Améliorer le classement des passages dans la recherche sémantique'
type: 'bugfix'
created: '2026-11-05'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 45c0fe85bff4c1ae3827f53ca5e6bbf00eca6a41
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dans `/resources/search`, des passages qui citent seulement le sujet peuvent précéder le passage qui répond réellement à la question. Les questions du jeu de test sur le MVP, le RAG et les anciennes stories montrent ce défaut de classement.

**Approach:** Améliorer le classement de la recherche sémantique affichée dans `/resources/search` en combinant la proximité vectorielle et un signal de recherche textuelle PostgreSQL borné. Les correspondances textuelles exactes (notamment noms et identifiants) départagent seulement les passages dont le score vectoriel est à moins de 0,10 du meilleur score. Ne pas modifier le comportement de la recherche utilisée par `/assistant`.

**Décision de Dylan :** privilégier les noms et numéros de story explicitement présents dans le texte, sans laisser de simples mots en commun faire remonter un passage éloigné sémantiquement. Le seuil de proximité vectorielle reste obligatoire.

## Boundaries & Constraints

**Always:** Conserver la recherche pgvector, le seuil minimal de proximité, le maximum de cinq passages, la session du membre et la RLS. Le score sémantique brut reste le critère du seuil. Le signal textuel sert au classement; il ne doit ni donner accès à une ressource interdite ni exposer de clé.

**Never:** Ne pas modifier la recherche par mots-clés existante, les textes de la page, le prompt ou la logique de réponse de l'assistant. Ne pas élargir le nombre de résultats ni supprimer le seuil. Ne pas appliquer de migration à la base Supabase sans l'action de Dylan.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Gestion d'erreur |
|----------|---------------|------------------|------------------|
| Classement hybride | Question avec des termes présents dans le passage qui répond et dans un passage seulement proche par le sens | Le passage qui correspond textuellement et sémantiquement est mieux classé; au plus cinq résultats | Le seuil de proximité brut continue d'écarter les passages hors sujet |
| Pas de correspondance textuelle | Question exprimée autrement que le document | La proximité vectorielle conserve son rôle et les meilleurs passages sémantiques restent classés | Aucun échec si le score lexical est nul |
| Recherche de l'assistant | Même question via `/assistant` | Le classement existant de l'assistant reste inchangé | Même contrôle de session, quota et RLS |

</frozen-after-approval>

## Code Map

- `src/features/resources/semantic-search.ts` appelle l'RPC avec la session Supabase du membre. Ajouter le signal textuel uniquement pour l'appel de `/resources/search`; l'appel de l'assistant doit garder le comportement vectoriel actuel.
- `src/features/resources/semantic-search-core.ts` valide la question, transmet les paramètres, filtre au seuil brut et limite à cinq. Il retrie aujourd'hui par similarité brute, ce qui doit respecter le score de classement choisi sans changer le seuil.
- `supabase/migrations/20261105130000_search_all_matching_chunks.sql` renvoie les cinq passages vectoriels les plus proches avec `SECURITY INVOKER`. La nouvelle migration doit préserver cette sécurité et le plafond, tout en calculant un classement textuel pour les seules recherches de ressources.
- `src/app/resources/search/page.tsx` affiche le résultat `searchPassages` dans son ordre. Ne pas changer le bloc de recherche par mots-clés ni le rendu de `/assistant`.
- `tests/semantic-search.test.mjs` couvre seuil, limite et tri; ajouter un cas de classement. `tests/semantic-search-rls.test.mjs` utilise des vecteurs contrôlés, des comptes de test et un nettoyage `finally`; l'étendre pour vérifier le classement hybride et la RLS.
- `README.md` énumère les migrations à appliquer dans l'ordre. Indiquer la nouvelle migration sans l'appliquer à Supabase.

## Tasks & Acceptance

**Execution:**
- [x] Ajouter une migration PostgreSQL qui combine le score vectoriel et la pertinence textuelle, garde le seuil basé sur la similarité brute et applique toujours les droits RLS.
- [x] Transmettre le texte de la requête uniquement depuis `/resources/search`; préserver la recherche actuelle de l'assistant et l'ordre du classement retourné.
- [x] Ajouter un test contrôlé où un passage textuellement pertinent dépasse un distracteur seulement plus proche par vecteur, plus des vérifications de limite et d'accès.
- [x] Ajouter la migration dans l'ordre du README et fournir à Dylan les étapes d'application manuelle.

**Acceptance Criteria:**
- Étant donné deux passages accessibles, dont un répond textuellement à la question et l'autre est seulement plus proche par vecteur, quand un membre recherche dans `/resources/search`, alors le passage pertinent est classé avant le distracteur.
- Étant donné une question sans termes communs utiles, quand la recherche s'exécute, alors le classement vectoriel continue de fournir les passages qui dépassent le seuil.
- Étant donné un membre qui n'a pas accès à une ressource, quand le classement hybride s'exécute, alors aucun passage de cette ressource n'est retourné.
- Étant donné l'assistant qui appelle la recherche avec la même question, quand il récupère ses passages, alors son mode de classement actuel reste inchangé.
- Étant donné n'importe quelle requête, quand elle est recherchée, alors au plus cinq passages sont renvoyés.

## Implementation Notes

- Correction de l'erreur SQL `42883` signalée lors de l'application : les deux expressions `pg_catalog.coalesce` sont remplacées par `coalesce`, qui ne se qualifie pas par un schéma. Un test de non-régression vérifie cette règle dans la migration hybride. L'intégration Supabase passe après application.
- L’implémentation réserve le signal textuel à `/resources/search`; la RPC et le classement vectoriels existants restent utilisés par l’assistant.
- Les identifiants de story sont détectés comme nombres exacts avant le signal textuel général; ils ne peuvent remonter que dans la fenêtre vectorielle de 0,10.
- `npm run test:unit` (51 tests), `npx tsc --noEmit` et `npx eslint src tests` passent.
- La nouvelle RPC est désormais disponible dans Supabase : les tests d'intégration réussissent. L'assistant n'a pas appliqué la migration.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run test:unit` -- tous les tests unitaires passent.
- `npm run test:integration` -- le test RLS de classement passe si les migrations sont appliquées dans la base de test.
- `npx tsc --noEmit` -- aucune erreur TypeScript.
- `npx eslint src tests` -- aucune erreur ESLint.

**Vérification manuelle :**
- Après application de la migration, relancer les questions du rapport sur `/resources/search`; vérifier le passage attendu avant le passage seulement associé au thème.
- Vérifier que les résultats de `/assistant` n'ont pas changé.

**Résultats du 2026-11-05 :**
- `npm run test:unit` : réussi, 52 tests.
- `npx tsc --noEmit` : réussi.
- `npx eslint src tests` : réussi.
- `npm run test:integration` : réussi, 33 tests, y compris le classement hybride, la limite de cinq passages et les droits d'accès.
- Évaluation de Dylan : sprint IA satisfaisant, 10/10 réponses aux questions correctes ; correctif accepté le 2026-11-05.
