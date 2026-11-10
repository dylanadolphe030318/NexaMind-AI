---
story: 4-13-supprimer-une-conversation-de-son-historique
title: Supprimer une conversation de son historique
epic: 4
sprint: 8
status: in-review
baseline_commit: f77a7440595186ba5a90d271ff6009af83475524
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

- Nouvelle migration Supabase requise (appliquée par Dylan) : les membres n'ont que SELECT ; ajouter une fonction de suppression propriétaire seulement (ou une politique DELETE), sans `service_role`. Les cascades de 4.10 retirent messages et sources ; `finalize_conversation_answer` doit échouer proprement si la conversation n'existe plus.
- `src/features/assistant/conversations.ts` : suppression autorisée et transactionnelle.
- Action serveur et confirmation dans la liste/détail ; clavier, focus et annulation accessibles.
- Tests unitaires : confirmer/annuler, échec explicite, aucune suppression des ressources.
- `tests/conversations-rls.test.mjs` : suppression tiers refusée, cascade vérifiée, finalisation après suppression refusée.

## Textes d'écran

« Supprimer la conversation « {titre} » ? », « Supprimer », « Annuler », « La conversation a été supprimée. », « La conversation n'a pas pu être supprimée. Réessayez. »

## Vérification

Scénarios S8-H et S8-F de [tests-ia.md](../../../../tests-ia.md). Dépend de 4.12 pour vérifier l'interaction avec une génération en cours.

## Autorisation de développement — 2026-11-10

Dylan autorise cette story après validation manuelle de 4.12. Développer uniquement la suppression, sans statut `done`, sans commit par l'agent d'implémentation. Ne pas modifier ni ajouter à Git les résultats personnels non suivis dans `RAG et IA/`.

- Écrire une nouvelle migration transactionnelle datée après `20261110123000`, sans modifier les migrations déjà appliquées ni exécuter de SQL à distance. Dylan appliquera le fichier dans SQL Editor ; indiquer son nom et arrêter les tests dépendants si elle est absente.
- Fonction de suppression réservée aux utilisateurs authentifiés, propriétaire vérifié par `auth.uid()`, `search_path` fixe, sans `service_role`. Refuser uniformément les cibles inexistantes ou tierces. Préserver les ressources et les passages.
- Préserver les limites IA et le contexte serveur existants : aucune génération ni embedding nécessaire pour supprimer, aucun secret navigateur. Lire les guides Next.js pertinents dans `node_modules/next/dist/docs/` avant modification.
- Préférer une confirmation dans le détail avec un point d'entrée depuis la liste ; annulation accessible sans mutation. Tester le chemin action/service, pas seulement la construction des données.
- Tester suppression pendant génération puis finalisation tardive, interdiction membre B/responsable, cascade messages/références et préservation ressource/passage et autre conversation. Ne pas utiliser le `t` parent pour lancer un sous-test imbriqué.
- Validation : tests unitaires ciblés, TypeScript, ESLint, build ; intégration conversations après application de la migration. L'échec préexistant de recherche hybride (`chunk_id`/révision) n'est pas à corriger ici.

## Livraison — en attente de migration et d'évaluation

- Suppression depuis la liste ou le détail : confirmation nommée, annulation par lien sans mutation, action serveur authentifiée, invalidation de la liste et du détail, retour avec succès uniquement après réponse positive de la base. Erreurs techniques et cibles indisponibles signalées explicitement.
- [Migration à appliquer](../../../../supabase/migrations/20261110140000_delete_owned_conversation.sql) : fonction propriétaire seulement, aucune clé privilégiée, suppression atomique avec les cascades existantes. Aucun changement de fournisseur IA, d'embeddings ou de recherche.
- Vérifications locales : 99/99 tests unitaires avant corrections de revue, puis 25/25 tests ciblés après corrections ; TypeScript, ESLint et build de production réussis après corrections.
- Intégration conversations : 6 tests réussis, **1 scénario de suppression ignoré car migration absente**. Ne pas considérer la suppression validée avant application et exécution de ce scénario. Contrôles UI et clavier S8-H/S8-F à effectuer par Dylan.
- Aucun statut `done`. Fichiers personnels de résultats de test laissés intacts.

## Review Triage Log

| Constat | Verdict | Preuve et traitement |
|---|---|---|
| Test de suppression déclaré dans un sous-test existant | medium | Déplacé au niveau racine ; enregistré indépendamment, visible comme ignoré si migration absente. |
| Prérequis de continuation non vérifié par le test de suppression | low | Ajout de `continuationSkipReason` à sa condition d'exécution. |
| Adaptateur Supabase de suppression non testé par les tests unitaires | low | Authentification et transmission de l'identifiant vérifiées dans le cœur injectable ; branchement réel au RPC relu directement. L'intégration RPC complète attend la migration ; le wrapper Next serveur n'est pas exécuté par ces tests Node. |
| Redirections et invalidations de l'action non exécutées dans les tests | medium | Traitement extrait dans `processConversationDeletion`, appelé par l'action ; test exécutable de FormData, identifiant exact, quatre résultats, invalidations uniquement après succès et saisies invalides. |
| Autorisation anonyme vérifiée seulement par lecture du SQL | medium | Ajout d'un appel RPC anonyme refusé dans le scénario d'intégration ; exécution en attente de migration. |
| Annulation et confirmation vérifiées seulement par assertions de code source | low | Annulation reste un lien GET sans mutation ; contrôle d'interface réel conservé dans S8-H, pas présenté comme automatisé. |
| Paramètre `deleted=1` peut être saisi à la main | false | Indicateur de navigation suivant le modèle existant ; aucune mutation ni autorisation accordée par ce paramètre. Les échecs réels de l'action ne produisent pas ce retour. |
| Absence de test exécutable du champ soumis jusqu'au service de suppression | medium | Traitement du formulaire exécuté par les nouveaux tests, vérifie que l'identifiant soumis atteint le service injecté et détermine la destination. Branchement RPC relu ; intégration réelle attend la migration. |
