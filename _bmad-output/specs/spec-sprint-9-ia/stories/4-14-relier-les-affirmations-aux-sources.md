---
story: 4-14-relier-les-affirmations-aux-sources
title: Relier les affirmations aux sources
epic: 4
sprint: 9
status: done
baseline_commit: d9f2c3368767c748c992147d4cf106489687996f
context:
  - ../SPEC.md
  - ../conventions.md
---

# Story 4.14 — vérifier les faits grâce aux sources

## Validation finale — 2026-11-12

Dylan confirme : « L'évaluation du sprint IA est satisfaisante : tout est correct »
et demande la cloture des stories. Story acceptee et terminee.
Les autorisations, pauses et etats de livraison ci-dessous sont historiques ;
cette validation finale les remplace pour le statut. Aucun score detaille invente.

## Ce que cela permet

Pour chaque information donnée par l'assistant, voir quelle source la justifie
et ouvrir cette ressource. Une liste générale de sources ne suffit plus.

## Autorisation de réalisation et arrêt

Dylan autorise maintenant le développement de cette fiche ; les mentions
« préparation uniquement » des documents de contexte décrivent la phase passée.
Réaliser seulement 4.14, sans commencer 4.15 ni les autres stories.

- Tous les appels LLM et embeddings restent serveur ; clés depuis `.env.local`,
  jamais dans le navigateur. Recherche sous la session connectée et ses droits.
- La consigne exige passages actuels uniquement, sources et « je ne sais pas »
  si l'information manque. Ne changer ni fournisseur ni embeddings ni pgvector.
- Ne pas appliquer de migration distante, pousser ou créer un commit depuis
  l'agent d'implémentation. Préparer les étapes précises pour Dylan si une
  migration est nécessaire ; ne pas présenter une intégration non exécutée comme
  réussie. Le pilote effectue le commit de livraison après vérification.
- Arrêter sur blocage ou erreur persistante et les signaler explicitement.
  Ne jamais marquer la fiche ou le suivi `done` : évaluation humaine requise.

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

- [x] `src/features/assistant/assistant-core.ts` : faire évoluer consigne, types,
  parsing et construction des sources pour l'association par affirmation ;
  contrôler faits sans références, doublons et sources hors contexte.
- [x] `src/lib/ai/openai-chat-client.ts` et `chat.ts` : isoler le schéma de
  l'assistant si nécessaire ; préserver les contrats `answer/sources/missing`
  des sélections de passages et de phrase. Aucun secret client.
- [x] `src/features/assistant/assistant-conversation-core.ts`,
  `conversations.ts` et `conversations-core.ts` : enregistrer/restituer les
  associations sans perdre l'ordre ou l'idempotence. Les sources actuelles sont
  dédupliquées par ressource : ne pas confondre deux passages d'une même ressource.
- [x] `src/features/assistant/assistant-form.tsx` et
  `src/app/assistant/conversations/[id]/page.tsx` : affichage et liens cohérents,
  y compris réponses historiques et états inconnus/erreurs.
- [x] Si le stockage ou le RPC `finalize_conversation_answer` doit évoluer :
  nouvelle migration additive dans `supabase/migrations/`, anciennes données
  compatibles, permissions et vérification de révision conservées. Fournir
  application et contrôles première utilisation/réessai/refus de tiers.
- [x] `tests/assistant.test.mjs`, `assistant-conversations.test.mjs` et
  `conversations-rls.test.mjs` : plusieurs faits/sources, même ressource avec
  deux passages, source inexistante, sortie sans preuve, reprise après erreur,
  ancienne conversation et source indisponible.
- [x] Préserver `tests/resource-selection-client.test.mjs`,
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

## Résultat de réalisation

- Contrat assistant `claims/missing` isolé du contrat des sélections ressources.
  Chaque affirmation reçoit des marqueurs serveur de passages dans le texte
  persisté ; les références existantes conservent tous les passages utilisés,
  puis l'affichage les regroupe par ressource. Aucune migration nécessaire :
  `message_sources` possède déjà l'unicité `(answer_message_id, chunk_id)` et le
  RPC accepte jusqu'à cinq références, avec contrôle de session et de révision.
- Les marqueurs sont retirés de l'historique fourni au modèle. Le rendu commun
  conserve les anciennes réponses sans inventer leurs associations ; les sources
  retirées sont signalées sans titre ni extrait.
- Vérification finale ciblée : 70 tests unitaires réussis, aucun ignoré ;
  intégration conversations sous sessions Supabase : 7/7 réussis, aucun ignoré,
  avec deux passages persistés de la même ressource et réouverture vérifiée.
  TypeScript, lint ciblé et build de production réussis.
- Un test de libellé a détecté une casse modifiée ; la phrase d'abstention a été
  corrigée et la suite ciblée relancée avec succès. Un premier build a rencontré
  `EPERM` dans un ancien sous-dossier généré de `.next/static` sous OneDrive ;
  seul ce sous-dossier inspecté a été retiré, puis le build a réussi.
- Guides Next locaux consultés pour composants serveur/client, liens et tests.
  Le rendu synchronisé est testé avec React DOM serveur et la transpilation
  TypeScript déjà installée, sans nouveau runner ni dépendance.
- Aucun test du fournisseur réel ni évaluation sémantique Q1–Q6/S8-D revendiqué.
  Aucun changement de modèle, budget, embeddings, classement, SQL ou droits.
  4.15 et les autres stories n'ont pas commencé. Fiche `in-review`, suivi `review`,
  évaluation de Dylan encore attendue.

## Review Triage Log

| Réf. | Verdict | Preuve et décision |
|---|---|---|
| Blind-1 — numéro identique pour deux passages d'une ressource | false | Les renvois demandés visent la ressource affichée, pas une ancre de passage. Chaque marqueur ouvre la bonne ressource ; les deux extraits restent visibles. Le test de rendu couvre cette association sans imposer une ancre hors périmètre. |
| Blind-2 — texte composé de plusieurs faits | false | La consigne exige des affirmations indépendantes ; le parseur valide la structure, pas le soutien sémantique, limite explicitement acceptée. Découper arbitrairement la prose ne prouverait pas les faits ; l'évaluation humaine reste requise. |
| Blind-3 — absence de plusieurs affirmations distinctes dans les tests | medium | Patch : test exécutable de trois faits, deux ressources et deux passages d'une ressource, du résultat de génération jusqu'aux liens rendus. Réussi. |
| Blind-4 — persistance multi-passage non testée en base | medium | Patch : intégration étendue à deux références de la même ressource ; texte, sources et réouverture vérifiés après finalisation concurrente. Le test contrôle aussi modification, suppression et refus de lecture par un tiers. Réussi. |
| Blind-5 — composant de rendu non testé | medium | Patch : rendu réel du composant commun, liens de chaque fait, source indisponible et ancienne réponse sans association. Réussi. |
| Blind-6 — schémas comparés seulement sur les champs requis | low | Patch : comparaison intégrale des deux schémas JSON stricts, types inclus ; budgets 500/2048 conservés. Réussi. |
| Blind-7 — résultats absents de la fiche | low | Suggestion documentaire, pas défaut produit ; les résultats réels de livraison sont consignés ci-dessus, sans déclarer les contrôles humains exécutés. |
| Blind-8 — nombre de réessais non défini | false | Aucune nouvelle boucle de réessai n'est ajoutée. La règle humaine reste arrêt en cas de blocage ou erreur persistante, sans inventer un nouveau comportement automatique. |
| Gap-1 — absence de vérification des liens rendus | medium | Même défaut que Blind-5 : patch de rendu réel, y compris sources retirées et historique. Vérification réussie dans les 70 tests. |

Deux revues indépendantes ont produit les constats ci-dessus. La troisième
revue a échoué avant lecture du diff parce que son chemin d'instructions omettait
`Workshop 7` ; elle n'est pas comptée comme réussie. Le pilote a repris directement
le traçage des branches du diff, des suppressions et des appels : aucun défaut
supplémentaire confirmé. Les limites sémantiques restent explicites, sans report
technique supplémentaire.

### Review Findings — sprint 9, 2026-11-11

- [x] [Review][Patch] Refuser les references libres de type « source numero 9 »
  dans le texte des affirmations
  [assistant-core.ts:165](../../../../src/features/assistant/assistant-core.ts#L165).
  Avec un seul passage et `sources: [1]`, le parseur accepte ce texte et le rendu
  affiche le numero invente a cote du lien « Source 1 ». Reproduction executee
  de `runAssistant` jusqu'au rendu React, sans fournisseur ni reseau.
  Gravite moyenne : association fait/source ambigue, contraire au critere 3.
  Correction validee par Dylan puis appliquee : variantes numero/numeros,
  numero accentue, n°, nº, no., pluriel, ponctuation et espaces insecables
  refusees avant affichage. Un test de regression verifie le rejet dans le
  parseur et le resultat d'erreur sans reponse ni sources dans `runAssistant`.
  Les faits ordinaires comme « La source de donnees contient 9 tables »
  restent acceptes. Test observe en echec avant correction puis en reussite.

#### Rejected

- Troncature des longues questions de suivi : mecanisme identique dans le
  baseline `d9f2c33`, pas une regression introduite par ce sprint.
- Schema non teste a travers l'adaptateur : lacune de test, mais aucun mauvais
  routage constate ; le schema correct est selectionne et une assertion
  existante controle ce choix. Pas de defaut produit demontre.
- Ancien texte historique apres retrait d'une source : conservation privee
  explicitement prevue par la fiche, deja presente avant le sprint ; les sources
  indisponibles sont masquees et ces anciennes reponses ne sont plus envoyees
  au fournisseur. Aucune nouvelle vulnerabilite demontree.

Les quatre couches de revue ont rendu un resultat (aucun constat pour les cas
limites). Revue de securite distincte : aucune vulnerabilite nouvelle confirmee.
Les 52 tests assistant, conversations et client de selection ont ete executes :
52 reussis, aucun ignore ; TypeScript et lint cible reussis apres correction.
Le SQL RLS isole et l'evaluation humaine restent
non executes ; aucun statut de story n'est modifie.
