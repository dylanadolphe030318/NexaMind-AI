---
story: 4-4-retrouver-les-passages-pertinents-par-le-sens
title: Retrouver les passages pertinents par le sens
epic: 4
sprint: 6
status: done
---

# Story 4.4 : Retrouver les passages pertinents par le sens

## Récit utilisateur

En tant que membre, je veux retrouver les ressources qui parlent de mon sujet même sans les mêmes mots, afin de trouver l'information utile en langage courant.

## Critères d'acceptation

1. Étant donné qu'une ressource préparée traite du sujet recherché, quand je lance une recherche avec des mots différents de ceux de la ressource, alors un passage pertinent peut être retrouvé.
2. Étant donné que je lance une recherche sémantique, quand les passages sont récupérés, alors seuls les passages les plus pertinents sont proposés comme résultats.

## Limites de la story

Moteur de recherche côté serveur : calcul de l'embedding de la question, puis recherche des passages les plus proches dans pgvector. L'affichage des extraits est la story 4.5 ; les tests de droits d'accès détaillés sont la story 4.6. Aucune réponse générée par le LLM (sprint 7). Dépend des stories 4.1 à 4.3.

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Fonction SQL `search_resource_chunks` appelée avec la session du membre (SECURITY INVOKER) : la RLS s'applique, seuls les passages de ressources « prêtes » et accessibles sont lus.
- [ ] Mesure de proximité : distance cosinus pgvector, adaptée aux embeddings OpenAI.
- [ ] Au plus 5 passages retournés, au plus 1 passage par ressource (le meilleur), classés du plus proche au moins proche.
- [ ] Un seuil minimal de proximité écarte les passages hors sujet ; sans passage au-dessus du seuil, la liste est vide (cela servira au « je ne sais pas » du sprint 7). Le seuil est une constante réglable, ajustée sur les questions de test.
- [ ] La question est limitée à 300 caractères (même limite que la recherche actuelle) avant tout appel à OpenAI.
- [ ] Pas d'index vectoriel pour l'instant : le volume du MVP (environ 20 ressources) ne le justifie pas.
- [ ] Le calcul de l'embedding de la question se fait uniquement côté serveur, avec `OPENAI_API_KEY` lue depuis `.env.local`.

## Notes pour le développement

- Architecture : AD-1 (appel OpenAI côté serveur), AD-5 (même contexte autorisé, ressources `ready` uniquement, RLS active).
- Nouvelle migration `supabase/migrations/20261105100000_search_resource_chunks.sql` : fonction `public.search_resource_chunks(p_query_embedding extensions.vector(1536), p_limit integer, p_min_similarity real)` retournant `resource_id`, `title`, `content`, `similarity`. SECURITY INVOKER, `search_path` vide, limite maximale de `p_limit` plafonnée à 5 en base, exécution accordée à `authenticated` seulement. Mettre à jour le README (ordre des migrations).
- Réutiliser `generateEmbeddings` (`src/lib/ai/embeddings.ts`) ; ajouter `src/features/resources/semantic-search.ts` (`import "server-only"`) qui valide la question, calcule l'embedding, appelle la fonction avec le client Supabase de la session et formate le résultat.
- Ne jamais utiliser de clé `service_role`.
- Tests unitaires : validation de la question, plafond de résultats, seuil, tri. Test d'intégration : une ressource préparée est retrouvée par une question aux mots différents (embedding fictif contrôlé), au plus 5 résultats.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Après avoir appliqué la migration, une question en langage courant retrouve la ressource attendue.
- [ ] Une question hors sujet (« Quelle est la marque de la voiture de mon voisin ? ») ne retourne aucun passage.
- [ ] Jamais plus de 5 résultats.
- [ ] Aucune clé OpenAI visible dans le navigateur (onglet Réseau, code source de la page).
