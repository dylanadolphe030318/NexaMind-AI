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

Filtre par une seule catégorie sur la liste existante. Pas de recherche par mots-clés (story 3.1), pas de nouvelle table : la lecture reste sous la session du membre et RLS.

## Notes pour le développement

- Architecture : AD-1 et AD-2. Le filtre vit dans l'adresse de la page (paramètre de requête), lu par le Server Component de la liste ; une catégorie inconnue ou invalide affiche la liste complète ou un état vide clair, sans erreur technique.
- Accessibilité : le filtre est utilisable au clavier, son état actif est annoncé, le nom de la catégorie est toujours écrit en toutes lettres.
- Dépend des stories 2.1 et 2.2.
