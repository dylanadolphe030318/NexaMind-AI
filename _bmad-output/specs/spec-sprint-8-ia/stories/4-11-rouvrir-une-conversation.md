---
story: 4-11-rouvrir-une-conversation
title: Rouvrir une conversation
epic: 4
sprint: 8
status: ready-for-dev
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
