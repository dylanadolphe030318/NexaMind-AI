---
id: SPEC-sprint-8-ia
companions:
  - ../../planning-artifacts/architecture/architecture-projet-ia-2026-10-28/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/EXPERIENCE.md
  - ../../planning-artifacts/plan-sprints.NexMind AImd.md
  - ../../../tests-ia.md
  - stories/s8-1-fiabiliser-la-recherche.md
  - stories/4-10-consulter-la-liste-de-ses-conversations.md
  - stories/4-11-rouvrir-une-conversation.md
  - stories/4-12-continuer-une-conversation-precedente.md
  - stories/4-13-supprimer-une-conversation-de-son-historique.md
sources: []
---

# Sprint 8 IA — retrouver ses conversations avec une recherche fiable

## Why

Les réponses du sprint 7 ont été évaluées à 10/10 par Dylan. Il doit maintenant pouvoir retrouver et poursuivre ses échanges privés. Les trois améliorations de rétrospective restent validées : la recherche est fiabilisée au sprint 8 ; les catégories déroulantes et les cartes mauve pâle sont reportées au sprint 9 pour respecter trois à cinq stories par sprint.

## Capabilities

- **CAP-1**
  - **intent:** Retrouver le passage attendu sans perdre la priorité d'un identifiant exact.
  - **success:** L'ordre hybride survit au chemin applicatif ; les tests distinguent le numéro exact du signal lexical général et vérifient le contenu transmis à l'assistant.
- **CAP-2**
  - **intent:** Retrouver ses conversations enregistrées et datées.
  - **success:** Une nouvelle question est conservée ; seules les conversations du propriétaire, non expirées, apparaissent, même pour un responsable.
- **CAP-3**
  - **intent:** Relire ses messages et vérifier leurs sources encore disponibles.
  - **success:** Une conversation autorisée s'ouvre dans l'ordre ; une source retirée est signalée sans restituer son ancien extrait.
- **CAP-4**
  - **intent:** Poursuivre un échange sans perdre son contexte récent.
  - **success:** Les nouveaux messages rejoignent la même conversation ; au plus dix anciens échanges servent au contexte et les réponses reposent sur des passages actuellement autorisés.
- **CAP-5**
  - **intent:** Retirer une conversation de son historique.
  - **success:** La confirmation supprime la conversation et ses enfants ; annuler conserve tout ; aucune suppression de l'historique d'un tiers n'est possible.

## Constraints

- Préparation seulement : aucune implémentation, migration appliquée ou appel IA pendant cette phase. Chaque fiche sera relue par Dylan avant développement ; chaque story sera évaluée avant `done`.
- Trois à cinq stories par sprint, compléments inclus. Ordre du sprint 8 : S8-1, 4.10, 4.11, 4.12, 4.13. Les compléments ne renumérotent pas l'epic.
- Conserver OpenAI configurable côté serveur, embeddings `text-embedding-3-small` de 1536 dimensions, pgvector et RLS Supabase. Aucun secret navigateur ni client `service_role` pour les parcours membres.
- Conserver question de 300 caractères, cinq passages au seuil 0,4, vingt questions par minute et par membre, sortie de 500 jetons et délai fournisseur de 30 secondes. Aucune relance automatique.
- Chaque table de conversation, messages et sources est protégée par son propriétaire sous RLS ; le responsable n'a aucun privilège sur les conversations d'autrui.
- Expiration à 30 jours après la dernière nouvelle question enregistrée, calculée en base ; une lecture ou une simple tentative répétée ne prolonge pas ce délai. RLS masque l'expiré avant une purge système séparée.
- Identifiant de question stable pendant les relances ; sauvegardes atomiques et erreurs explicites, sans succès simulé. Une nouvelle question est conservée même si le fournisseur échoue.
- Les échanges précédents servent à interpréter la question, jamais comme preuve factuelle. Ne pas réinjecter d'anciens extraits de sources ; rechercher de nouveaux passages autorisés, imposer les sources et l'abstention.

## Non-goals

- Pas de récupération des échanges du sprint 7 : ils n'étaient pas enregistrés.
- Pas de partage, export, renommage libre des conversations, pièces jointes, streaming ou nouveau fournisseur.
- Pas de stories 4.14 à 4.16, ni de correction générale des autres constats de rétrospective.
- Pas de changements visuels S8-2 et S8-3 dans ce sprint : ils sont planifiés au sprint 9.
- Pas de modification des catégories existantes dans Supabase, du contenu des ressources, de la recherche par mots-clés ou du classement vectoriel de l'assistant.

## Success signal

Dylan pose une question, retrouve l'échange après rechargement, le rouvre, poursuit avec une question liée, puis le supprime après confirmation. Un autre compte ne peut jamais le lire. Les questions existantes restent satisfaisantes et la priorité des passages de recherche est conservée.

## Capacités reportées au sprint 9

Ces capacités restent validées mais ne font plus partie du contrat actif du sprint 8. Leurs identifiants ne seront pas réutilisés :

- **CAP-6 / S8-2 :** distinguer les catégories avec des sélecteurs déroulants sur les pages Ressources et Catégories, sans perdre le filtre, le renommage ni les permissions. [Fiche conservée](deferred-stories/s8-2-categories-en-listes-deroulantes.md).
- **CAP-7 / S8-3 :** distinguer les cartes de ressources, résultats et réponse/sources sur fond mauve pâle, avec fond de page blanc et contrastes accessibles. [Fiche conservée](deferred-stories/s8-3-cartes-mauve-pale.md).

Le sprint 9 contient les stories 4.14 à 4.16 puis ces deux compléments, soit cinq stories. Les checkpoints de relecture et d'évaluation précédemment validés restent applicables aux deux fiches reportées.

## Assumptions

- Les routes `/assistant/conversations` et `/assistant/conversations/[id]` et une purge quotidienne via Supabase Cron sont des propositions techniques à confirmer à la relecture de la fiche 4.10.
- La nuance proposée pour les cartes est `#f3edf8`, déjà présente dans les styles ; sa validation visuelle appartient à S8-3 au sprint 9.
