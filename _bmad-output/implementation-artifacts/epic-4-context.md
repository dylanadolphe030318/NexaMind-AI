# Epic 4 Context: Questionner les connaissances avec une IA et des sources

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre aux membres d’interroger les ressources auxquelles ils ont accès : préparer leurs textes pour la recherche sémantique, retrouver les passages utiles et générer des réponses vérifiables avec leurs sources, ou s’abstenir lorsque les ressources ne suffisent pas. Les conversations restent privées et peuvent être reprises. Ce contexte résume les epics et leurs critères ; il ne remplace pas le PRD, l'architecture et les documents UX présents dans les sous-dossiers de planification, à consulter pour leurs décisions détaillées.

## Stories

- Story 4.1: Découper une ressource en passages
- Story 4.2: Créer et enregistrer les embeddings
- Story 4.3: Suivre l’état de préparation d’une ressource
- Story 4.4: Retrouver les passages pertinents par le sens
- Story 4.5: Afficher les extraits des passages retrouvés
- Story 4.6: Limiter la recherche aux ressources accessibles
- Story 4.7: Générer une réponse à partir des passages retrouvés
- Story 4.8: Afficher les sources de la réponse
- Story 4.9: Signaler l’absence de réponse et les erreurs
- Story 4.10: Consulter la liste de ses conversations
- Story 4.11: Rouvrir une conversation
- Story 4.12: Continuer une conversation précédente
- Story 4.13: Supprimer une conversation de son historique
- Story 4.14: Relier les affirmations aux sources
- Story 4.15: Empêcher la divulgation de ressources non autorisées
- Story 4.16: Vérifier la qualité et l’abstention de l’assistant

## Requirements & Constraints

- Toute ressource préparée produit des passages liés à celle-ci et des embeddings associés ; passages et embeddings sont conservés durablement. La suppression d’une ressource doit empêcher ses passages de ressortir dans une recherche.
- La recherche doit retrouver des passages pertinents même si la formulation diffère, et proposer seulement les meilleurs résultats. Les recherches et réponses n’incluent que les ressources accessibles au membre.
- Les réponses reposent sur les passages retrouvés. Chaque affirmation factuelle doit être vérifiable par une source ; sans appui, elle est retirée ou l’assistant indique qu’il ne sait pas. En l’absence de contexte suffisant, aucune supposition ne doit être présentée comme certaine.
- Les données de conversation sont privées : un membre ne voit, ne rouvre ni ne supprime que ses propres conversations, y compris via accès direct à Supabase. L’historique n’est plus disponible après 30 jours sans activité (hypothèse indiquée dans les epics).
- Critères de qualité : sur 10 questions dont les réponses existent, au moins 8 doivent citer une source attendue ; sur 3 questions sans réponse dans les ressources, l’assistant doit s’abstenir dans les 3 cas.

## Technical Decisions

- Utiliser Supabase/PostgreSQL pour conserver durablement les passages, leurs embeddings et leurs liens aux ressources.
- Effectuer la récupération avec les droits de la session du membre et RLS active. Ne pas contourner ces règles avec une clé de service ; aucun passage non autorisé ne doit être transmis au modèle.
- Pour une conversation reprise, conserver les messages précédents comme contexte, tout en limitant les nouveaux passages récupérés aux ressources accessibles au membre.
- Ce résumé des epics ne détaille pas le modèle d'embedding, la dimension des vecteurs, le découpage ni les seuils ; consulter l'architecture et les stories implémentées plutôt que présumer ces réglages.

## UX & Interaction Patterns

- Montrer l’état de préparation d’une ressource (en cours, prête ou en échec), avec un message compréhensible et une action de relance en cas d’échec.
- Pour chaque résultat, montrer un extrait et le titre de la ressource, et permettre d’ouvrir celle-ci. Prévoir un état vide clair et la possibilité de modifier la requête.
- Afficher l’attente et les erreurs de génération, avec une relance qui conserve la question. Présenter les sources séparément, ouvrables et reliées aux affirmations concernées.
- La liste de conversations affiche leur date. Une suppression demande confirmation explicite ; l’ouverture doit signaler les conversations expirées ou les sources qui ne sont plus disponibles.

## Cross-Story Dependencies

- Epic 4 dépend des Epics 1 et 2, et intervient après les fonctionnalités standards.
- La préparation des passages (4.1) précède leur embedding (4.2) et leur recherche (4.4) ; le suivi d’état (4.3) couvre ce traitement. Les contrôles d’accès de 4.6 doivent s’appliquer avant qu’un passage puisse atteindre le modèle.
- La recherche (4.4) alimente l’affichage d’extraits (4.5) et la génération (4.7) ; les sources (4.8), l’abstention et les erreurs (4.9), ainsi que la traçabilité et les garde-fous (4.14–4.15), complètent la réponse. La story 4.16 vérifie qualité et abstention.
- L’historique (4.10) est le point d’entrée pour rouvrir (4.11), poursuivre (4.12) ou supprimer (4.13) une conversation.
- L’ordre prévu est préparation des données, recherche, réponses sourcées, gestion des conversations, puis qualité et garde-fous.
