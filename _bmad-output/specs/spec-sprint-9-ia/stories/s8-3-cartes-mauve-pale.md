---
story: s8-3
title: Distinguer les cartes avec un fond mauve pâle
sprint: 9
type: ux
status: ready-for-dev
context:
  - ../SPEC.md
  - ../conventions.md
---

# Complément S8-3 — cartes mauve pâle

Transféré dans les fiches actives du sprint 9 le 2026-11-11. L'identifiant S8-3,
les cinq critères et le périmètre validé sont conservés ; aucune copie active
ne reste dans le sprint 8. Préparation seulement, aucun développement.

## Ce que cela permet

Reconnaître les blocs d'information sur le fond blanc sans changer leur contenu.

## Critères d'acceptation

1. Étant donné la liste Ressources et les résultats par mots-clés ou par sens, quand ils s'affichent, alors leurs cartes ont un fond mauve pâle distinct de la page blanche.
2. Étant donné une réponse et ses sources, sur Assistant ou dans une conversation rouverte, quand elles sont affichées, alors les blocs correspondants partagent cette distinction.
3. Étant donné texte, liens, boutons et focus, quand ils sont sur le mauve, alors les contrastes WCAG 2.2 AA sont respectés : texte normal au moins 4,5:1, grand texte et composants concernés au moins 3:1.
4. Étant donné une erreur, un succès ou une absence de réponse, quand son message apparaît, alors sa couleur et son libellé restent distincts ; aucun contenu n'est distingué uniquement par la couleur.
5. Étant donné mobile ou zoom 200 %, quand les cartes sont consultées, alors aucune information ou action essentielle n'est perdue ni déborde horizontalement.

## Décisions de comportement

- Validé : liste ressources, résultats recherche, réponse et sources assistant ; fond global blanc.
- Proposition visuelle pour relecture : réutiliser `#f3edf8`, déjà présent dans le thème, et vérifier les contrastes réellement rendus.
- Appliquer des classes ciblées, pas une recoloration globale de `.category-entry` qui changerait des écrans non demandés.
- Couvrir aussi les réponses historiques de 4.11 ; ne pas changer boutons, textes, ordre de résultats ni comportement des formulaires.

## Carte du code et tâches

- `src/app/globals.css` : style de carte ciblé réutilisé sur les surfaces concernées.
- `src/app/resources/page.tsx`, `src/app/resources/search/page.tsx`, `src/features/assistant/assistant-form.tsx` et affichage des conversations : classes ciblées.
- Vérifier visuellement chaque surface, contraste calculé, clavier, mobile et zoom ; garder les tests de contenu/liens.
- Mettre à jour `DESIGN.md` pour consigner le traitement visuel validé lors du développement.
- `src/app/assistant/conversations/[id]/page.tsx` : traiter séparément cartes de
  réponse et sources, sans recolorer toutes les questions ni les confirmations.
- Ajouter un test de non-régression du rendu des cartes concernées, enregistré
  dans le runner si nouveau fichier. Les vérifications statiques de classe ne
  remplacent pas le contrôle navigateur des couleurs calculées.

## Vérification

Scénario S9-J de [tests-ia.md](../../../../tests-ia.md). Dépend de S8-2 pour valider la distinction finale catégories/ressources.

Mesurer et consigner les ratios sur les couleurs effectivement calculées :
texte courant 4,5:1 minimum ; grand texte et composants/focus concernés 3:1.
Tester chaque surface sur ordinateur et à 320 pixels de largeur, clavier et
zoom 200 %. Conserver affichages vide/erreur/succès/abstention et sources
indisponibles, sans statut porté par la couleur seule.

Tests ciblés de rendu et de contenu/liens, lint, TypeScript et build ; pas
d'appel IA supplémentaire nécessaire pour comparer des styles sur données de test.
Un commit de livraison, puis évaluation visuelle de Dylan. L'epic IA ne peut
être clôturé qu'après acceptation des stories restantes, pas à la préparation.
