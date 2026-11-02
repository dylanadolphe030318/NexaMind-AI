---
story: 2-7-lire-et-renommer-clairement-les-catégories
title: Lire et renommer clairement les catégories
epic: 2
sprint: 5
status: ready-for-dev
---

# Story 2.7 : Lire et renommer clairement les catégories

## Récit utilisateur

En tant que responsable, je veux une page des catégories où chaque nom se distingue de l'action de renommage, afin de renommer une catégorie sans me tromper de ligne ni de bouton.

## Critères d'acceptation

1. Étant donné que j'ouvre la page des catégories, quand la liste s'affiche, alors chaque catégorie présente son nom en évidence, une seule fois, et l'action de renommage est visuellement distincte du nom.
2. Étant donné que je suis responsable, quand je choisis de renommer une catégorie, alors une seule zone de renommage est ouverte à la fois, elle indique clairement la catégorie concernée et propose d'enregistrer ou d'annuler.
3. Étant donné que je suis membre, quand j'ouvre la page des catégories, alors je vois les noms sans aucune action de renommage.
4. Étant donné que je renomme une catégorie, quand j'enregistre, alors le comportement de la story 2.1 est inchangé (nouveau nom affiché partout, refus RLS pour un membre) ; aucune règle d'accès ni migration n'est modifiée.

## Limites de la story

Mise en forme de la page existante uniquement. Pas de suppression, de tri ni de nouvelle règle de catégorie. Aucune migration.

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Renommage : le nom s'affiche en texte seul ; un bouton « Renommer » par ligne ouvre une zone de saisie pour cette ligne seulement.
- [ ] Ouvrir le renommage d'une autre ligne ferme la zone déjà ouverte (sans enregistrer).
- [ ] « Annuler » ferme la zone et garde l'ancien nom.
- [ ] Nom vide, trop long ou déjà utilisé : mêmes règles et mêmes messages que la story 2.1 (pas de nouvelle règle).
- [ ] Tri et état vide de la liste : inchangés.

## Textes d'écran

- Bouton par ligne (responsable seulement) : « Renommer ».
- Zone de renommage : titre « Renommer la catégorie « {nom} » », champ prérempli, boutons « Enregistrer » et « Annuler ».
- Messages d'erreur et de succès : ceux de la story 2.1, inchangés.

## Notes pour le développement

- Fichiers concernés : `src/features/resources/category-forms.tsx` (`RenameCategoryForm`, lignes ~56-92 : libellé « Renommer {nom} » répété + bouton) et `src/features/resources/category-list.tsx`, page `src/app/categories/page.tsx`.
- Architecture : convention « Présentation des listes éditables » (un nom affiché n'est jamais répété par son action ; une seule zone ouverte ; actions du responsable non rendues pour un membre). RLS reste juge.
- Ne pas toucher à `renameCategory` (`actions.ts`) ni aux migrations.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Compte responsable : chaque nom apparaît une seule fois, en évidence ; « Renommer » est un bouton distinct.
- [ ] Ouvrir deux renommages à la suite : une seule zone reste ouverte.
- [ ] Enregistrer un nouveau nom : il s'affiche partout (liste des ressources, filtres).
- [ ] « Annuler » : l'ancien nom reste.
- [ ] Compte membre : aucun bouton de renommage.
- [ ] Les accents s'affichent correctement.
