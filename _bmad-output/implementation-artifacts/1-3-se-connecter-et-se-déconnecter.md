---
story: 1-3-se-connecter-et-se-déconnecter
title: Se connecter et se déconnecter
epic: 1
sprint: 1
status: done
baseline_commit: 94587fa0bc59a46978047be93912736a6563229c
---

# Story 1.3 : Se connecter et se déconnecter

## Récit utilisateur

En tant que membre, je veux me connecter à mon compte et me déconnecter afin de retrouver mon espace sans le laisser ouvert aux autres.

## Critères d'acceptation

1. Étant donné que j'utilise un compte valide, quand je me connecte, alors une session est ouverte et je peux accéder à l'espace protégé.
2. Étant donné que j'utilise des identifiants invalides, quand je tente de me connecter, alors un message compréhensible s'affiche sans révéler si le compte existe.
3. Étant donné que je suis connecté, quand je me déconnecte, alors les pages protégées ne sont plus accessibles et une tentative d'ouverture me ramène vers la connexion.

## Limites de la story

Cette story couvre l'ouverture et la fermeture de session. Le contenu du tableau de bord protégé est défini dans la story 1.4.
