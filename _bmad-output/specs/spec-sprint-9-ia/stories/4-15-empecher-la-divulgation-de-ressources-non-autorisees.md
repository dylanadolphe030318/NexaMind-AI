---
story: 4-15-empecher-la-divulgation-de-ressources-non-autorisees
title: Empêcher la divulgation de ressources non autorisées
epic: 4
sprint: 9
status: ready-for-dev
context:
  - ../SPEC.md
  - ../conventions.md
---

# Story 4.15 — ne pas révéler une ressource interdite

## Ce que cela permet

Poser une question sans recevoir du contenu ou une citation que l'on n'a pas le
droit de consulter, y compris en poursuivant un ancien échange.

## Critères d'acceptation

1. Étant donné une ressource réellement inaccessible à la session testée,
   quand le membre pose une question ciblant son contenu, alors la réponse et
   les sources ne révèlent ni contenu, titre, extrait ou identifiant de cette
   ressource. L'application n'en confirme pas l'existence.
2. Étant donné cette fixture et une ressource autorisée témoin, quand la
   récupération s'exécute sous la session utilisateur avec RLS, alors seuls
   les passages autorisés peuvent atteindre le contexte transmis au LLM.
   Une réponse qui semble correcte ne remplace pas l'inspection de ce contexte.
3. Étant donné un membre B du workspace commun, quand il interroge une ressource
   d'A partagée et prête, alors il peut toujours la retrouver. Les règles ne
   deviennent pas « seul le propriétaire peut lire ».
4. Étant donné une conversation d'A, quand B ou le responsable essaie sa
   lecture, sa continuation ou ses références directement ou via l'interface,
   alors aucun message, titre ou source privé n'est révélé et aucune mutation
   ne réussit ; les protections d'expiration restent actives.
5. Étant donné un ancien fait présent dans l'historique mais sans preuve
   actuelle accessible, quand une nouvelle question s'y rapporte, alors ce
   fait historique ne suffit pas à répondre ou à recréer une citation.
   Les instructions dans les passages ou l'historique ne changent pas les droits.
6. Étant donné une session absente ou une erreur de contrôle d'accès, quand
   l'action est appelée directement, alors la session est exigée ou l'erreur
   est explicite ; aucun repli privilégié ou message de succès n'expose de données.
7. Étant donné les tests d'interdiction, quand ils terminent ou échouent,
   alors les fixtures sont retirées/annulées et les politiques réelles, profils,
   ressources et espaces persistants de la démo sont inchangés.

## Décisions de comportement

- Une information absente ne prouve pas une interdiction. Q9/Q10 ne sont
  « réussies » qu'avec preuve que leur ressource existe dans la fixture et que
  la session ne peut pas la lire. Sinon noter « non vérifié ».
- Un espace produit partagé reste la règle. Ne pas créer un second espace
  persistant, modifier un rôle réel ni déplacer une ressource réelle pour le test.
- Suivre le montage SQL isolé et transactionnel décrit dans
  [les conventions](../conventions.md), avec rôle/session réels pour les assertions.
  La création privilégiée de fixtures reste distincte des requêtes testées.
- Refus uniformes ; aucun contenu interdit dans les journaux. Ne pas recopier
  le texte ou le titre de la fixture dans un message d'erreur utilisateur.
- Renforcer uniquement les surfaces dont un défaut est démontré ; réutiliser
  les contrôles RLS et fonctions serveur existants au lieu de créer un second RAG.

## Carte du code et tâches de développement

- [ ] `src/features/resources/semantic-search.ts` et `semantic-search-core.ts` :
  vérifier propagation de session, refus d'anonyme, absence de repli, uniquement
  passages `ready` accessibles, cinq passages assistant.
- [ ] `src/features/assistant/assistant.ts`, `assistant-core.ts`,
  `conversations.ts` et `conversations-core.ts` : vérifier question initiale,
  continuation, reprise et réouverture ; les sources anciennes ne deviennent
  jamais preuves actuelles.
- [ ] `tests/semantic-access.test.mjs` et `assistant.test.mjs` : exécuter une
  capture de l'appel de génération, marqueur interdit absent de tous les
  messages et des références, témoin autorisé présent ; ne pas se limiter à
  une recherche textuelle du code.
- [ ] `tests/semantic-search-rls.test.mjs`, `conversations-rls.test.mjs` :
  maintenir partage autorisé, refus anonyme et historique privé.
- [ ] Nouveau `tests/assistant-access-rls.sql` : fixture fictive isolée,
  assertions RLS sur ressource/passages/RPC avec identités distinctes, preuve
  positive d'existence par le montage et preuve négative par la session cible ;
  rollback transactionnel sans données persistantes. Documenter l'exécution
  manuelle SQL dans `README.md`, sans installer d'outil supplémentaire par défaut.
- [ ] `tests-ia.md` : consigner preuve/fichier de résultat de S9-B et Q9/Q10,
  limites de l'essai, comptes anonymisés et erreurs visibles.
- [ ] Si un défaut SQL est démontré : nouvelle migration additive seulement,
  tests première utilisation/réessai/refus de tiers après application. Ne pas
  modifier une ancienne migration.

## Vérification après développement

- Unitaires assistant et accès ; intégration recherche/conversations ; scénario
  SQL isolé exécuté et rollback confirmé. TypeScript, lint et build si code modifié.
- Manuel : S9-B, Q9 et Q10 de [tests-ia.md](../../../../tests-ia.md) sous les
  préconditions indiquées ; S8-F pour confidentialité des conversations.
- Aucun nouvel appel réel au fournisseur nécessaire pour le test structurel
  du contexte. S'il manque l'environnement SQL isolé, signaler le blocage :
  ne pas déclarer la story validée avec une simple abstention.
- Dépend de 4.14. Un commit de livraison, état en revue, puis évaluation de Dylan.
