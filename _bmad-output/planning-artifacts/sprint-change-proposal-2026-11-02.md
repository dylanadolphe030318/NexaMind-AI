---
date: 2026-11-02
scope: minor
status: approved
---

# Proposition de changement de sprint — Catégories lisibles et décisions validées

## 1. Résumé du problème
Rétrospective du sprint 4 :
- Page des catégories : le nom de la catégorie et l'option « Renommer » se confondent ; l'option se répète sur chaque ligne (`src/features/resources/category-forms.tsx`).
- Deux comportements de la story 3.2 (doublons de recherche, recherche vide) avaient été décidés par le développeur sans validation et ont dû être corrigés après les tests (`230153d`, `088ebb3`).

## 2. Analyse d'impact
- Code : mise en forme seulement (page des catégories). Aucune migration, aucune règle d'accès modifiée.
- Plan : une story ajoutée (2.7). Les stories 4.x ne changent pas. L'IA (action 3 proposée) est écartée par Dylan pour cette rétrospective.

## 3. Documents mis à jour
- `epics.md` : story 2.7 ajoutée à l'epic 2 ; sprint 5 = 2.7, 4.1, 4.2, 4.3.
- PRD : FR-4 (lisibilité du renommage) et section 6 (règles de comportement validées avant le développement).
- Architecture : deux conventions (décisions de comportement ; présentation des listes éditables).
- Expérience : composant « Liste de catégories ».
- Suivi de sprint : `2-7-lire-et-renommer-clairement-les-catégories` en `backlog`, epic 2 repassé `in-progress`.
- Fiches de story : la fiche 2.7 sera créée à la préparation du sprint 5, avec la rubrique « Décisions de comportement » à faire valider par Dylan avant le développement.

## 4. Approche recommandée
Ajout d'une petite story (2.7) plutôt que de rouvrir la story 2.1 terminée. Elle passe en premier dans le sprint 5.

## 5. Passation
Périmètre mineur : fiche à préparer, puis mise en œuvre par le développeur, un commit.
