---
story: 4-11-rouvrir-une-conversation
title: Rouvrir une conversation
epic: 4
sprint: 8
status: in-review
baseline_commit: 70011ad3436f3b0e3e16f56df0bccf459d581799
context:
  - ../SPEC.md
---

# Story 4.11 — rouvrir une conversation

## Ce que cela permet

Relire ses anciennes questions, réponses et sources sans générer une nouvelle réponse.

## Critères d'acceptation

1. Étant donné une conversation active du membre, quand il l'ouvre, alors questions, réponses et états enregistrés s'affichent dans leur ordre.
2. Étant donné une source toujours disponible dans la même révision, quand le membre consulte la réponse, alors son titre/extrait sont relus avec ses droits actuels et le lien ouvre la bonne ressource.
3. Étant donné une source modifiée, supprimée ou inaccessible, quand la conversation est ouverte, alors « Source non disponible » est affiché, sans ancien extrait ni titre inaccessible ; la réponse historique est clairement identifiée comme telle.
4. Étant donné la conversation d'autrui, quand le membre ou responsable ouvre son URL ou interroge messages/sources dans Supabase, alors aucun contenu n'est révélé.
5. Étant donné une conversation expirée ou supprimée, quand une ancienne URL est ouverte, alors elle est indisponible ; une erreur technique est distinguée de cet état.
6. Étant donné une consultation, quand la page charge, alors aucun appel LLM/embeddings ni prolongation d'expiration ne se produit.

## Décisions de comportement

- Proposé pour relecture : `/assistant/conversations/[id]`, « Retour à mes conversations ». Message identique pour identifiant inexistant, expiré ou non autorisé, sans révéler son propriétaire.
- Ne pas relancer la recherche ou la génération pour relire. Afficher les réponses stockées, pas une reconstruction.
- Relire les sources avec RLS et la révision sauvegardée ; détacher une source devenue indisponible sans conserver de copie de passage. Ne pas confondre erreur de chargement des sources et absence réelle.
- Une réponse historique n'est pas une garantie que son ancienne source est encore accessible ; avertissement si une source ne peut plus être vérifiée.

## Carte du code et tâches

- `src/features/assistant/conversations.ts` (+ `conversations-core.ts`) : ajouter la lecture d'une conversation à côté de `listMyConversations` ; ordre des messages, disponibilité des références.
- Aucune migration attendue : les politiques SELECT de 4.10 couvrent `conversations`, `messages`, `message_sources` ; `message_sources` garde `resource_id`, `chunk_id`, `resource_revision` (mis à `null` si la ressource ou le passage disparaît), sans extrait.
- Nouvelle page `src/app/assistant/conversations/[id]/page.tsx` ; rendre les éléments de la liste existante (`conversations/page.tsx`) cliquables.
- `tests/conversations-rls.test.mjs` : lecture directe de messages/sources d'autrui refusée ; ressource modifiée/supprimée ; responsable ; URL expirée.
- Tests unitaires : pas de fournisseur lors d'une lecture, erreurs distinctes, sources non disponibles sans fuite.

## Textes d'écran

« Conversation », « Source non disponible », « Cette réponse a été enregistrée auparavant ; certaines sources ne peuvent plus être vérifiées. », « Cette conversation n'est pas disponible. », « La conversation n'a pas pu être chargée. Réessayez. »

## Vérification

Scénarios S8-C, S8-F et S8-G de [tests-ia.md](../../../../tests-ia.md). Dépend de 4.10 ; aucune nouvelle question dans cette story.

## Hors périmètre

Ajout d'une question dans la conversation (4.12), suppression (4.13), export/partage, nouvelle migration.

## Autorisation de développement

Dylan a demandé le 2026-11-09 de développer 4.11, 4.12 puis 4.13, une par une. Implémenter seulement cette fiche, sans commencer 4.12 ni marquer `done`. Ne pas commiter depuis l'agent d'implémentation ; le commit suit la revue. N'appliquer aucune migration à Supabase. Lire les guides Next.js pertinents dans `node_modules/next/dist/docs/` avant toute modification Next.js (route dynamique `[id]`, `params` asynchrones, `notFound`). Aucun appel LLM/embeddings, aucune clé ni `service_role` dans ce parcours : client Supabase serveur de l'utilisateur, RLS. Commandes du projet : voir `package.json` (tests unitaires, `tsc`, ESLint) ; les tests d'intégration RLS exigent `.env.local` et peuvent être lancés si la configuration existe.

## État du développement

- Page `/assistant/conversations/[id]` : messages dans l'ordre, états, réponse marquée « Réponse historique », sources relues sous RLS et affichées seulement si ressource et passage existent encore dans la révision enregistrée ; sinon « Source non disponible » et avertissement. Titres de la liste cliquables.
- Identifiant invalide, conversation tierce, expirée ou supprimée : même message « Cette conversation n'est pas disponible. » ; erreur technique distincte avec « Réessayez. ».
- Aucun appel IA à la lecture : `generateAssistantAnswer` est désormais importé seulement au moment d'une question.
- Vérifications : 87/87 tests unitaires, `tsc`, ESLint. Intégration `conversations-rls` 5/5 après correction d'un sous-test imbriqué qui bloquait le runner (le contrôle de révision est maintenant exécuté dans le test de reprise).
- Hors story, préexistant : `semantic-search-rls` échoue (2/40) car la migration `20261107100000_search_resource_chunks_hybrid_window.sql` a retiré `chunk_id`/`revision` du retour de `search_resource_chunks_hybrid`. L'assistant n'utilise pas cette fonction ; signalé à Dylan, non corrigé ici.

## Review Triage Log

| Constat | Verdict | Preuve et traitement |
|---|---|---|
| Expiration entre la vérification de la conversation et la lecture des messages : historique vide affiché | low | Fenêtre de quelques millisecondes à la 30e journée ; garde supplémentaire nécessaire. Rejeté (rare, correctif non direct). |
| Tous les messages chargés sans pagination d'affichage | low | Lecture paginée par 500 côté serveur ; volumes MVP faibles. Rejeté. |
| Date de chaque message non affichée | false | Non exigée par la fiche ; la liste affiche déjà la date de dernière question. Rejeté. |
| État affiché sous la question et sous la réponse | false | L'état de la question est nécessaire quand aucune réponse n'existe (échec, limite) ; critère 1 demande les états enregistrés. Rejeté. |
| Retours à la ligne non conservés | false | Même rendu que la réponse de l'assistant en direct (`.assistant-answer` sans `pre-wrap`) ; pas de régression. Rejeté. |
| Erreur de lecture des sources masque toute la conversation | false | Choix voulu par la fiche : ne pas confondre erreur de chargement et source réellement absente. Rejeté. |
| Lecteur applicatif non testé avec deux conversations | low | Filtre `.eq("conversation_id", id)` présent et RLS propriétaire testée ; test exigerait de simuler le client serveur `server-only`. Rejeté. |
