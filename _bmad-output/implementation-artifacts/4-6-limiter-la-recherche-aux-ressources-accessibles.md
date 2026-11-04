---
story: 4-6-limiter-la-recherche-aux-ressources-accessibles
title: Limiter la recherche aux ressources accessibles
epic: 4
sprint: 6
status: ready-for-dev
---

# Story 4.6 : Limiter la recherche aux ressources accessibles

## Récit utilisateur

En tant que membre, je veux que la recherche sémantique respecte mes droits d'accès, afin de ne jamais voir des contenus qui ne me sont pas accessibles.

## Critères d'acceptation

1. Étant donné que je suis connecté comme membre, quand j'effectue une recherche sémantique, alors les résultats ne contiennent que les ressources auxquelles j'ai accès.
2. Étant donné qu'une ressource n'est pas accessible au membre, quand les tests exécutent la recherche sémantique avec sa session Supabase et RLS active, alors aucun passage de cette ressource n'est retourné ni transmis au modèle ; le test n'utilise pas de clé de service pour contourner RLS.
3. Étant donné qu'une recherche sémantique échoue, quand je consulte l'écran de recherche, alors un message compréhensible s'affiche et ma requête peut être relancée.

## Limites de la story

Vérification et durcissement des droits sur la recherche des stories 4.4 et 4.5, plus gestion de l'échec. Dépend des stories 4.4 et 4.5. Aucune génération de réponse (sprint 7).

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Le filtre repose sur la RLS de Supabase (session du membre), pas sur un filtre écrit à la main côté serveur : un seul mécanisme, impossible à contourner par oubli.
- [ ] Un membre d'un autre espace n'obtient aucun passage, aucun titre et aucun indice de l'existence d'une ressource inaccessible.
- [ ] Les ressources « en cours » ou « en échec » ne sont jamais retournées (déjà garanti par la migration `20261104100000`).
- [ ] Échec (OpenAI ou Supabase indisponible) : message simple sans détail technique, la question reste dans le champ et le bouton « Rechercher » permet de relancer ; aucune relance automatique.
- [ ] Pas d'appel à OpenAI pour une question vide ou trop longue.
- [ ] Les erreurs sont journalisées côté serveur sans la clé ni le texte complet de la question.

## Textes d'écran

- Message d'échec : « La recherche par le sens n'a pas pu aboutir. Réessayez dans un instant. »

## Notes pour le développement

- Architecture : AD-5 (retrouver et répondre avec le même contexte autorisé, tests avec RLS active, sans clé de service), AD-3.
- Test d'intégration dans `tests/` : avec les comptes de test (membre A dans l'espace de la ressource, membre d'un autre espace si disponible, sinon vérification par lecture directe RLS), la fonction `search_resource_chunks` n'est appelée qu'avec une session utilisateur ; vérifier qu'aucun passage d'une ressource inaccessible n'est retourné. Vérifier aussi qu'une ressource `failed`/`processing` n'est pas retournée.
- Test unitaire : en cas d'erreur de la recherche ou d'OpenAI, la page reçoit un résultat d'échec, pas une exception ni une liste vide trompeuse.
- Vérifier par recherche dans le code qu'aucun usage de `service_role` n'est ajouté.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Avec un membre d'un autre espace, les questions 9 et 10 de `tests-ia.md` ne montrent aucun passage ni titre des documents inaccessibles.
- [ ] Avec le bon membre, les passages de ses ressources accessibles sont trouvés.
- [ ] Avec une clé OpenAI volontairement incorrecte, le message d'échec s'affiche et la recherche peut être relancée.
- [ ] Les accents s'affichent correctement.
