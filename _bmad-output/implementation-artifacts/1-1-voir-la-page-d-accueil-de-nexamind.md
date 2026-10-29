---
story: 1-1-voir-la-page-d-accueil-de-nexamind
title: Voir la page d'accueil de NexaMind
epic: 1
sprint: 1
status: done
baseline_commit: 2ac8f9074d108f6b4ad24d962e518e560dec3651
---

# Story 1.1 : Voir la page d'accueil de NexaMind

## Récit utilisateur

En tant que visiteur, je veux voir une page d'accueil claire afin de comprendre le service et de commencer à créer un compte ou à me connecter.

## Critères d'acceptation

1. Étant donné que j'ouvre l'adresse de l'application, quand la page d'accueil se charge, alors je vois le nom « NexaMind AI » et une courte présentation du service.
2. Étant donné que je consulte la page d'accueil, quand je cherche comment accéder au service, alors je trouve des liens clairement nommés pour créer un compte et me connecter.
3. Étant donné que j'ouvre l'application sur un écran mobile de 375 px ou un écran d'ordinateur de 1280 px, quand la page s'affiche, alors son contenu ne provoque pas de défilement horizontal.

## Limites de la story

Cette story couvre la page publique et ses liens d'accès. La création de compte, la connexion et le tableau de bord sont traités dans les stories suivantes.

## Review Triage Log

| Finding | Verdict | Evidence and route |
|---|---|---|
| Vérification du responsive limitée aux tests automatisés | false | Le navigateur a été vérifié sur la page en direct à 375 px et 1280 px ; `scrollWidth` ne dépasse pas `innerWidth` aux deux tailles. La story exige le comportement, pas un test automatisé dédié. |
| Les liens d'inscription et de connexion aboutissent à des routes absentes | medium | `src/app/page.tsx` pointe vers `/signup` et `/login`, mais aucun fichier de route correspondant n'existe dans `src/app`. Les parcours d'inscription et de connexion sont réservés aux stories suivantes ; différé hors de cette story. |
