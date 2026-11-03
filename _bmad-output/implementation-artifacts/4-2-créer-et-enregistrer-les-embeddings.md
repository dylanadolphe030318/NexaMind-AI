---
story: 4-2-créer-et-enregistrer-les-embeddings
title: Créer et enregistrer les embeddings
epic: 4
sprint: 5
status: in-review
baseline_commit: a263b792db54e476892dd0864364ba9092af8590
---

# Story 4.2 : Créer et enregistrer les embeddings

## Récit utilisateur

En tant que membre, je veux que les passages de ma ressource soient transformés en embeddings persistants, afin qu'ils puissent être comparés au sens d'une recherche.

## Critères d'acceptation

1. Étant donné que les passages d'une ressource existent, quand le calcul des embeddings se termine, alors chaque passage possède un embedding associé.
2. Étant donné que le calcul est terminé, quand le stockage est vérifié, alors les embeddings et leurs liens aux passages sont conservés durablement dans Supabase/PostgreSQL.

## Limites de la story

Calcul et stockage des embeddings seulement. Pas de recherche par le sens (sprint 6), pas d'affichage de l'état (story 4.3). Dépend de la story 4.1.

## Décisions de comportement (à valider par Dylan avant le développement)

- [x] Fournisseur : OpenAI, modèle `text-embedding-3-small`, vecteurs de 1536 dimensions (AD-7).
- [x] Données : seules des données fictives ou explicitement autorisées sont envoyées au fournisseur (jeu de test du projet).
- [x] La ressource passe à « prête » seulement quand tous ses passages ont un embedding ; sinon elle passe à « en échec ».
- [x] Aucune relance automatique : en cas d'échec (clé absente, quota, réseau), l'état « en échec » est enregistré et la relance est explicite (story 4.3).
- [x] Si la ressource est modifiée pendant le calcul, le résultat de l'ancienne révision est ignoré.
- [x] Budget et quotas : à définir par Dylan avant tout usage réel ; limite de 20 000 caractères par ressource déjà en base.

## Notes pour le développement

- Architecture : AD-5 (embeddings conservés dans PostgreSQL avec pgvector), AD-7 (fournisseur paramétré hors du code, appels côté serveur), AD-4 (publication atomique acceptée seulement pour la révision courante).
- Migration : `create extension if not exists vector` ; colonne `resource_chunks.embedding vector(1536)` ; fonction SQL atomique de publication (vérifie propriétaire ou responsable sous RLS, refuse une révision périmée, passe la ressource à `ready`). Pas d'index vectoriel dans cette story (réglage différé, sprint 6).
- Client IA dans `src/lib/ai/` ; variable d'environnement côté serveur seulement (ex. `OPENAI_API_KEY`), jamais dans le navigateur ni dans Git ; documenter dans `.env.example` et le README.
- Appeler les embeddings en lot (un appel pour tous les passages) ; erreur retournée explicitement, sans succès simulé.
- Dylan fournit la clé OpenAI dans `.env.local` et applique la migration (étapes dans le README).
- Tests : unitaire avec un faux client d'embeddings (aucun appel réseau) ; intégration : chaque passage a un embedding de 1536 valeurs, ressource `ready` ; révision périmée refusée ; nettoyage des données de test.
- Aucune clé `service_role`.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Créer une ressource de test (données fictives) : après quelques secondes, ses passages ont un embedding dans Supabase.
- [ ] Retirer la clé OpenAI de `.env.local` : l'ajout d'une ressource n'est pas perdu et la ressource n'est pas marquée « prête ».
- [ ] Modifier la ressource : les embeddings sont recalculés pour les nouveaux passages.
- [ ] `npm run test:integration` passe.

## Review Triage Log

| Finding | Verdict | Evidence and route |
|---|---|---|
| Coût API sans plafond | medium — deferred | Le projet ne configure pas de budget ni de quota. L'architecture exige une limite avant l'usage réel ; Dylan doit régler celle-ci dans OpenAI avant d'envoyer des ressources réelles. |
| Durée maximale d'exécution côté hébergeur | maybe-false — deferred | L'appel OpenAI a un délai maximal de 30 secondes, mais la limite du déploiement n'est pas documentée ni vérifiée. Le plan Vercel et ses limites doivent être confirmés avant déploiement. |
| Échec de l'enregistrement de l'état « failed » | medium — deferred | Le code journalise explicitement l'erreur si Supabase ne peut pas enregistrer l'échec. La base étant alors indisponible, une procédure de rapprochement reste à définir hors de cette story. |
| Schéma pgvector codé en dur | false — rejected | Le README demande de vérifier le schéma `vector` avant la migration et de s'arrêter si ce n'est pas `extensions` ; le cas incompatible ne passe donc pas silencieusement. |
| Absence de journal d'autorisation durable | low — rejected | La story exige une confirmation avant l'envoi, présente dans le formulaire et vérifiée côté serveur. Un journal d'audit durable n'est pas demandé et ajouterait un nouveau mécanisme de données. |
| Pas de test au niveau des Server Actions (revue contenu) | low — rejected | Les actions appellent le validateur avec l'autorisation obligatoire à la création et contrôlent les modifications du texte ; le validateur est testé. Un harnais de tests d'actions n'existe pas dans le projet. |
| Échec non visible dans l'écran après enregistrement | medium — deferred | L'échec est persisté en base et signalé dans les journaux serveur ; le message utilisateur et la relance sont explicitement prévus en story 4.3. |
| Migration et intégration non vérifiées | maybe-false — deferred | Les tests unitaires passent, mais l'intégration dépend de l'application de la migration Supabase 4.2, qui reste à faire par Dylan. |
| Pas de test d'action de consentement (vérification) | low — rejected | Même constat que la revue de contenu : la règle est actuellement vérifiée côté serveur et son validateur est couvert ; seul le raccordement des actions n'a pas de test isolé. |
| Pas de test de migration sur des passages historiques | maybe-false — deferred | Aucun harnais local de migration n'est disponible ; la migration doit être appliquée puis les anciennes ressources contrôlées dans le projet Supabase. |

## Review Triage Log

- [false] `openai-embeddings-client.ts` : l'en-tête Authorization est mal formé — réfuté : le code construit `Bearer ${apiKey}` et le test vérifie `Bearer fake-key`.
- [false] `openai-embeddings.test.mjs` : le test compare à une chaîne masquée — réfuté : l'assertion vérifie `Bearer fake-key`; le masquage n'est que dans l'affichage du diff.
- [medium → patch, corrigé] `indexing-core.ts` envoyait le texte sans autorisation explicite — le formulaire exige maintenant une confirmation de données fictives ou autorisées, vérifiée côté serveur pour la création et le changement de texte; test unitaire ajouté.
- [maybe-false → defer, medium non vérifiée] Budget et quotas — la story réserve leur définition avant usage réel, mais aucun plafond n'est fourni; Dylan doit définir la limite avant les appels réels.
- [medium → patch, corrigé] Le client OpenAI n'avait pas de délai maximal — délai de 30 secondes ajouté, avec assertion de présence du signal d'annulation.
- [maybe-false → defer, medium non vérifiée] Migration pgvector — la migration suppose que l'extension existante se trouve dans `extensions`; vérifier le schéma `pg_extension.extnamespace` dans le projet Supabase cible avant application.
- [maybe-false → defer, medium non vérifiée] L'échec de `mark_resource_failed` peut laisser l'état en `processing` si la base refuse elle-même l'écriture; déterminer le traitement de cette panne lors de la story 4.3.
- [low → patch, corrigé] L'adaptateur de production n'était pas testé — un test vérifie maintenant que les embeddings atteignent la publication.
- [medium → patch, corrigé] L'intégration ne vérifiait pas l'état SQL après l'échec — assertion `indexing_status = 'failed'` ajoutée au test RLS.
- [medium → patch, corrigé] Le contrôle d'autorisation de données était également signalé par la couche edge-case — même correction et même test que l'entrée correspondante ci-dessus.
- [medium → patch, corrigé] L'absence de délai réseau était également signalée par la couche edge-case — même correction que l'entrée correspondante ci-dessus.
- [maybe-false → defer, medium non vérifiée] La mise à niveau de données historiques n'a pas de test de migration dédié; ajouter un scénario pré-4.2 lorsque le dépôt disposera d'un harnais local de migrations PostgreSQL/Supabase.
