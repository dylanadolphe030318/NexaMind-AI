---
story: 2-5-filtrer-les-ressources-par-catégorie
title: Filtrer les ressources par catégorie
epic: 2
sprint: 3
status: ready-for-dev
---

# Story 2.5 : Filtrer les ressources par catégorie

## Récit utilisateur

En tant que membre, je veux filtrer la liste des ressources par catégorie, afin de retrouver plus facilement les informations d'un même sujet.

## Critères d'acceptation

1. Étant donné que des ressources sont classées, quand je choisis une catégorie, alors la liste affiche uniquement les ressources de cette catégorie.
2. Étant donné qu'un filtre est actif, quand je le réinitialise, alors toutes les ressources partagées réapparaissent.
3. Étant donné qu'une catégorie est affichée, quand je consulte la liste, alors son nom est visible et la couleur seule ne sert pas à l'identifier.

## Limites de la story

Filtre par une seule catégorie à la fois. Pas de recherche par mots (story 3.1), pas de pagination, pas de nouvelle table ni de migration.

## Notes pour le développement

- Architecture : lecture côté serveur avec la session de la personne ; la RLS existante sur `resources` et `categories` suffit. Aucune migration attendue.
- Le filtre passe dans l'adresse de la page (ex. `/resources?category=<id>`) pour pouvoir être partagé et réinitialisé par un simple lien « Toutes les catégories ». Valider l'identifiant (format UUID) côté serveur ; un identifiant inconnu affiche un état vide clair, pas une erreur.
- Réutiliser `src/features/resources/resources.ts` et la page `src/app/resources/page.tsx` (cartes avec pastille de catégorie déjà en place).
- Le filtre est un choix par liens ou boutons radio avec libellés écrits, utilisable au clavier ; la catégorie sélectionnée est indiquée par du texte (« sélectionnée »), pas par la couleur seule.
- Règle de fin de story (rétro sprint 2) : accents vérifiés dans le navigateur ; entités HTML seulement dans le texte JSX.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Choisir une catégorie : seules ses ressources s'affichent.
- [ ] Cliquer sur « Toutes les catégories » : toutes les ressources réapparaissent.
- [ ] Le nom de la catégorie est écrit sur chaque carte et dans le filtre.
- [ ] Une catégorie sans ressource affiche un message clair.
- [ ] Les accents s'affichent correctement.
