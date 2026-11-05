---
story: 4-10-consulter-la-liste-de-ses-conversations
title: Consulter la liste de ses conversations
epic: 4
sprint: 8
status: ready-for-dev
context:
  - ../SPEC.md
---

# Story 4.10 — consulter ses conversations

## Ce que cela permet

Enregistrer les nouvelles questions et retrouver ses propres échanges après avoir quitté la page.

## Critères d'acceptation

1. Étant donné une nouvelle question valide sur Assistant, quand elle est acceptée, alors une conversation appartenant au membre et sa question sont enregistrées ; la réponse et ses références de sources sont enregistrées ensemble après génération.
2. Étant donné une génération en échec, quand le membre revient à l'historique, alors la question conservée et son état sont visibles ; aucune réponse inventée n'est sauvegardée.
3. Étant donné plusieurs conversations actives, quand la liste s'affiche, alors elle indique un titre issu de la première question et une date, de la plus récente à la plus ancienne.
4. Étant donné un membre ou un responsable, quand il consulte la liste ou Supabase directement avec sa session, alors il ne reçoit que ses propres conversations.
5. Étant donné une conversation sans nouvelle question depuis 30 jours, quand elle est recherchée, alors RLS la masque ; la simple consultation ne renouvelle pas le délai.
6. Étant donné un historique vide ou une erreur de chargement/enregistrement, quand l'écran s'affiche, alors ces états sont distingués et l'erreur propose de réessayer sans annoncer un succès.

## Décisions de comportement

- Validé : une première question crée une conversation ; aucun import des anciens échanges non enregistrés. Date de dernière nouvelle question et expiration calculées en base.
- Proposé pour relecture : `/assistant/conversations`, lien « Mes conversations » depuis Assistant ; titre = première question, extrait d'affichage de 80 caractères, sans fonction de renommage.
- Une question a un UUID stable réutilisé par « Réessayer » ; contraintes uniques empêchent question/réponse en double et finalisation concurrente. Le serveur contrôle propriétaire, expiration et état avant tout appel au fournisseur.
- Le résultat généré n'est présenté comme enregistré qu'après confirmation SQL ; si la sauvegarde échoue, message explicite et aucun succès simulé. Aucune répétition automatique de l'appel IA.
- Créer dès cette story `conversations`, `messages`, `message_sources` et leurs liens/protections : nécessaire pour enregistrer ce que 4.11 relira. Sources stockées comme références de ressource/passage/révision, sans copie des extraits ; les références de passage retiré sont détachées, sans supprimer la réponse.
- Proposé pour relecture : purge quotidienne avec Supabase Cron par une opération système séparée. Si Cron manque, fournir les étapes à Dylan et arrêter ; RLS doit déjà masquer les expirés.
- Les questions vides/trop longues, les soumissions non authentifiées ou refusées avant acceptation ne créent pas une conversation vide.

## Carte du code et tâches

- Nouvelle migration dans `supabase/migrations/` : UUID, propriétaire, dates, expiration, relations en cascade, statuts, unicité de requête/réponse, références nullable et fonctions atomiques avec droits explicites.
- RLS des trois tables : appartenance à la conversation active du demandeur ; aucun accès supplémentaire au responsable. Dates et propriété ne sont pas librement falsifiables par un membre.
- `src/features/assistant/assistant-actions.ts`, `assistant-state.ts`, `assistant.ts` et nouveau service serveur de conversations : sauvegarde initiale, génération existante et finalisation atomique.
- `src/app/assistant/page.tsx` et nouvelle liste : lien de navigation, titre/date, chargement, vide et erreur.
- Nouveaux tests unitaires et `tests/conversations-rls.test.mjs` : deux membres et responsable, accès directs, expiration et doublons ; enregistrer le test dans le runner existant.
- `README.md` : ordre des migrations, activation Cron et vérification ; application de la migration par Dylan seulement.

## Textes d'écran

« Mes conversations », « Aucune conversation enregistrée. », « Les conversations n'ont pas pu être chargées. Réessayez. », « L'échange n'a pas pu être enregistré. Réessayez. »

## Vérification

Scénarios S8-B, S8-F et S8-G de [tests-ia.md](../../../../tests-ia.md), tests de sauvegarde atomique et de privilèges sous RLS. Relecture de fiche et évaluation par Dylan avant `done`.

## Hors périmètre

Réouverture détaillée (4.11), question de suivi (4.12), suppression utilisateur (4.13), export/partage. Dépend de S8-1 et de l'assistant existant.
