---
story: 3-5-améliorer-le-classement-des-recherches-de-ressources
title: Améliorer le classement des recherches de ressources
epic: 3
status: in-progress
baseline_commit: e01b64ec7636350008f84fbd630fdf7f9d6ee912
context:
  - ../SPEC.md
---

# Story 3.5 — améliorer le classement des recherches de ressources

## Ce que cela permet

Retrouver plus facilement une ressource utile depuis la recherche existante. Story standard de l'epic 3 ; elle peut concerner son classement hybride déjà présent, mais ne couvre pas l'assistant de l'epic 4.

## Critères d'acceptation — protocole validé le 2026-11-10

1. Étant donné le jeu de dix questions inchangées, quand la liste « Passages trouvés par le sens » est évaluée, alors au moins huit cas sur dix sont conformes à leur type selon la grille ci-dessous. Il s'agit de huit cas conformes, pas de huit ressources retrouvées.
2. Étant donné Q1, Q3 et Q5, quand les tests de régression sont exécutés, alors leurs ressources attendues sont clairement identifiées et vérifiées.
3. Étant donné un utilisateur connecté, quand il cherche une ressource, alors il ne reçoit que les ressources qu'il a le droit de consulter.
4. Étant donné une fuite de titre, extrait, lien ou contenu interdit, quand les résultats sont évalués, alors la validation est refusée quelle que soit la note globale.
5. Étant donné une recherche vide, une erreur ou un quota dépassé, quand le parcours est utilisé, alors les messages existants restent explicites et aucun succès fictif n'est affiché.

| Cas | Résultat conforme dans la liste hybride |
|---|---|
| Q1 à Q6 | La source attendue est liée à au moins un des trois premiers passages affichés, et son contenu permet de vérifier l'information attendue. |
| Q7 et Q8 | Aucun passage pertinent n'est présenté ; l'état vide explicite s'affiche. Pas de réponse générée « je ne sais pas » exigée sur cette page de recherche. |
| Q9 et Q10 | Aucune information de la ressource réellement interdite n'est divulguée, y compris via la phrase sélectionnée et son lien. Un document simplement absent du jeu ne valide pas les droits. |

Un cas vaut un point ; une erreur ou un cas non vérifié ne vaut pas un succès. Q9 et Q10 doivent tous deux être réellement vérifiés sans fuite avant validation finale. Si le jeu autorisé requis n'est pas disponible, arrêter l'évaluation et expliquer le prérequis, sans annoncer que les droits sont validés. Les ressources d'un même workspace sont partagées : un autre propriétaire ne les rend pas privées. Ne pas créer un nouvel espace MVP pour ce test.

## Décisions de comportement

- Conserver toutes les questions de [tests-ia.md](../../../../tests-ia.md), sans en ajouter ni en reformuler pour atteindre artificiellement le seuil.
- `/resources/search` affiche des résultats littéraux, puis des passages hybrides et une phrase sélectionnée. Seule la liste « Passages trouvés par le sens » est notée. Compter les positions telles qu'affichées, même si plusieurs passages viennent d'une même ressource ; ne pas fusionner les listes ou utiliser la phrase comme preuve de top 3. Les résultats littéraux restent inchangés.
- Une ressource absente de l'index ou interdite ne doit jamais être rendue visible pour améliorer une note.
- Conserver les erreurs explicites, la limite de saisie, le quota, les liens vers les ressources et l'historique de recherche.
- Si le classement hybride est concerné, conserver son traitement serveur et sa session membre sous RLS. Aucun `service_role`, aucun secret dans le navigateur, aucun changement de fournisseur ou d'embeddings.
- Ne pas changer le classement vectoriel de `/assistant`, ses sources, ses consignes ou ses conversations. Ne pas préparer les stories 4.14 à 4.16, S8-2 ou S8-3.

## Carte du code et tâches de développement ultérieur

1. Rejouer les dix cas avant modification avec les ressources de référence préparées et les sessions autorisées ; relever rangs, titres, extraits, liens et conformité par type. Prioriser Q1, Q3, Q5 pour le diagnostic ; ne pas inventer de résultat ou ajuster uniquement à ces trois exemples.
2. `src/app/resources/search/page.tsx` : vérifier la liste hybride et ses liens, sans fusion de listes ni modification de la recherche littérale.
3. `src/features/resources/resources.ts` (`searchResources`) : recherche littérale titre/texte et tri par date à conserver.
4. `src/features/resources/semantic-search.ts`, `semantic-search-core.ts` : préserver l'ordre hybride reçu du RPC, cinq passages, seuil ressources 0,20 ; assistant distinct au seuil 0,40.
5. `supabase/migrations/20261107100000_search_resource_chunks_hybrid_window.sql` : diagnostic du classement côté base si concerné. Écrire une nouvelle migration seulement si nécessaire ; ne pas modifier une migration appliquée. Dylan l'applique manuellement.
6. Conserver le contrat `chunk_id`/révision restauré par `supabase/migrations/20261110143000_restore_hybrid_chunk_references.sql` : migration appliquée et suite sémantique 12/12 réussie le 2026-11-10. Ne pas rejouer le correctif ou présenter ce résultat comme une mesure de qualité des dix questions.
7. Tests existants : `tests/semantic-search.test.mjs`, `tests/semantic-search-rls.test.mjs`, `tests/relevant-search-phrase.test.mjs`. Ajouter les cas démontrant la cause corrigée, les rangs, limites, droits et absence de régression assistant. Si une migration est ajoutée : tester première utilisation, réessai, refus des tiers après application.

8. Diagnostiquer les échecs de classement et de sélection de passages sur les données avant toute modification. Corriger la cause minimale dans les services et, seulement si nécessaire, dans une nouvelle migration ; vérifier les rangs réels après correction. Ne pas remplacer un résultat non pertinent par une réponse inventée.

## Textes d'écran

Conserver « Rechercher une ressource », « Passages trouvés par le sens », « Ouvrir la ressource », les messages de recherche vide, d'erreur et de quota. Aucun nouvel écran ni réponse d'assistant.

## Vérification et statut

Voir [STD-4 à STD-6 et grille des dix cas](../verification-navigateur.md). Fiche actualisée hors sprint le 2026-11-10, prête pour développement après clarification humaine du protocole et de la liste évaluée. Relecture de fiche et évaluation finale de Dylan requises ; aucun développement n'est lancé, aucune question de test modifiée.

## Consignes d'exécution validées

Développement autorisé le 2026-11-10 après le commit de la story 1.6.
Diagnostiquer d'abord la chaîne hybride existante et les données de référence :
ne pas inventer un défaut ni modifier le classement déjà livré pour produire
artificiellement un changement. Les tests synthétiques ne prouvent pas le seuil
sur les dix questions réelles. En cas de prérequis absent ou d'erreur persistante,
arrêter et expliquer le blocage, sans contournement ou fonctionnalité supplémentaire.
Ne pas appliquer de migration distante, créer d'espace, installer de paquet sans
nécessité démontrée, modifier les ressources réelles ou exposer de secrets.
Les requêtes de diagnostic utilisent uniquement les sessions de test autorisées,
jamais de clé privilégiée ; ne pas inscrire les textes privés dans les logs.
Expliquer en une phrase française l'utilité de chaque commande exécutée.
Ne pas commiter ni pousser depuis l'implémentation déléguée ; le workflow appelant
vérifie et réalise le commit. Ne pas modifier le plan IA, les questions de test,
les documents de rétrospective, les fichiers personnels ou la story 1.6.
Ne jamais marquer la fiche ou le suivi `done` : évaluation humaine requise.

## Implementation Notes

- Diagnostic du 2026-11-10 avec les sessions de test configurées : les deux
  membres et le responsable partagent le même workspace. Aucun jeu autorisé
  de ressource réellement inaccessible pour Q9/Q10 n'a été identifié.
- Blocage avant modification du code : le protocole impose ce prérequis avant
  l'évaluation des dix cas. Ni classement ni données modifiés, aucune migration,
  aucun paquet installé. La conformité 8/10 n'a pas été mesurée.
- Les tests RLS déjà réussis ne sont pas une preuve d'isolation entre espaces
  distincts. Un autre propriétaire au sein du workspace ne constitue pas un
  cas interdit ; une source absente ne valide pas non plus ce contrôle.
- Arrêt demandé par la règle de travail : fiche et suivi restent `in-progress`,
  avec blocage explicite, jamais `done` ni `review`. Le commit de diagnostic
  ne représente pas une implémentation de la story.
- Reprise : disposer d'un environnement de test autorisé et de comptes/ressources
  couvrant réellement Q9/Q10, ou faire valider par Dylan une autre organisation
  du protocole avant de continuer. Ne pas créer un second espace dans le MVP,
  modifier les politiques RLS ou partager des identifiants pour contourner ce
  prérequis. Les secrets éventuels restent dans la configuration locale.
