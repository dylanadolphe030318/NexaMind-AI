---
story: 1-2-créer-un-compte-membre
title: Créer un compte membre
epic: 1
sprint: 1
status: done
baseline_commit: 7d9d269a772be4e52d2febcafe3a383950facdbd
---

# Story 1.2 : Créer un compte membre

## Récit utilisateur

En tant que visiteur, je veux créer un compte membre afin de rejoindre l'espace de travail.

## Critères d'acceptation

1. Étant donné que les informations requises sont valides, quand je soumets le formulaire, alors un compte utilisable est créé avec Supabase Auth.
2. Étant donné que je m'inscris depuis l'application, quand mon compte est créé, alors son rôle est « membre » et le formulaire ne me permet pas de choisir le rôle responsable.
3. Étant donné qu'une information obligatoire manque ou que l'inscription échoue, quand le formulaire est envoyé, alors un message compréhensible indique quoi faire et les informations déjà saisies restent présentes.

## Limites de la story

Cette story crée uniquement des comptes membres. L'attribution d'un rôle responsable et la gestion des ressources ne sont pas incluses.
