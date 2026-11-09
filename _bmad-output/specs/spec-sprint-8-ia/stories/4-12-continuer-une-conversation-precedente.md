---
story: 4-12-continuer-une-conversation-précédente
title: Continuer une conversation précédente
epic: 4
sprint: 8
status: ready-for-dev
context:
  - ../SPEC.md
---

# Story 4.12 — continuer une conversation

## Ce que cela permet

Poser une question liée à l'échange précédent et retrouver tous les nouveaux messages au même endroit.

## Critères d'acceptation

1. Étant donné une conversation active du membre, quand il la rouvre, alors un champ permet une nouvelle question ; après réponse, les nouveaux messages sont ajoutés à la même conversation.
2. Étant donné une question liée aux échanges précédents, quand l'assistant la traite, alors il utilise leur contexte récent pour interpréter la question et recherche des passages actuels autorisés pour répondre.
3. Étant donné plus de dix échanges précédents, quand une question est envoyée, alors au plus les dix derniers échanges sont transmis et l'exclusion des plus anciens est annoncée ; l'historique affiché n'est pas supprimé.
4. Étant donné un ancien extrait ou une réponse devenue non vérifiable, quand une nouvelle réponse est produite, alors elle ne les utilise pas comme preuve ; ses sources proviennent des nouveaux passages autorisés ou elle s'abstient.
5. Étant donné un échec puis « Réessayer » ou une soumission concurrente du même identifiant, quand la tentative termine, alors une seule question et une seule réponse finale sont enregistrées, sans appel concurrent en double pour cette question.
6. Étant donné une conversation tierce, expirée ou supprimée, quand un ajout est tenté, alors il est refusé avant l'appel IA ; les quotas existants restent appliqués à chaque tentative autorisée.

## Décisions de comportement

- Validé : dix derniers échanges au maximum ; ancien contenu = contexte de formulation, pas source. Aucune relance automatique.
- Le client de messages accepte aujourd'hui `system | user` : adapter proprement les types et le format de contexte, sans cast, et sans transformer les anciens textes en instructions prioritaires.
- La question de recherche doit inclure le contexte nécessaire pour lever « cette technologie » ou « ce problème ». Garder l'embedding/recherche côté serveur, respecter la limite de requête ; ne pas prétendre tenir compte du contexte si seul le texte ambigu est recherché.
- Proposé pour relecture : construire une requête bornée et déterministe à partir de la question courante et du contexte récent pertinent, sans appel LLM de reformulation supplémentaire. Tester les deux suivis S8-D.
- Ne pas transmettre les anciens extraits de sources ; les anciens messages ne constituent jamais une autorisation sur une ressource. Prompt : passages actuels uniquement, sources vérifiées, « Je ne sais pas » si information manquante.
- Réutiliser la réservation/finalisation atomique de 4.10. Une seule nouvelle question acceptée prolonge l'expiration ; consultation ou relance du même UUID ne le font pas.

## Carte du code et tâches

- `src/features/assistant/assistant-core.ts`, `assistant.ts`, `assistant-actions.ts`, `assistant-form.tsx` : contexte récent, nouvelle question dans la conversation et reprise stable.
- `src/lib/ai/openai-chat-client.ts` : types/messages adaptés si nécessaire, mêmes limites serveur et format de réponse structuré.
- Nouvelle migration Supabase requise (appliquée par Dylan) : `claim_conversation_question(p_question_id, p_question)` crée toujours une conversation ; ajouter une variante ou un paramètre conversation cible qui vérifie propriétaire et expiration avant réservation, sans modifier le comportement de 4.10. `src/features/assistant/conversations.ts` (`askAndSaveQuestion`) l'appelle.
- Tests unitaires : question de suivi, contenu passé au fournisseur, maximum dix échanges, aucune source obsolète en contexte, quota, échec et doublon.
- Tests RLS : ajout/refinalisation tiers refusés, expiration, suppression pendant génération sans recréation de la conversation.

## Textes d'écran

« Poser une nouvelle question », « Réessayer », « Seuls les 10 derniers échanges sont utilisés pour cette réponse. »

## Vérification

Scénarios S8-D, S8-E, S8-F, S8-G ; questions 1 à 10 en non-régression dans [tests-ia.md](../../../../tests-ia.md). Dépend de 4.11. Aucun partage ni mémoire globale entre conversations.
