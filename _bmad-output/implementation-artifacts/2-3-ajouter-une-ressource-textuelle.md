---
story: 2-3-ajouter-une-ressource-textuelle
title: Ajouter une ressource textuelle
epic: 2
sprint: 2
status: in-progress
baseline_commit: c5aac5f04c9d3f2965e4f85e3b47a4d0d56cdf76
---

# Story 2.3 : Ajouter une ressource textuelle

## Récit utilisateur

En tant que membre, je veux saisir ou coller le titre et le texte d'une ressource, puis choisir sa catégorie, afin de partager une information utile avec l'équipe.

## Critères d'acceptation

1. Étant donné que je crée une ressource, quand je saisis ou colle son titre et son texte et choisis une catégorie existante, alors je peux l'enregistrer.
2. Étant donné que l'enregistrement réussit, quand je consulte la liste et le détail, alors la ressource apparaît avec son titre, son texte, sa catégorie et sa date de mise à jour.
3. Étant donné que le titre, le texte ou la catégorie manque, quand je tente d'enregistrer, alors un message indique le champ à corriger sans effacer les autres valeurs ; aucun import de fichier n'est proposé.

## Limites de la story

Saisie texte uniquement : pas d'import de fichier, pas d'indexation ni d'IA (Epic 4), pas de modification ni suppression (stories 2.4 et 2.6).

## Notes pour le développement

- Architecture : AD-2, AD-3, AD-4. Création par Server Action avec la session du membre ; `owner_id` est le membre connecté, jamais fourni par le navigateur. Politique RLS d'insertion : un membre ne crée que des ressources dont il est propriétaire, dans son workspace, avec une catégorie du même workspace.
- Validation côté serveur avec messages par champ, formulaire conservant les valeurs saisies. Entrée vérifiée, sans fuite d'erreur technique à l'écran.
- Étendre `tests/supabase-rls.test.mjs` : un membre ne peut pas créer une ressource au nom d'un autre membre.
- Dépend des stories 2.1 et 2.2.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Saisir un titre, coller un texte, choisir une catégorie, enregistrer : la ressource apparaît dans la liste et le détail.
- [ ] Laisser un champ vide : un message nomme le champ à corriger et les autres valeurs restent.
- [ ] Aucun bouton d'import de fichier n'est proposé.
- [ ] Déconnecté : le formulaire renvoie vers `/login`.
- [ ] Création au nom d'un autre membre refusée : vérifiée par `npm run test:integration`.
