---
story: 1-5-voir-son-rôle-dans-l-espace-membre
title: Voir son rôle dans l'espace membre
epic: 1
sprint: 4
status: ready-for-dev
---

# Story 1.5 : Voir son rôle dans l'espace membre

## Récit utilisateur

En tant que membre connecté, je veux voir mon rôle (Membre ou Responsable) sur mon tableau de bord, afin de savoir ce que je peux faire sans consulter Supabase.

## Critères d'acceptation

1. Étant donné que je suis connecté, quand le tableau de bord s'affiche, alors j'y lis mon rôle écrit en toutes lettres (« Membre » ou « Responsable »), à côté de mon identité.
2. Étant donné que mon rôle a été changé dans la base pendant que je suis connecté, quand je recharge le tableau de bord ou j'ouvre la page des catégories, alors mon nouveau rôle et les actions qui lui correspondent sont pris en compte sans me déconnecter.
3. Étant donné que le rôle s'affiche, quand je le consulte, alors il vient du profil lu côté serveur avec ma session et je ne peux pas le modifier depuis l'application.

## Limites de la story

Affichage uniquement : pas de gestion des rôles, pas de changement de rôle dans l'application, aucune migration. Origine : proposition de changement `sprint-change-proposal-2026-11-01.md`.

## Textes d'écran

- Ligne d'identité existante : « Connecté en tant que <e-mail> ».
- Nouvelle ligne, ton neutre (pas de rouge) : « Votre rôle : Membre » ou « Votre rôle : Responsable ».
- Si le profil est introuvable : « Votre rôle : non disponible » (neutre, sans message d'erreur technique).

## Notes pour le développement

- Lire `profiles.role` côté serveur dans `src/app/dashboard/page.tsx` avec la session de la personne (aucune clé privilégiée), à chaque rendu : ne pas le stocker dans un cookie ni dans la session.
- Vérifier le critère 2 : si le rôle ne se met pas à jour au rechargement, chercher la cause (cache de pages) et corriger seulement ce point.
- Ne pas copier la logique de rôle : réutiliser une fonction commune si elle existe déjà.
- Règle de fin de story : accents et ton des messages vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Connecté en membre : « Votre rôle : Membre » s'affiche sur le tableau de bord.
- [ ] Connecté en responsable : « Votre rôle : Responsable » s'affiche.
- [ ] Promouvoir un membre par SQL (étapes du README) sans le déconnecter, recharger la page : le rôle passe à « Responsable » et la page des catégories propose la gestion.
- [ ] Les accents s'affichent correctement et la ligne n'est pas en rouge.
