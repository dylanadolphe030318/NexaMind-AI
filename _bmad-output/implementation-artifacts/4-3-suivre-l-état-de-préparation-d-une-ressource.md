---
story: 4-3-suivre-l-état-de-préparation-d-une-ressource
title: Suivre l'état de préparation d'une ressource
epic: 4
sprint: 5
status: done
baseline_commit: d07d087f46065181b2b363eecdac73377bb0f940
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

## Review Triage Log

| Verdict | Evidence | Route |
|---|---|---|
| medium | `resource-actions.ts` affichait le retour de succès même quand `indexResource` retournait `success: false`, alors que la préparation restait en échec. | patch — le succès n'est annoncé qu'après une indexation réussie. |
| medium | La page affichait « Vous pouvez la relancer » à tout membre, même lorsque le bouton était caché faute d'autorisation. | patch — le message et le bouton sont réservés au propriétaire ou au responsable. |
| low | Le paramètre `preparation=launched` peut être ajouté manuellement à l'URL pour afficher un succès sans relance. | rejetée — effet d'affichage limité, peu probable en usage courant; un flash vérifié nécessiterait un mécanisme plus large qu'une correction directe. |
| low | Une relance concurrente ou un état changé entre lecture et RPC pouvait afficher à tort le message de refus d'autorisation. | patch — le refus explicite reste réservé au contrôle des droits; l'échec de démarrage concurrent retourne sans ce message. |
| medium | Une interruption brutale du processus après le passage à `processing` peut empêcher l'appel qui marque `failed`, laissant un état bloqué; le risque concerne aussi le flux initial d'indexation. | defer — récupération des préparations bloquées à définir hors de cette story. |
| medium | Les tests unitaires couvrent les libellés et les règles de relance, mais pas les parcours de l'action serveur ni l'affichage navigateur; les tests Supabase n'ont pas été exécutés. | defer — valider les parcours dans le navigateur et exécuter les tests d'intégration après application de la migration dans un environnement de test. |
| low | carried — blind-hunter: `?preparation=launched` peut toujours être ajouté manuellement et afficher un succès sans relance. | rejetée — même constat et même route que l'entrée low existante; un flash vérifié demanderait une infrastructure plus large qu'une correction directe. |
| false | blind-hunter: une exception d'`indexResource` pourrait laisser l'état en `processing`. | réfutée — le générateur et les appels RPC susceptibles d'échouer sont interceptés dans `indexing-core.ts`; le seul passage local préalable est le découpage déterministe d'un texte de ressource. |
| false | blind-hunter: un membre non autorisé ne voit pas de message d'échec détaillé. | réfutée — le badge affiche explicitement « Préparation en échec »; le texte qui promet une relance n'est montré qu'aux personnes autorisées. |
| medium | carried — blind-hunter: les parcours de l'action serveur de relance ne sont pas couverts par des tests. | defer — même lacune déjà consignée: compléter les tests d'action et les contrôles d'interface dans un environnement de test. |
| medium | carried — blind-hunter: les tests Supabase d'intégration n'ont pas été exécutés. | defer — même lacune déjà consignée; l'exécution requiert une base de test et la migration appliquée. |
| false | blind-hunter: les questions de test sur le voisin dans `tests-ia.md` exposeraient des renseignements personnels. | réfutée — le scénario est hypothétique, ne fournit aucune donnée réelle et attend explicitement « Je ne sais pas » sans source. |
| false | edge-case-hunter: un appelant authentifié avec `auth.uid()` nul pourrait relancer la ressource d'autrui par logique SQL trois-valuée. | réfutée pour les appels applicatifs: l'exécution est accordée uniquement au rôle `authenticated`, révoquée à `anon`, et l'action exige une session utilisateur avant le RPC. |
| low | carried — edge-case-hunter: le paramètre URL `preparation=launched` peut afficher un succès sans relance réelle. | rejetée — même constat et même route que l'entrée low existante; pas de mécanisme de flash ajouté pour ce cas isolé. |
| medium | carried — verification-gap: aucun test ne vérifie que l'action serveur ne renvoie le succès qu'après une indexation réussie. | defer — même lacune d'action serveur déjà consignée; à vérifier avec le parcours de relance en environnement de test. |
| medium | carried — verification-gap: aucune couverture ne relie les champs `indexing_status` lus par les pages aux libellés affichés. | defer — même lacune d'affichage navigateur déjà consignée; compléter cette validation en environnement de test. |
| low | carried — verification-gap: un paramètre `preparation=launched` fabriqué dans l'URL déclenche le message de succès. | rejetée — même constat et même route que l'entrée low existante; l'effet reste limité à l'affichage et le correctif exigerait un mécanisme flash plus large. |
| medium | carried — verification-gap: aucun test ne vérifie que `retryResourceIndexing` n'annonce le succès qu'après une indexation réussie. | defer — le code vérifie le résultat, mais il manque une preuve automatisée du parcours de l'action serveur. |
| medium | carried — verification-gap: aucun test ne vérifie que l'état lu par `getResourceListData` et `getResourceDetail` atteint les badges des pages. | defer — la relation requête-mappage-affichage nécessite une vérification navigateur ou de test d'intégration. |
| low | carried — le paramètre URL `preparation=launched` peut être fabriqué pour afficher un succès sans relance réelle. | rejetée — même constat déjà consigné; l'effet reste limité à l'affichage et le correctif exigerait un mécanisme de flash plus large. |
