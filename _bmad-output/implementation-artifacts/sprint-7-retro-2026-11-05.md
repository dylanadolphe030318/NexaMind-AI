---
epic: 4
sprint: 7
scope: sprint-only
date: 2026-11-05
criteria: declared
headless: false
verdict: accepted-with-open-items
epic_machine_verdict: rejected
---

# Rétrospective du sprint 7 — réponses IA avec sources

## Résumé et inventaire

Périmètre confirmé par Dylan : stories 4.7 à 4.9 et correctifs de recherche associés. L'epic 4 reste en cours : stories 4.10 à 4.16 hors périmètre et non terminées. Cette rétrospective ne clôture pas l'epic.

Éléments disponibles :
- [Plan des sprints](../planning-artifacts/plan-sprints.NexMind%20AImd.md), sprint 7 : répondre à partir des passages, afficher les sources et signaler l'information manquante.
- Fiches [4.7](4-7-générer-une-réponse-à-partir-des-passages-retrouvés.md), [4.8](4-8-afficher-les-sources-de-la-réponse.md) et [4.9](4-9-signaler-l-absence-de-réponse-et-les-erreurs.md), toutes `done`.
- [Spécification du correctif de recherche](spec-4-4-corriger-classement-recherche-semantique.md), validée.
- [Suivi](sprint-status.yaml), résultat de détection BMAD : 16 stories dans l'epic 4, sept encore non terminées.
- Plage Git complète, incluant le premier commit de développement : `7cb631a3cb3226def4c882930a5f4dac63776fe7..6f2d8539d83dd419c17d4344b3f9bcbfcde2673c`. Neuf commits, aucun merge. Le document binaire de test n'a pas été relu.
- Commits par story : `bb6e0d137f6ff6884adeeada54064998327d30f4` (4.7), `99bfe953f92599713a50b49706def067e79e7fe4` (4.8), `2050aa35ea8d4306e2d8a2d7834580d31458be05` et `55dad6afa4042f0976ca3a3578609059d75ae1d9` (4.9). Correctifs de recherche : `88b9ad3024b248b289cf599e53219ace56da7c1e` et `97b51f699bf01703e5342634634338427ad2f538`.
- Retours de Dylan dans cette session : assistant satisfaisant, recherche de ressources difficile, évaluation finale 10/10 ; préférence pour des catégories déroulantes et des cartes mauve pâle.

La recherche historique des sessions n'a retourné aucun résultat pour l'identifiant local. Les leçons de processus s'appuient donc sur la conversation présente, ses résumés et les commits, pas sur une reconstruction exhaustive des sessions.

## Retours de Dylan

- **Réussite :** la recherche avec l'assistant.
- **Difficulté :** la recherche sur `/resources/search`.
- **Démo :** distinguer davantage les catégories et les ressources, avec une liste déroulante pour les catégories et des cartes d'information mauve pâle sur fond blanc.
- **Évaluation finale :** 10/10 réponses correctes.

## Constats

### Ce qui a bien fonctionné

- L'assistant répond à partir des passages autorisés et fournit les sources, avec abstention si nécessaire. Preuves : évaluation de Dylan ; [consigne et orchestration](../../src/features/assistant/assistant-core.ts), lignes 28–35 et 119–148 ; critères des stories 4.7–4.9. Disposition : conserver ce fonctionnement.
- Le classement hybride est réservé à la recherche de ressources, tandis que l'assistant conserve son chemin vectoriel. Preuve : [séparation des chemins](../../src/features/resources/semantic-search.ts), commit `97b51f699bf01703e5342634634338427ad2f538`. Disposition : préserver cette frontière.
- Les modules restent séparés : formulaire, action serveur, cœur testable et client OpenAI. La croissance mesurée du cœur assistant est de 144 lignes nettes ; sa taille actuelle est de 150 lignes, pas un indice suffisant de module surdimensionné. Analyse des dépendances limitée aux imports des fichiers modifiés ; aucun audit complet de duplication ou de cycles n'est revendiqué.

### Difficultés et revue BMAD

Revue en lecture seule du diff : lentilles `adversarial`, `edge-case-hunter` et `verification-gap`. Les doublons entre lentilles sont regroupés ci-dessous ; les conclusions ont été confrontées aux sources.

| Constat | Source et déclencheur | Disposition de cette instance | Leçon pour la suite |
|---|---|---|---|
| L'ordre des passages peut encore perdre la priorité d'un numéro de story exact. | La [migration](../../supabase/migrations/20261105140000_search_resource_chunks_hybrid.sql), ligne 113, trie d'abord par `matches_identifier`, mais le [cœur de recherche](../../src/features/resources/semantic-search-core.ts), lignes 100–103, retrie seulement par score. Si l'identifiant exact a un score inférieur, il repasse derrière le distracteur. Signalé par deux lentilles. | Correction proposée, non appliquée. Aucun résultat de démo particulier n'est attribué à cette cause sans preuve. Le RPC renvoie déjà cinq passages au maximum : il s'agit ici d'un déclassement, pas d'une exclusion supplémentaire prouvée. | Tester le résultat affiché après le RPC, pas seulement le classement SQL. |
| Un rejet inattendu de la récupération échappe à l'état d'erreur de l'assistant. | [runAssistant](../../src/features/assistant/assistant-core.ts), ligne 119 : `retrieve` est appelé avant le bloc `try`. Un échec de session ou de création du client peut donc remonter hors de l'état `error`. | Différé, non observé lors de la démo. | Couvrir ce cas par un test avant une correction journalisée côté serveur ; ne pas masquer l'erreur. |
| Deux tests ne prouvent pas complètement le comportement attendu. | [Test de contexte](../../tests/assistant.test.mjs), lignes 19–25 : seul le marqueur du passage est vérifié, pas le texte ni la question. [Test hybride](../../tests/semantic-search-rls.test.mjs), lignes 131–159 : l'identifiant 3.1 peut suffire à départager les passages ; le signal lexical général n'est pas isolé. | Renforcement proposé, non appliqué. Ce sont des risques de régression, pas la preuve d'une réponse actuellement fausse. | Ajouter un cas sans identifiant et vérifier le contenu exact envoyé au modèle. |
| La distinction visuelle catégories/ressources reste insuffisante pour Dylan. | Retour de démo ; [liste des catégories](../../src/features/resources/category-list.tsx), lignes 29–79, et [filtre des ressources](../../src/app/resources/page.tsx), lignes 53–79 : listes, pas menus déroulants. [Style des cartes](../../src/app/globals.css), lignes 711–718 : fond blanc. | Deux propositions UX, sans modification du code ni du plan. | Valider une présentation avant de la développer, avec clavier, mobile et contraste lisible. |

L'erreur SQL `42883` sur `pg_catalog.coalesce` rencontrée dans cette conversation a été corrigée dans le commit `97b51f699bf01703e5342634634338427ad2f538`. L'intégration réussit désormais. Cela rappelle qu'un contrôle statique SQL ne remplace pas l'application et le test de la migration.

## Vérification du comportement

- Dylan a testé l'assistant dans le navigateur et confirme 10/10 réponses correctes. Sa démo constitue la preuve utilisateur, distincte des tests automatisés.
- Vérifications exécutées pendant la clôture de cette même session : 52/52 tests unitaires, 33/33 tests d'intégration Supabase, TypeScript et ESLint réussis. Le classement hybride, la limite de cinq passages et les accès par session sont testés.
- Pendant cette rétrospective, ouverture de `http://localhost:3000/assistant` : redirection vers `/login`, conforme pour un navigateur sans session. Les réponses authentifiées n'ont pas été rejouées par l'agent ; aucun test bout en bout supplémentaire de génération n'est revendiqué. Aucun appel payant au modèle n'a été ajouté.
- Une évaluation satisfaisante n'élimine pas le cas limite de tri découvert à la revue.

## Suivi des rétrospectives précédentes

Référence : [rétrospective du sprint 4](epic-3-retro-2026-11-02.md). Deux anciennes actions sont encore `open` dans le suivi :

- `epic-3-retro-item-10-catégories-lisibles-story-2-7` : réalisation visible dans [CategoryList](../../src/features/resources/category-list.tsx), lignes 15–16 et 35–75, commit `578297ec89bf50cd08c051846dab74c43e01a8fc`. Un seul renommage peut être ouvert. Cela justifie une éventuelle transition à `done` de l'ancienne action, pas de la nouvelle demande de menu déroulant. Aucune transition appliquée sans confirmation.
- `epic-3-retro-item-11-décisions-de-comportement-valid-es-avant` : rubrique présente dans les trois fiches, mais cases de validation non cochées. Pas de preuve documentaire suffisante pour proposer `done` ; statut inchangé.

## Améliorations validées

Ces trois améliorations ont été **validées par Dylan le 2026-11-05** et inscrites dans le [plan des sprints](../planning-artifacts/plan-sprints.NexMind%20AImd.md). Pour respecter la limite de trois à cinq stories par sprint, Dylan a ensuite validé la recherche au sprint 8 et les deux améliorations visuelles au sprint 9. Leur développement n'a pas commencé. Les autres constats restent différés.

1. **Sécuriser la recherche avec un petit jeu de tests de référence.** Préserver l'ordre des résultats hybrides, tester un numéro exact et une question sans numéro de bout en bout dans le chemin de recherche ; renforcer la vérification du contexte envoyé à l'assistant. Rejouer les dix questions sur les deux écrans pour éviter de casser l'assistant. Responsable proposé : développeur pour les tests et la correction, Dylan pour la vérification finale. Réussite : priorité exacte conservée après le RPC, passage attendu retrouvé sur les cas de référence, assistant toujours satisfaisant.
2. **Présenter les catégories dans une liste déroulante clairement nommée.** Montrer « Catégorie » et « Toutes les catégories » sur l'écran de ressources retenu ; garder le filtrage et les droits actuels. Responsable proposé : Dylan pour valider l'écran et la présentation, développeur pour la mise en œuvre. Réussite : catégories distinctes des cartes de ressources, choix utilisable au clavier et sur mobile.
3. **Donner un fond mauve pâle aux cartes d'information.** Conserver le fond de page blanc et des textes/boutons suffisamment contrastés, sans recolorer les messages d'erreur ou de succès indistinctement. Responsable proposé : Dylan pour le choix visuel, développeur pour les styles. Réussite : cartes distinctes du fond, lecture facile sur mobile et ordinateur.

**Périmètre précisé par Dylan :**
- Liste déroulante sur les deux pages : filtre de Ressources et gestion des catégories. Conserver la création, le renommage et les droits actuels ; l'option « Toutes les catégories » concerne le filtre de Ressources.
- Mauve pâle sur la liste des ressources, les résultats de recherche et la réponse ainsi que les sources de l'assistant.

## Verdict

**Sprint 7 : `accepted-with-open-items`.** Les stories 4.7 à 4.9 sont terminées, Dylan a accepté les résultats (10/10) ; un cas limite de classement et des lacunes de tests restent consignés. Les trois améliorations sont approuvées pour les sprints 8 et 9, mais pas encore réalisées.

**Epic 4 : non clôturé.** Le verdict machine BMAD à l'échelle de l'epic serait `rejected` pour incomplétude, et non pour échec de ce sprint : les clés `4-10-consulter-la-liste-de-ses-conversations`, `4-11-rouvrir-une-conversation`, `4-12-continuer-une-conversation-précédente`, `4-13-supprimer-une-conversation-de-son-historique`, `4-14-relier-les-affirmations-aux-sources`, `4-15-empêcher-la-divulgation-de-ressources-non-autorisées` et `4-16-vérifier-la-qualité-et-l-abstention-de-l-assistant` restent en backlog.

La limitation au sprint 7 a été confirmée par Dylan. Après sa validation, seul le plan est complété avec les trois améliorations ; les stories et le suivi restent inchangés. `epic-4-retrospective` reste `optional` pour ne pas confondre ce bilan partiel avec une rétrospective de l'epic complet.

## Questions ouvertes

- La nuance précise de mauve pâle sera vérifiée visuellement avec Dylan pendant la réalisation ; le périmètre des écrans est confirmé.
