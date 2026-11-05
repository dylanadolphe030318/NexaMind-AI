---
story: s8-3
title: Distinguer les cartes avec un fond mauve pâle
sprint: 9
type: ux
status: ready-for-dev
context:
  - ../SPEC.md
---

# Complément S8-3 — cartes mauve pâle

Reporté au sprint 9 pour respecter la limite de cinq stories par sprint. L'identifiant S8-3 est conservé ; cette fiche n'appartient plus au manifeste du sprint 8.

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

## Vérification

Scénario S9-J de [tests-ia.md](../../../../tests-ia.md). Dépend de S8-2 pour valider la distinction finale catégories/ressources.
