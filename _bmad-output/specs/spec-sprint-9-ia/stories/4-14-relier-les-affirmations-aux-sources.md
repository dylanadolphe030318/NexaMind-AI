---
story: 4-14-relier-les-affirmations-aux-sources
title: Relier les affirmations aux sources
epic: 4
sprint: 9
status: ready-for-dev
context:
  - ../SPEC.md
  - ../conventions.md
---

# Story 4.14 — vérifier les faits grâce aux sources

## Ce que cela permet

Pour chaque information donnée par l'assistant, voir quelle source la justifie
et ouvrir cette ressource. Une liste générale de sources ne suffit plus.

## Critères d'acceptation

1. Étant donné une réponse avec plusieurs affirmations factuelles, quand elle
   est affichée, alors chaque affirmation possède un renvoi non ambigu vers au
   moins une source affichée qui soutient ce fait ; le lien ouvre la bonne
   ressource accessible, sans URL inventée.
2. Étant donné un fait sans preuve suffisante dans les passages actuels, quand
   la réponse est produite, alors ce fait n'est pas affirmé : il est retiré ou
   déclaré inconnu. Si rien ne permet de répondre, l'assistant s'abstient sans
   afficher de source justificative factice.
3. Étant donné un numéro de source hors plage, un segment non sourcé, une
   réponse mal formée ou un identifiant inventé, quand le serveur valide la
   sortie, alors aucun fait non validé n'est affiché ni enregistré comme réponse
   fiable ; erreur technique explicite ou abstention selon le cas existant.
4. Étant donné Q5 puis « Quel était le numéro de la story concernée ? »,
   quand les nouveaux passages prouvent le numéro, alors la réponse indique
   explicitement « La story concernée est 3.1 » et présente sa preuve ouvrable.
   Sans preuve actuelle, elle s'abstient, même si l'historique contient ce numéro.
5. Étant donné une réponse nouvellement enregistrée, quand la conversation est
   rouverte sans nouvel appel IA, alors les associations fait/source restent
   cohérentes. Une source modifiée, supprimée ou devenue inaccessible est signalée
   « Source non disponible », sans ancien titre/extrait devenu interdit.
6. Étant donné une conversation antérieure à cette évolution, quand elle est
   rouverte, alors son texte reste lisible comme historique et aucune association
   fait/source absente de l'enregistrement n'est inventée.
7. Étant donné les deux sélections de la recherche de ressources, quand le
   format de réponse de l'assistant évolue, alors leur schéma, leurs indices,
   leur budget et leurs résultats restent compatibles ; les tests dédiés passent.

## Décisions et limites

- Utiliser des affirmations courtes avec références explicites, par exemple un
  renvoi « Source 1 » attaché à la phrase. La ressource et les références sont
  construites par le serveur à partir des passages récupérés, jamais par URL libre.
- Ne pas imposer une ancre de passage, une page de story, une phrase copiée
  mot pour mot ni une seconde génération de vérification.
- La validation des références est structurelle ; le soutien réel du fait doit
  être vérifié sur des exemples contrôlés et pendant 4.16. Ne pas annoncer une
  garantie sémantique à partir du seul numéro de source.
- Préserver les cinq passages, le classement vectoriel et le budget de
  l'assistant. Ne pas masquer une troncature par une augmentation de budget.
- Source retirée dans une réponse historique : texte historique conservé selon
  le contrat existant, mais jamais utilisé comme preuve d'une nouvelle réponse.

## Carte du code et tâches de développement

- [ ] `src/features/assistant/assistant-core.ts` : faire évoluer consigne, types,
  parsing et construction des sources pour l'association par affirmation ;
  contrôler faits sans références, doublons et sources hors contexte.
- [ ] `src/lib/ai/openai-chat-client.ts` et `chat.ts` : isoler le schéma de
  l'assistant si nécessaire ; préserver les contrats `answer/sources/missing`
  des sélections de passages et de phrase. Aucun secret client.
- [ ] `src/features/assistant/assistant-conversation-core.ts`,
  `conversations.ts` et `conversations-core.ts` : enregistrer/restituer les
  associations sans perdre l'ordre ou l'idempotence. Les sources actuelles sont
  dédupliquées par ressource : ne pas confondre deux passages d'une même ressource.
- [ ] `src/features/assistant/assistant-form.tsx` et
  `src/app/assistant/conversations/[id]/page.tsx` : affichage et liens cohérents,
  y compris réponses historiques et états inconnus/erreurs.
- [ ] Si le stockage ou le RPC `finalize_conversation_answer` doit évoluer :
  nouvelle migration additive dans `supabase/migrations/`, anciennes données
  compatibles, permissions et vérification de révision conservées. Fournir
  application et contrôles première utilisation/réessai/refus de tiers.
- [ ] `tests/assistant.test.mjs`, `assistant-conversations.test.mjs` et
  `conversations-rls.test.mjs` : plusieurs faits/sources, même ressource avec
  deux passages, source inexistante, sortie sans preuve, reprise après erreur,
  ancienne conversation et source indisponible.
- [ ] Préserver `tests/resource-selection-client.test.mjs`,
  `resource-passage-selection.test.mjs` et `relevant-search-phrase.test.mjs`.
  Lire les guides Next locaux pertinents avant toute modification.

## Vérification après développement

- Tests unitaires ciblés des fichiers ci-dessus, TypeScript, lint et build.
- Intégration de conversations avec sessions réelles, après migration éventuelle ;
  aucun scénario dépendant ignoré ne compte comme validé.
- Manuel dans [tests-ia.md](../../../../tests-ia.md) : S9-A, Q1–Q6 et S8-D.
  Relever séparément numéro 3.1, preuve actuelle et lien.
- Dépend du sprint 8 et des corrections A/C acceptées. Livrer en revue, un commit,
  puis attendre l'évaluation de Dylan avant de poursuivre 4.15.
