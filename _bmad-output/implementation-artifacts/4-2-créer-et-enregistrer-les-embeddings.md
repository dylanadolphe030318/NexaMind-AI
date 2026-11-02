---
story: 4-2-créer-et-enregistrer-les-embeddings
title: Créer et enregistrer les embeddings
epic: 4
sprint: 5
status: ready-for-dev
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

- [ ] Fournisseur : OpenAI, modèle `text-embedding-3-small`, vecteurs de 1536 dimensions (AD-7).
- [ ] Données : seules des données fictives ou explicitement autorisées sont envoyées au fournisseur (jeu de test du projet).
- [ ] La ressource passe à « prête » seulement quand tous ses passages ont un embedding ; sinon elle passe à « en échec ».
- [ ] Aucune relance automatique : en cas d'échec (clé absente, quota, réseau), l'état « en échec » est enregistré et la relance est explicite (story 4.3).
- [ ] Si la ressource est modifiée pendant le calcul, le résultat de l'ancienne révision est ignoré.
- [ ] Budget et quotas : à définir par Dylan avant tout usage réel ; limite de 20 000 caractères par ressource déjà en base.

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
