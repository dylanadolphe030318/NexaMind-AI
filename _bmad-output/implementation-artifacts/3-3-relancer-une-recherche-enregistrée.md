---
story: 3-3-relancer-une-recherche-enregistrée
title: Relancer une recherche enregistrée
epic: 3
sprint: 4
status: done
---

# Story 3.3 : Relancer une recherche enregistrée

## Récit utilisateur

En tant que membre, je veux rouvrir une recherche de mon historique, afin de retrouver les ressources correspondantes sans ressaisir ma requête.

## Critères d'acceptation

1. Étant donné qu'une recherche est enregistrée dans mon historique, quand je la sélectionne, alors l'application réaffiche sa requête et relance la recherche.
2. Étant donné que je rouvre une recherche, quand les résultats sont chargés, alors ils correspondent aux ressources accessibles au moment de la réouverture.
3. Étant donné que la recherche ne retourne plus de résultat, quand les résultats s'affichent, alors l'écran indique qu'aucun résultat n'a été trouvé et me permet de modifier la requête.

## Limites de la story

Aucune IA. Les résultats sont recalculés à chaque réouverture, jamais conservés. Pas de nouvelle table.

## Textes d'écran

- Chaque requête de l'historique devient un lien vers `/resources/search?q=<requête>`.
- Résultats : même page et mêmes textes que la story 3.1 (« Aucun résultat… » neutre, champ modifiable).
- Relancer une recherche depuis l'historique l'enregistre comme une nouvelle recherche récente (chaque recherche lancée est une entrée distincte, règle de la story 3.2).

## Notes pour le développement

- Réutiliser la page de recherche de la story 3.1 : le lien pré-remplit le champ et lance la recherche, sans nouvelle logique de recherche.
- Requête encodée dans l'adresse (pas de HTML injecté, affichage en texte).
- Règle de fin de story : accents et ton des messages vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Cliquer sur une requête de l'historique : le champ affiche la requête et les résultats s'affichent.
- [ ] Modifier une ressource ou en supprimer une, relancer : les résultats reflètent l'état actuel.
- [ ] Relancer une requête qui n'a plus de résultat : message « aucun résultat » et champ modifiable.
- [ ] Les accents s'affichent correctement.
