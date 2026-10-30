---
story: 2-2-parcourir-et-ouvrir-une-ressource
title: Parcourir et ouvrir une ressource
epic: 2
sprint: 2
status: ready-for-dev
---

# Story 2.2 : Parcourir et ouvrir une ressource

## Récit utilisateur

En tant que membre, je veux parcourir les ressources partagées et ouvrir leur contenu, afin de lire les informations utiles à l'équipe.

## Critères d'acceptation

1. Étant donné qu'une ressource existe, quand je consulte la liste, alors je vois son titre, sa catégorie et sa date de mise à jour.
2. Étant donné que j'ouvre une ressource, quand son détail s'affiche, alors je peux lire son titre, son texte, sa catégorie et sa date de mise à jour.
3. Étant donné qu'aucune ressource n'existe, quand j'ouvre la liste, alors l'écran explique clairement qu'elle est vide et ne propose l'ajout qu'aux personnes autorisées.

## Limites de la story

Lecture seule : pas de création, modification, suppression ni filtre (stories 2.3 à 2.6). Pas de recherche ni d'IA.

## Notes pour le développement

- Architecture : AD-2, AD-3, AD-4. Cette story crée la table `resources` (titre, texte, catégorie, propriétaire, workspace, dates) par migration versionnée, avec RLS : lecture pour tout membre connecté du workspace, privilèges `anon` révoqués. Ne pas ajouter les colonnes d'indexation (état, révision) : elles relèvent de l'Epic 4.
- La page est protégée (redirection vers `/login` sans session). Server Components pour la lecture, avec la session de la personne.
- Contrainte de test : la création arrive en story 2.3. Pour vérifier la liste non vide, la fiche de test indique comment insérer une ressource d'essai depuis le SQL Editor de Supabase. Cette action est à confirmer avec Dylan avant de commencer.
- Accessibilité : liste et détail utilisables au clavier, focus visible, état vide annoncé clairement.
- Dépend de la story 2.1 (table `categories`).
