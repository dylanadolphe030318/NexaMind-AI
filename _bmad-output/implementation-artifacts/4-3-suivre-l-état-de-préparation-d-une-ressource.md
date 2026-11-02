---
story: 4-3-suivre-l-état-de-préparation-d-une-ressource
title: Suivre l'état de préparation d'une ressource
epic: 4
sprint: 5
status: ready-for-dev
---

# Story 4.3 : Suivre l'état de préparation d'une ressource

## Récit utilisateur

En tant que membre, je veux voir si la préparation de ma ressource est en cours, terminée ou en échec, afin de savoir si elle est prête pour une recherche sémantique.

## Critères d'acceptation

1. Étant donné que ma ressource est en préparation, quand j'en consulte l'état, alors l'interface indique si elle est en cours, prête ou en échec.
2. Étant donné que la préparation échoue, quand je consulte l'état de la ressource, alors un message compréhensible s'affiche et une action permet de relancer la préparation.
3. Étant donné qu'une ressource a été supprimée, quand j'effectue une recherche sémantique sur son contenu, alors aucun de ses passages n'est retourné par l'index.

## Limites de la story

Affichage de l'état et relance de la préparation. La recherche sémantique complète arrive au sprint 6 : le critère 3 se vérifie par un test sur la table des passages (aucun passage d'une ressource supprimée). Dépend des stories 4.1 et 4.2.

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Où : l'état s'affiche sur la fiche de la ressource et, en étiquette discrète, dans la liste.
- [ ] Qui peut relancer : le propriétaire ou le responsable, pas un autre membre (pas de bouton rendu).
- [ ] « Relancer » refait le découpage et les embeddings de la révision courante ; le bouton n'existe que pour l'état « en échec ».
- [ ] Pas de rafraîchissement automatique : l'état se met à jour au rechargement de la page.
- [ ] Une ressource « en cours » ou « en échec » n'est pas interrogeable ; une ressource « prête » l'est.
- [ ] Le message d'échec reste simple et sans détail technique.

## Textes d'écran

- Étiquettes : « Préparation en cours », « Prête pour la recherche », « Préparation en échec ».
- Message d'échec : « La préparation de cette ressource a échoué. Vous pouvez la relancer. »
- Bouton : « Relancer la préparation ».
- Message après relance : « La préparation a été relancée. »
- Relance refusée : « Vous ne pouvez pas relancer la préparation de cette ressource. »

## Notes pour le développement

- Architecture : AD-4 (état `processing`/`ready`/`failed`, révision courante), AD-5 (seules les ressources `ready` sont interrogeables), AD-3 (propriétaire ou responsable).
- Lire `indexing_status` dans `src/features/resources/resources.ts` (`getResourceListData`, `getResourceDetail`) ; action serveur de relance dans `resource-actions.ts`, avec `.select("id")` pour détecter un refus RLS (comme `deleteResource`).
- Critère 3 : les passages disparaissent par `on delete cascade` (story 4.1) ; ajouter un test d'intégration qui supprime une ressource puis vérifie 0 passage.
- Tests : état affiché selon chaque valeur ; relance par un membre non propriétaire refusée ; nettoyage des données de test.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Une ressource prête affiche « Prête pour la recherche ».
- [ ] Une ressource en échec (clé OpenAI retirée) affiche le message et le bouton « Relancer la préparation ».
- [ ] Après remise de la clé, « Relancer » la fait passer à « Prête ».
- [ ] Compte membre non propriétaire : aucun bouton de relance.
- [ ] Après suppression d'une ressource, ses passages n'existent plus dans Supabase.
- [ ] Les accents s'affichent correctement.
