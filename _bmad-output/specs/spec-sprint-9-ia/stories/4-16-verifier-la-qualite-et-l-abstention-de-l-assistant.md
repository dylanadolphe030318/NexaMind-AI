---
story: 4-16-verifier-la-qualite-et-l-abstention-de-l-assistant
title: Vérifier la qualité et l'abstention de l'assistant
epic: 4
sprint: 9
status: ready-for-dev
context:
  - ../SPEC.md
  - ../conventions.md
---

# Story 4.16 — mesurer les réponses et les « je ne sais pas »

## Ce que cela permet

Vérifier sur des questions connues que l'assistant répond avec de vraies preuves
et reconnaît les informations absentes, sans confondre cela avec les droits.

## Critères d'acceptation

1. Étant donné dix questions documentées distinctes D1–D10 du fichier de test,
   avec leurs preuves réellement présentes et accessibles, quand elles sont
   évaluées sur Assistant, alors au moins huit réponses sont correctes et citent
   au moins une source attendue qui appuie les faits. Une abstention, une erreur
   fournisseur ou une citation sans soutien ne compte pas comme réussite.
2. Étant donné les trois questions A1–A3 dont l'information est absente du
   corpus gelé, quand elles sont posées, alors l'assistant s'abstient dans les
   trois cas sans fournir de fait inventé ni de source prétendant le justifier.
3. Étant donné Q1, quand le résultat est relevé, alors les preuves de Next.js
   App Router/TypeScript et de PostgreSQL, authentification, stockage et RLS sont
   notées séparément. Sur Recherche, relever passages/rangs top 3 et phrase/lien
   séparément ; sur Assistant, réponse/affirmations/sources/liens.
4. Étant donné S8-D après Q5, quand la suite sur le numéro est évaluée, alors
   noter séparément numéro 3.1, preuve actuelle et lien ouvrable, puis comparer
   avec la question autonome Q5. Une abstention prudente est sûre, mais pas une
   réponse documentée correcte.
5. Étant donné Q9/Q10, quand le rapport est rédigé, alors les contrôles d'accès
   restent séparés du score documentaire et des trois absences ; un montage
   manquant reste « non vérifié », jamais transformé en réussite.
6. Étant donné la campagne, quand les résultats sont consignés, alors les dix
   réponses et les trois absences sont toutes visibles, datées et liées au même
   corpus préparé, avec réponse observée, source, preuve et verdict ; aucune
   sélection des meilleurs essais ni reprise automatique masquant un échec.
7. Étant donné une donnée ou un environnement manquant, quand la campagne est
   préparée, alors le prérequis est signalé, sans changer les questions pour
   correspondre à ce qui marche ou abaisser les seuils.

## Décisions et périmètre

- Jeu principal : D1–D6 reprennent exactement Q1–Q6 ; D7–D10 ajoutent quatre
  questions documentées distinctes sur membre/responsable/historique/formats.
  Absences A1/A2 reprennent Q7/Q8, A3 ajoute une troisième question.
- Garder Q1–Q10 inchangées. Les 10 questions historiques (6 documentées, 2
  hors sujet, 2 droits) ne sont pas un jeu de 10 questions documentées.
- Préparer et geler les références avant la campagne, via les ressources
  accessibles habituelles. Ne pas confondre document local présent et ressource
  importée/indexée. Aucun import, test réel ou appel IA pendant la préparation.
- Ne pas entraîner le modèle, augmenter les budgets ou substituer la recherche
  de ressources au score Assistant. Un échec entraîne diagnostic et arrêt si
  persistant, pas une fonctionnalité hors sprint.
- Cette story comprend le protocole et sa preuve d'exécution, pas un tableau
  de bord d'évaluation. La validation humaine reste la décision finale.

## Carte du code et tâches de développement/évaluation

- [ ] `tests-ia.md` : exécuter la section sprint 9 sans réécrire les questions ;
  identifier les ressources accessibles et passages attendus avant notation.
- [ ] `README.md` : étapes de campagne, prérequis de migration issus de 4.14/4.15,
  sessions, corpus, modèles et contraintes ; distinguer préparation et résultats.
- [ ] Nouveau rapport
  `_bmad-output/implementation-artifacts/sprint-9-evaluation.md` lors de la
  réalisation : tableau D1–D10/A1–A3, scores explicites 8/10 et 3/3, grilles Q1
  et S8-D, contrôle d'accès séparé, compte rendu des échecs et conditions d'essai.
- [ ] `tests/assistant.test.mjs` et `assistant-conversations.test.mjs` :
  couverture déterministe des abstentions, références invalides et suites ;
  ne pas présenter ces tests comme une évaluation sémantique du fournisseur réel.
- [ ] `_bmad-output/implementation-artifacts/sprint-status.yaml` : consigner
  résultats réels, garder la story en revue et CC-B ouverte jusqu'à évaluation
  de Dylan. Ne pas marquer l'epic terminé pendant que S8-2/S8-3 restent à faire.

## Grille minimale de résultat

| Question | Réponse observée | Source attendue / affichée | Preuve du fait / lien | Verdict |
|---|---|---|---|---|
| D1–D10, une ligne chacune | Texte ou abstention/erreur | Titres et ressource accessibles | Passage probant et lien testé | Réussi / échec / non exécuté |
| A1–A3, une ligne chacune | Abstention ou contenu inventé | Aucune source justificative attendue | Absence contrôlée dans le corpus | Réussi / échec / non exécuté |

Questions non exécutées : campagne incomplète ; ne pas réduire le dénominateur.
Un nouvel essai conserve le résultat initial et le motif du réessai.

## Vérification après réalisation

Assistant : S9-C, D1–D10, A1–A3 et S8-D dans
[tests-ia.md](../../../../tests-ia.md). Recherche : Q1 et Q5 en non-régression,
sans les utiliser comme score de l'assistant. Droits : preuves issues de 4.15.
Les seuils 8/10 et 3/3 sont requis ; ne pas inventer un résultat aujourd'hui.
Après 4.14 et 4.15 évaluées, un commit pour le protocole/résultats, puis arrêt
pour l'évaluation de Dylan avant les deux stories visuelles.
