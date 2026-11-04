---
story: 4-5-afficher-les-extraits-des-passages-retrouvés
title: Afficher les extraits des passages retrouvés
epic: 4
sprint: 6
status: ready-for-dev
---

# Story 4.5 : Afficher les extraits des passages retrouvés

## Récit utilisateur

En tant que membre, je veux lire un extrait de chaque passage retrouvé et ouvrir sa ressource, afin de vérifier rapidement si le résultat est utile.

## Critères d'acceptation

1. Étant donné que des passages pertinents sont retrouvés, quand je consulte les résultats, alors chaque résultat affiche un extrait du passage et le titre de la ressource correspondante.
2. Étant donné que je sélectionne un résultat, quand je l'ouvre, alors j'accède à la ressource correspondante.
3. Étant donné que la recherche ne retourne aucun passage pertinent, quand les résultats s'affichent, alors un état vide clair me permet de modifier la requête.

## Limites de la story

Affichage des résultats de la story 4.4. Dépend de la 4.4. Pas de génération de réponse ni de citation par le LLM (sprint 7).

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Où : sur la page de recherche existante (`/resources/search`), dans un bloc « Passages trouvés par le sens » placé sous les résultats par mots-clés. La recherche par mots-clés reste inchangée.
- [ ] Un seul formulaire : la même question lance les deux recherches.
- [ ] Chaque résultat montre : titre de la ressource, extrait d'environ 200 caractères coupé proprement, lien « Ouvrir la ressource » vers `/resources/{id}`.
- [ ] Le score de proximité n'est pas affiché.
- [ ] L'historique des recherches récentes (Epic 3) n'est pas modifié.

## Textes d'écran

- Titre du bloc : « Passages trouvés par le sens ».
- Lien : « Ouvrir la ressource ».
- État vide : « Aucun passage pertinent n'a été trouvé. Reformulez votre question avec d'autres mots et relancez la recherche. »

## Notes pour le développement

- Modifier `src/app/resources/search/page.tsx` pour appeler la fonction de la story 4.4 et afficher le bloc ; réutiliser les classes CSS existantes (`category-list`, `resource-excerpt`, `resource-link`).
- Extrait : fonction pure testable, sans couper un mot, avec « … » si le passage est tronqué.
- Tests : extrait court/long, titre affiché, lien correct, état vide.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Chaque résultat montre titre, extrait et « Ouvrir la ressource ».
- [ ] Le lien ouvre la bonne ressource.
- [ ] Une question sans passage pertinent affiche l'état vide.
- [ ] La recherche par mots-clés fonctionne comme avant.
- [ ] Les accents s'affichent correctement.
