---
epic: 4
sprint: 8
scope: sprint-only
date: 2026-11-10
criteria: declared
headless: false
verdict: accepted-with-open-items
plan_changes_approved: true
---

# Rétrospective finale du sprint 8 — conversations IA

## Résumé et inventaire

Le sprint 8 comprend S8-1, 4.10, 4.11, 4.12 et 4.13. Les cinq stories sont terminées après l'évaluation de Dylan, enregistrée dans le commit `fa30814`. Cette rétrospective porte sur ce sprint seulement : l'epic IA reste en cours avec 4.14 à 4.16. Elle complète, sans effacer, la [rétrospective intermédiaire du 7 novembre](epic-4-retro-2026-11-07.md), écrite avant la livraison de 4.11 à 4.13.

Preuves disponibles :

- [Manifeste ordonné](../specs/spec-sprint-8-ia/stories.yaml), [spécification](../specs/spec-sprint-8-ia/SPEC.md) et [suivi](sprint-status.yaml).
- Fiches [4.11](../specs/spec-sprint-8-ia/stories/4-11-rouvrir-une-conversation.md), [4.12](../specs/spec-sprint-8-ia/stories/4-12-continuer-une-conversation-precedente.md) et [4.13](../specs/spec-sprint-8-ia/stories/4-13-supprimer-une-conversation-de-son-historique.md), avec acceptations et résultats de vérification.
- Plage de livraison : `36d8694559c65f4a48afaf177fa8ae0ccd590fb2^..fa30814cbc25abbd75f908cc3b99f2a18168a808`. Le script `git_evidence.py` recense 21 commits et aucun merge. Cette plage inclut aussi des documents de planification : elle n'est pas assimilée à du code exclusivement lié aux cinq stories. Les sujets sans numéro, notamment `a447487`, limitent l'attribution automatique par story.
- [Questions et manipulations de test](../../tests-ia.md), résultats des commandes dans la conversation et retours directs de Dylan. Les documents personnels non suivis ne sont ni publiés ni utilisés comme preuve inspectée.

## Retours de Dylan

- Ce qui a bien fonctionné : « tous les test ».
- Ce qui a été difficile : « le développement du sprint 4.12 ».
- Observation de démo : « la recherche pour S8-D, amène obligatoirement une incertitude, peut-être ajouter le lien pour afficher story 3.1 pour Quel était le numéro de la story concernée ? ».

Ce dernier point est une amélioration souhaitée de lisibilité et de vérifiabilité. Il ne prouve pas que toutes les questions de suivi échouent : Dylan a confirmé auparavant tous les contrôles proposés réussis.

## Constats sourcés

| Constat | Preuve | Traitement de cette occurrence / prévention |
|---|---|---|
| Le parcours complet des conversations a été accepté. | Commits `4fb21fa` (réouverture), `a447487` (continuation), `bc3f990` (suppression), puis `fa30814` ; confirmations manuelles de Dylan. | Accepter la livraison ; conserver les scénarios S8-C à S8-H comme non-régression. |
| Une migration installée avec succès n'était pas encore utilisable sur tous ses chemins. | La continuation a échoué avec `42702`, car les deux `RETURNING generation_token` étaient ambigus ; le correctif `e0a6a35` les qualifie par `target_message`. Après application, 6/6 tests de conversations passaient (`6274413`). | Instance corrigée ; proposer une vérification d'utilisation après installation, avant de demander l'évaluation manuelle. |
| Le suivi de question dépend de passages retrouvés à nouveau, et pas seulement de l'ancien échange. | `buildAssistantSearchQuery` dans [assistant-core.ts](../../src/features/assistant/assistant-core.ts) borne la recherche à 300 caractères, dont au plus 160 de contexte ; le prompt interdit d'utiliser l'historique comme preuve. S8-D demande une réponse « story 3.1 » avec source. | Préserver cette protection. Proposer une citation explicite et ouvrable lorsque le passage actuel confirme le numéro ; sinon conserver l'abstention. La démo n'a pas été reproduite pour déterminer pourquoi le lien paraissait insuffisant. |
| Les liens vers les ressources existent déjà, mais ils ne pointent pas vers une ancre de story. | [assistant-form.tsx](../../src/features/assistant/assistant-form.tsx) construit `/resources/{resourceId}` pour les sources ; les références enregistrées comprennent ressource, passage et révision, pas une route dédiée « story 3.1 ». | Ne pas inventer une URL de story. Proposer un libellé de preuve clair à partir du passage vérifié, avec le lien vers la ressource existante. |
| Le résultat positif du sprint ne constitue pas un nouveau score global de recherche. | Le [suivi](sprint-status.yaml) conserve l'échec antérieur de recherche hybride sur `chunk_id`/révision ; le dernier score chiffré était 7/10, sans nouvelle mesure chiffrée fournie ici. | Garder cette réserve distincte de l'acceptation utilisateur et du résultat des tests de conversations. |

### Lecture transversale et limites de revue

Lecture directe ciblée sur les frontières historique → nouvelle recherche → source affichée et migration → appel réel ; les revues détaillées de livraison restent consignées dans les fiches. Ce rapport n'affirme pas avoir refait un audit exhaustif de tous les diffs du sprint, des dépendances ou de la duplication.

L'architecture reste séparée entre traitement pur, service serveur et interface. Le prompt conserve l'historique comme contexte non fiable, jamais comme source. Le volume de changements dans les services et tests de conversations ne suffit pas à démontrer un problème de conception ; aucune refonte n'est proposée sur ce seul indicateur.

## Vérification du comportement

- Dylan confirme le 10 novembre tous les contrôles manuels proposés réussis pour 4.12, puis ceux de suppression pour 4.13, et accepte le sprint.
- Dernière livraison : 100/100 tests unitaires, TypeScript, ESLint et build réussis.
- Après application de la migration de suppression : 7/7 tests d'intégration de conversations réussis, aucun ignoré (`4aca033`), couvrant notamment les tiers, les cascades, la préservation des ressources et le refus d'une finalisation tardive.
- Ces résultats ont été observés pendant la livraison, pas relancés pendant cette rétrospective. Aucun parcours authentifié ni appel LLM supplémentaire n'a été exécuté ici. L'incertitude de S8-D est donc un retour de démo, pas une panne reproduite.
- Le résultat de la suite complète d'intégration n'est pas déclaré entièrement vert : le problème de recherche hybride reste distinct et ouvert.

## Suivi de la rétrospective précédente

- Accès plus visible à l'assistant : story 1.6 au backlog, pas développée ; pas de clôture proposée.
- Qualité de recherche de ressources : story 3.5 au backlog, pas de nouveau score mesuré ; pas de clôture proposée.
- Nettoyage RLS : consigne ajoutée dans [tests-ia.md](../../tests-ia.md) ; le nouveau scénario de suppression nettoie ses fixtures, mais cela ne démontre pas le nettoyage de tous les anciens scénarios. Ne pas considérer le problème global clos.
- Action encore ouverte de l'epic 3, « Rubrique “Décisions de comportement” dans chaque fiche, validée par Dylan avant le développement » : rubrique présente dans 4.11 à 4.13 ; aucune modification automatique de son statut.

## Trois améliorations validées le 2026-11-10

1. **Rendre la preuve de S8-D facile à ouvrir.** Responsable proposé : développeur, validation Dylan. Dans le travail de liaison aux sources de 4.14, proposer une réponse explicite « La story concernée est 3.1 » avec un lien vers la ressource qui le confirme. Réussite : la ressource accessible contient bien ce numéro et s'ouvre depuis la réponse ; si le nouveau passage ne le confirme pas, l'assistant ne le devine pas. Pas de lien inventé ni de contournement des droits.
2. **Tester les migrations sur leur usage, pas seulement leur installation.** Responsable proposé : développeur, application SQL par Dylan. Pour chaque future fonction modifiée, fournir une séquence installation → première utilisation → réessai → refus d'un tiers. Réussite : tous les tests dépendants passent, sans test ignoré, avant de demander une évaluation manuelle. Cette règle vise la difficulté rencontrée sur 4.12, sans changer l'architecture.
3. **Séparer les résultats de réponse et de preuve dans le test de suivi.** Responsables proposés : Dylan et développeur. Proposer pour S8-D trois cases : numéro correct, source qui confirme, lien ouvrable ; conserver en parallèle une question autonome précisant « story 3.1 ». Réussite : le résultat distingue clairement une difficulté de contexte, de recherche ou d'affichage ; une abstention attendue ne doit pas compter comme réponse documentée correcte.

Dylan valide les trois propositions le 2026-11-10 (« je valide »). Elles sont intégrées comme précisions de préparation et de vérification du sprint 9 : preuve ouvrable dans 4.14, grille S8-D dans 4.16 et contrôle des migrations comme règle de livraison. Les cinq stories et leur ordre restent inchangés ; aucune sixième story, aucun développement et aucune navigation par ancre de passage ne sont autorisés par cette validation. Le lien prévu ouvre la ressource justificative existante.

## Verdict

**accepted-with-open-items**, uniquement pour le sprint 8 : ses cinq stories sont terminées et acceptées par Dylan ; les réserves de qualité et les trois propositions sont explicites. Ce verdict ne clôture pas l'epic 4 : les stories 4.14 à 4.16 restent à livrer.

## Questions ouvertes

- Les trois propositions sont validées ; le lien retenu ouvre la ressource justificative. Viser précisément un passage reste hors périmètre et demanderait une décision distincte.
- L'observation S8-D ne permet pas encore de distinguer un passage manquant, une réponse imprécise ou un lien trop peu visible.
