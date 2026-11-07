---
story: s8-1
title: Fiabiliser le classement de la recherche
epic: 4
sprint: 8
type: bugfix
status: done
baseline_commit: d9ed4c71e325f7fa80c860497638089a1d628dcf
context:
  - ../SPEC.md
---

# Complément S8-1 — fiabiliser la recherche

## Ce que cela permet

Retrouver le passage correspondant à un numéro de story recherché, sans que le code de la page annule le classement SQL.

## Critères d'acceptation

1. Étant donné un passage avec l'identifiant exact dans la fenêtre vectorielle de 0,10, quand le RPC le priorise et que l'application affiche ses résultats, alors cette priorité reste conservée même si son `ranking_score` est inférieur.
2. Étant donné une question sans numéro, quand un passage textuellement pertinent est légèrement moins proche que le distracteur, alors un test SQL contrôlé prouve que le signal lexical le départage.
3. Étant donné un numéro exact hors de la fenêtre de 0,10 ou un passage sous le seuil 0,4, quand la recherche s'exécute, alors il n'est pas promu ; cinq passages maximum et RLS restent imposés.
4. Étant donné une question et ses passages, quand l'assistant prépare le contexte, alors un test vérifie le texte réel du passage et la question, pas seulement leur marqueur.
5. Étant donné les dix questions de référence, quand Dylan les rejoue sur les deux écrans, alors l'assistant reste satisfaisant ; la recherche montre les ressources attendues pour les questions documentées et ne révèle aucune source interdite.

## Décisions de comportement

- Validé : correction limitée à la recherche de ressources et ses tests, pas de changement du classement de l'assistant ni de la recherche par mots-clés.
- Conserver l'ordre retourné en mode hybride après le filtrage du seuil ; continuer de trier par similarité en mode vectoriel.
- Aucun changement de prompt, modèle, seuil, quota ou nombre de résultats.

## Carte du code et tâches

- `src/features/resources/semantic-search-core.ts` : différencier le tri vectoriel et la conservation de l'ordre hybride.
- `tests/semantic-search.test.mjs` : reproduire un ordre SQL où le numéro exact a un score inférieur ; prouver qu'il reste premier.
- `tests/semantic-search-rls.test.mjs` : isoler le classement lexical sans numéro sous RLS et conserver les contrôles de seuil/plafond/visiteur.
- `tests/assistant.test.mjs` : vérifier le contenu exact des messages envoyés.
- `supabase/migrations/20261105140000_search_resource_chunks_hybrid.sql` : référence à préserver, aucune réécriture de migration déjà appliquée.

## Vérification

Tests ciblés de recherche, accès et assistant, puis intégration sémantique sous session, TypeScript et lint des fichiers touchés. Test manuel : questions 1 à 10 et scénario S8-A de [tests-ia.md](../../../../tests-ia.md).

## Hors périmètre

Autres constats de rétrospective, historique et changements visuels. Aucun développement pendant la préparation.

## Autorisation de développement

Dylan a validé la fiche S8-1 et autorisé son développement le 2026-11-06. La restriction de préparation est levée pour cette story uniquement. Ne pas marquer la story `done`, ne pas commiter depuis l'agent d'implémentation : la revue et le commit sont réalisés après vérification. Ne pas développer les stories suivantes.

## Résultat du développement — 2026-11-06

- [x] Conserver l'ordre SQL en mode hybride et le tri par similarité en mode vectoriel.
- [x] Tester la conservation de priorité après filtrage avec un score de classement inférieur.
- [x] Tester le signal lexical sans numéro sous RLS et l'exclusion sous le seuil.
- [x] Vérifier le texte exact des passages et de la question envoyés à l'assistant.
- [x] Évaluation par Dylan : dix questions sur les deux écrans et scénario S8-A.

Vérifications : 54/54 tests unitaires, 11/11 tests d'intégration sémantique, TypeScript et ESLint réussis. Aucun changement de migration ou appel au LLM pour ces vérifications.

## Review Triage Log

| Revue | Verdict | Preuve et décision |
|---|---|---|
| Blind hunter : évaluation manuelle non consignée | medium | Critère 5 toujours en attente : les tests automatisés ne remplacent pas les dix questions rejouées par Dylan. Point de validation utilisateur conservé, aucune prétention de résultat manuel. |
| Edge case hunter | Aucun problème | Aucun défaut remonté sur le diff. |
| Verification gap | Aucun problème | Aucun manque de couverture automatisée remonté. |

Évaluation finale de Dylan le 2026-11-07 : les scénarios dédiés de S8-1 sont validés. Sur l'évaluation IA globale, 7/10 réponses sont correctes, les deux abstentions attendues sont respectées et aucune fuite n'est constatée. La cible globale de qualité de l'epic reste à améliorer ; elle ne bloque pas la validation de cette story.
