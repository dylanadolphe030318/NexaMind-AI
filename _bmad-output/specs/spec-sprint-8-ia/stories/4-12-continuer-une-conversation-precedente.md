---
story: 4-12-continuer-une-conversation-précédente
title: Continuer une conversation précédente
epic: 4
sprint: 8
status: in-review
baseline_commit: 4fb21fa43b51a4a4b13222e126b9265e4845ff21
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

## Hors périmètre

Suppression (4.13), partage, mémoire entre conversations, reformulation par un second appel LLM, relance automatique, correction de `search_resource_chunks_hybrid` (recherche de ressources, hors sprint).

## Autorisation de développement

Dylan a demandé le 2026-11-09 de développer 4.11, 4.12 puis 4.13, une par une. 4.11 est livrée (page `/assistant/conversations/[id]`, `getMyConversation`). Implémenter seulement cette fiche, sans commencer 4.13 ni marquer `done`. Ne pas commiter depuis l'agent d'implémentation. Écrire la nouvelle migration dans `supabase/migrations/` (horodatage postérieur à `20261107100000`) mais ne jamais l'appliquer : Dylan l'appliquera. Ne pas modifier les migrations existantes. Si les tests d'intégration échouent parce que la migration n'est pas appliquée, le signaler avec le nom exact du fichier sans insister. Dans `tests/*.test.mjs`, ne jamais appeler le `t` parent depuis un sous-test (cela bloque le runner).

Règles IA : appels LLM et embeddings côté serveur uniquement (`server-only`) ; clés lues depuis `.env.local`, jamais dans le code navigateur ; recherche des passages avec le client Supabase de l'utilisateur (RLS), jamais `service_role` ; la consigne système existante (réponse uniquement à partir des passages fournis, sources citées, « Je ne sais pas » si l'information manque) reste prioritaire sur les anciens messages. Conserver limites : question 300 caractères, 5 passages, seuil 0,4, 20 questions/minute, 500 jetons, 30 s, aucune relance automatique. Lire les guides Next.js pertinents dans `node_modules/next/dist/docs/` avant toute modification Next.js. Commandes : `npm run test:unit`, `npx tsc --noEmit`, `npx eslint src tests`, `node --env-file=.env.local --test --test-timeout=240000 tests/conversations-rls.test.mjs`.

## Review Triage Log

| Constat | Verdict | Preuve et traitement |
|---|---|---|
| Le texte du formulaire ne signalait pas l'envoi de l'historique à OpenAI | medium — patch | `assistant-form.tsx` précise désormais que jusqu'aux dix derniers échanges sont envoyés en mode conversation ; le test vérifie ce texte. |
| Une question courante proche de 300 caractères était tronquée pour réserver de la place au contexte | medium — patch | `buildAssistantSearchQuery` préserve maintenant la question entière et omet le contexte si le budget restant est insuffisant ; test avec une question de 300 caractères. |
| Une longue réponse historique pouvait masquer la question précédente dans la requête de recherche | medium — patch | La requête place chaque question historique avant sa réponse ; un test couvre la réponse longue. |
| Le message de fenêtre de contexte pouvait compter une question encore en cours comme un échange omis | medium — patch | `hasOmittedConversationExchanges` ignore les questions `generating` ; le test couvre dix échanges terminés plus une question en cours. |
| Le statut du suivi sprint restait `in-progress` alors que la fiche est `in-review` | medium — patch | Le suivi utilise maintenant `review`, comme la story 4.11 dont le frontmatter est également `in-review`. La 4.12 n'est pas marquée `done`. |
| L'assertion d'absence d'ancien extrait ne fournissait pas d'extrait témoin | low — patch | Les fixtures contiennent maintenant un extrait ancien distinctif et vérifient son absence du contexte transmis. |
| Le passage de l'historique chargé au générateur n'était pas testé dans le flux de continuation | medium — patch | La lecture du contexte et l'appel du générateur sont couverts via les fonctions pures utilisées par le chemin serveur ; le test vérifie l'identifiant de conversation, l'isolation des messages et l'historique reçu. |
| Une question courante longue perdait sa fin quand un contexte était présent | medium — patch | Même cause que la troncature de la requête ci-dessus ; le test confirme la conservation intégrale de la limite de 300 caractères. |
| Une réponse passée longue pouvait évincer le sujet de la question historique | medium — patch | Même cause que l'ordre de la requête ci-dessus ; question historique prioritaire et test ajouté. |
| Aucun test ne vérifiait que le contexte du dépôt était passé à la génération | medium — patch | Même lacune de couverture du flux de continuation ci-dessus ; test de chargement puis transmission ajouté. |
| Le retour `expired` du RPC n'est vérifié que par le script SQL manuel, pas par l'intégration Node | medium — defer (unverified) | `tests/conversations-expiration.sql` vérifie déjà le statut `expired`. Ajouter son exécution automatisée nécessite un dispositif de fixture SQL privilégié que l'intégration cliente RLS ne possède pas ; report inscrit dans `deferred-work.md`. |
