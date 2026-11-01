---
story: 3-2-retrouver-ses-recherches-récentes
title: Retrouver ses recherches récentes
epic: 3
sprint: 4
status: ready-for-dev
---

# Story 3.2 : Retrouver ses recherches récentes

## Récit utilisateur

En tant que membre, je veux consulter la liste de mes recherches récentes, afin de retrouver les requêtes que j'ai déjà faites.

## Critères d'acceptation

1. Étant donné que j'ai lancé une recherche, quand je consulte mon historique, alors cette recherche apparaît avec sa requête et sa date.
2. Étant donné que je consulte l'historique, quand je suis connecté, alors je ne vois que mes recherches et un autre membre ne peut pas ouvrir mon historique, même avec une adresse directe.
3. Étant donné qu'un membre interroge directement dans Supabase l'historique d'un autre membre, quand la requête est exécutée avec sa session, alors RLS ne retourne aucune recherche appartenant à cet autre membre.
4. Étant donné que je n'ai encore aucune recherche enregistrée, quand j'ouvre l'historique, alors un état vide clair s'affiche.

## Limites de la story

Historique de recherches par mots-clés uniquement (aucune IA, pas de `search_results` : les résultats sont recalculés, cf. story 3.3). Pas de relance (3.3) ni de suppression (3.4).

## Textes d'écran

- Titre de page : « Mes recherches récentes ».
- Chaque ligne : la requête, puis « Recherche du <date en français> » en texte secondaire.
- État vide (neutre, pas d'erreur) : « Vous n'avez pas encore fait de recherche. » avec un lien « Rechercher des ressources ».
- Lien d'accès depuis la page de recherche et le tableau de bord : « Mes recherches récentes ».

## Notes pour le développement

- Migration à créer (appliquée par Dylan dans le SQL Editor, `supabase/migrations/2026110…_create_searches.sql`) : table `searches` (`id uuid`, `owner_id` → `profiles(id)` `on delete cascade`, `query text` limité à 100 caractères comme la recherche, `created_at`, `expires_at` par défaut 30 jours après la création). RLS activée : lecture, ajout et suppression réservés au propriétaire (`owner_id = auth.uid()`), lecture excluant les lignes dont `expires_at` est dépassé (architecture AD-3, AD-4). Pas de modification (`update`).
- Enregistrement : la page `/resources/search` enregistre la requête valide (non vide) côté serveur avec la session de la personne ; ne pas enregistrer deux fois de suite la même requête (rafraîchissement de la page). Un échec d'enregistrement ne doit pas empêcher d'afficher les résultats.
- Page `/resources/searches` (historique), 20 dernières recherches, la plus récente en premier. Lecture avec la session ; l'adresse directe d'un autre membre n'existe pas (pas d'identifiant de membre dans l'URL).
- Tests d'intégration : un membre ne voit pas les recherches d'un autre (critère 3) ; ajouter à `tests/supabase-rls.test.mjs` avec nettoyage dans le `finally`.
- Mettre à jour le README (ordre des migrations).
- Règle de fin de story : accents et ton des messages vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Lancer une recherche puis ouvrir « Mes recherches récentes » : la requête apparaît avec sa date.
- [ ] Se connecter avec un autre membre : il ne voit pas cette recherche.
- [ ] Un nouveau membre sans recherche voit l'état vide et le lien de recherche.
- [ ] Rafraîchir la page de résultats : la requête n'est pas enregistrée en double.
- [ ] Les accents s'affichent correctement.
