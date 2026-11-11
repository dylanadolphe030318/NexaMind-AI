---
title: 'Corrections A et C : nettoyage RLS et seuil des candidats'
type: 'bugfix'
created: '2026-11-11'
status: 'done'
route: 'dispatch'
baseline_commit: 'fc7341b23b991c39ec40811c5a790d942412652f'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent">

## Intent

Les tests laissent leurs catégories RLS dans la démo. Le RPC candidats utilise
implicitement 0,3 alors que la recherche passe explicitement 0,2. Réaliser A puis
C, avec migrations additives, vérifications et commits séparés. B est déjà
documentée pour 4.16 ; ne pas développer le sprint 9.

## Boundaries & Constraints

**Toujours :** sessions réelles avec clé publishable pour les tests ; RLS pour
les lectures ; nettoyage de fixtures par identifiants précis ; erreurs explicites ;
inventaire et confirmation de la liste avant retrait des anciennes catégories.
Garder fournisseur, embeddings, pgvector, budgets et assistant inchangés.
Conserver les actions ouvertes pour l'évaluation de Dylan.

**Jamais :** DELETE général sur les catégories, suppression par préfixe,
suppression ou réaffectation d'une ressource réelle, clé privilégiée dans les
tests, modification des anciennes migrations ou lancement des stories du sprint 9.

**Exception ponctuelle approuvée :** Dylan confirme le retrait des onze catégories
inventoriées et demande de conserver `24f359d7-5869-4eac-beb9-a58ff599f98c`
en la déplaçant de `2a564d62-edf3-48ec-8ae5-7c8879336c48` vers
Documents internes (`734b114b-cacb-4ace-90b1-e0484055ed49`) avant le nettoyage.
Vérifier son contenu et ses références après déplacement ; pas de suppression
de cette ressource ni de changement des règles du RPC pour les catégories utilisées.

## I/O & Edge-Case Matrix

| Scénario | Entrée | Résultat | Erreur |
|---|---|---|---|
| Nettoyage normal | Responsable, son workspace, ID exact, nom RLS-UUID éventuellement renommé, inutilisé | Une catégorie supprimée | Toute erreur remontée |
| Réessai | Même appel après retrait | false, absence vérifiée | Aucun succès simulé |
| Refus | Anonyme, membre, workspace étranger | Rien supprimé | 42501 |
| Catégorie réelle | Nom non conforme | Conservée | 22023 |
| Catégorie utilisée | Une ressource liée | Catégorie et ressource conservées | 23503 |
| Échec de test | Exception après création | Fixtures de cette exécution nettoyées avant déconnexion | Échec initial et erreurs de nettoyage conservés |
| Défaut candidats | Fixture contrôlée de similarité 0,25 | Même résultat sans seuil et avec 0,2 ; fixture absente avec 0,3 | Échec de test si divergence |
| Anciennes lignes | Liste exacte approuvée | Seules lignes inutilisées confirmées retirées | Arrêt si état ou nom changé |

</frozen-after-approval>

## Code Map

- `supabase/migrations/20261030140000_create_categories.sql` : helper privé
  `is_workspace_responsable`, aucune autorisation DELETE. À conserver.
- `supabase/migrations/20261030160000_create_resources.sql` : FK restrict vers
  catégorie ; protège contre suppression concurrente d'une catégorie utilisée.
- `tests/supabase-rls.test.mjs` : création ligne 190, renommage, nettoyage final
  incomplet et global. Suivre les ID exacts des catégories, ressources et recherches.
- `tests/semantic-search-rls.test.mjs` : helpers de vecteurs 1536 dimensions,
  publication de passages et tests RPC ; réutiliser un axe isolé.
- `supabase/migrations/20261110210000_search_resource_chunk_candidates.sql` :
  fonction SQL invoker, plafond vingt, fenêtre hybride ; corps inchangé.
- `package.json`, `README.md`, `tests-ia.md`, `sprint-status.yaml` : runners,
  étapes SQL et suivi. Aucun composant navigateur à modifier.

## Tasks & Acceptance

**Exécution :**

- [x] Nouvelle migration `supabase/migrations/20261111103000_cleanup_rls_test_category.sql` :
  RPC avec workspace et ID exact, helper responsable, search_path vide,
  verrou de catégorie, format exact de fixture, refus utilisée ; aucune purge
  à l'installation.
- [x] `tests/helpers/rls-cleanup.mjs`, `tests/rls-cleanup.test.mjs`,
  `tests/supabase-rls.test.mjs`, `package.json` : nettoyage exact, erreurs
  agrégées, déconnexion garantie ; tests succès, réessai, refus et échec simulé.
- [x] `README.md`, `tests-ia.md` et suivi : procédure, livraison A non clôturée,
  inventaire confirmé ; appliquer A, tester, retirer les anciennes lignes
  autorisées, vérifier, commiter A avant C.
- [x] Nouvelle migration `supabase/migrations/20261111110000_align_candidate_similarity_default.sql` :
  même signature/corps/permissions avec défaut 0,2.
- [x] `tests/semantic-search-rls.test.mjs`, documentation et suivi : invocation
  implicite/explicite, seuil 0,3 témoin et réessai ; appliquer, tester et commiter C.

**Critères d'acceptation :**

- Étant donné des fixtures de cette exécution, quand un test réussit ou échoue,
  alors aucune catégorie créée ne reste et aucune ligne d'une autre exécution
  n'est supprimée ; les erreurs ne sont pas ignorées.
- Étant donné un acteur ou une catégorie interdite, quand le nettoyage est
  demandé, alors le refus est explicite et les données restent intactes.
- Étant donné une fixture à 0,25 admissible dans la fenêtre hybride, quand le
  seuil est omis ou explicitement 0,2, alors elle apparaît dans les deux appels,
  avec les mêmes références, et disparaît avec 0,3.
- Étant donné la livraison technique, quand le suivi est actualisé, alors
  A et C attendent l'évaluation et le sprint 9 n'a pas démarré.

## Implementation Notes

Après la livraison et les tests automatisés, Dylan confirme « c'est ok »
le 2026-11-11 pour le contrôle des catégories et Q1 sur Recherche de ressources.
Cette acceptation humaine clôture A et C ; elle ne valide pas le sprint 9 ni
un nouvel essai de l'assistant.

Investigation : onze catégories correspondent au format historique ; dix ont
zéro ressource, une en a une. Après clarification, Dylan approuve le déplacement
de cette seule ressource et les onze retraits. Le dashboard intégré est désormais
connecté ; aucune connexion SQL privilégiée n'est configurée dans le runner.

Page du dashboard accessible : `3e063f75-91bc-434f-9660-32ae3feb111c`, projet
`efwraqlwbfgyqnknkuyy` (confirmé identique à `.env.local`). Utiliser SQL Editor
de cette session personnelle pour appliquer les migrations ; ne pas extraire
de jeton du navigateur. SQL de migration uniquement, aucune purge automatique.
Les opérations de données se font avec la session responsable par Supabase JS.
Éviter toute sortie de secrets ou du contenu des ressources.

Liste des onze catégories explicitement approuvées pour retrait, après vérification
du nom strict de fixture et absence de ressource liée :
`9b856ffe-84dc-4010-921b-e4a82857ee35`,
`a29c0014-b660-4ff8-84e3-6b0c90021e87`,
`ae7cf1c4-3534-4693-b255-42b37a021c39`,
`a493b6bc-2a48-44a9-970e-473a13e96c7b`,
`9e7f6a4d-0251-4efc-ac95-82fc680cd70a`,
`ffca75c0-c025-4ad3-90cf-32ebb8df4221`,
`5d611e0c-8c85-438f-8678-293f524c6db3`,
`9e5344ba-22e9-40cd-b3c0-c551366097a1`,
`d4eedfa6-8066-4382-a9c2-5803bcfab413`,
`acf8ce07-f3e9-4235-a6cb-eb8689f6023a`,
`2a564d62-edf3-48ec-8ae5-7c8879336c48`.
Déplacer uniquement la ressource approuvée avant ces retraits, avec contrôle
optimiste de sa catégorie initiale et de la catégorie cible dans le même workspace.
Comparer son corps et ses passages/références avant/après sans les journaliser.

Développement et tests A puis application A, nettoyage confirmé et commit A ;
seulement ensuite C, application, tests et commit C. Un refus de permission SQL
ou une erreur persistante bloque la suite : arrêter et expliquer, pas de contournement.
Messages Git conformes au style `fix(rls): ...` / `fix(sql): ...`, avec trailer
`Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
Les documents approuvés sont déjà commités dans le baseline ; aucun push demandé.

## Spec Change Log

## Review Triage Log

- false — `README.md` ne référence pas le présent spec et le diff initial ne supprimait aucun lien vers lui ; aucune correction de lien n’était nécessaire.
- medium / patch — Les prérequis RLS du `README.md` ne donnaient ni les noms exacts des variables d’environnement, ni le workspace partagé requis par le responsable et le membre A, ni la catégorie réelle préexistante utilisée par le test. Le guide indique maintenant les variables, les comptes de test dédiés, le workspace et la catégorie nécessaires.
- medium / patch — Le `README.md` présentait la migration A uniquement pour une installation neuve, alors que le projet actuel doit aussi l’appliquer avant les tests. La procédure indique maintenant l’ordre et l’application unique sur le projet existant.
- medium / patch — La couverture d’échec testait auparavant l’orchestration avec des fonctions factices, sans supprimer une fixture réelle après une erreur simulée. Un test RLS crée maintenant une catégorie réelle, simule l’échec et vérifie le nettoyage exact avant déconnexion.
- medium / patch — `tests/supabase-rls.test.mjs` enregistrait une ressource après ses assertions de propriétaire et de titre ; une assertion échouée pouvait donc laisser la ressource. L’identifiant est maintenant enregistré dès le retour de la création.
- medium / patch — `tests/semantic-search-rls.test.mjs` ajoutait les IDs de quota au nettoyage après une assertion sur leur nombre. Les IDs obtenus sont maintenant inscrits avant cette assertion pour que l’échec ne les omette pas du nettoyage.
- low — Rejeté : le décalage d’horloge ne fausse le comptage qu’autour de la frontière de la fenêtre d’une minute ; le corriger correctement demanderait une référence temporelle côté base ou une nouvelle interface, disproportionnée pour ce risque rare.
- low — Rejeté : les tests de quota peuvent entrer en concurrence si les mêmes comptes sont réutilisés ; le `README.md` demande maintenant des comptes dédiés aux tests et interdit les exécutions simultanées avec les mêmes identifiants.
- false — Le spec reste un fichier local non suivi et aucun push n’est demandé ; ces identifiants opérationnels ne sont pas publiés par les commits de code. Le spec fourni ne doit pas être modifié pour ce finding.
- false — La migration limite le RPC au responsable du workspace, à l’identifiant exact, au format strict défini comme fixture par le spec et aux catégories inutilisées ; une catégorie non conforme est refusée et aucune suppression par préfixe n’existe.
- false — Le workspace aléatoire différent du workspace du responsable reçoit le même refus 42501 que tout workspace non autorisé ; le RPC revérifie aussi que la catégorie exacte appartient au workspace fourni avant toute suppression.
- medium / patch — Le test comparait seulement les références triées alors que `tests-ia.md` annonçait des résultats identiques ; il compare maintenant les lignes complètes et leur ordre pour l’appel implicite, l’appel explicite à 0,2 et le réessai.
- medium / patch — Les tests sémantiques ouvraient des sessions avant l’enregistrement des actions de nettoyage ; l’authentification est désormais dans l’action protégée et les déconnexions tolèrent les sessions non initialisées.
- medium / patch — Une lecture échouée après l’insertion d’un appel de quota pouvait empêcher l’enregistrement de son ID ; le nettoyage recense maintenant les lignes exactes postérieures à l’instantané initial, en plus des IDs suivis.
- medium / patch — Le test d’échec simulé ne vérifiait en base que la catégorie ; il crée maintenant une catégorie, une ressource et une recherche, déclenche l’échec, les nettoie par ID et vérifie leur absence avant la déconnexion.
- false — Le test du seuil omet `p_min_similarity` mais fixe `p_limit` à 20 ; le spec demande de vérifier le défaut du seuil de similarité, pas le défaut de la limite, dont la signature et le plafond ne changent pas.
- false — Les commandes et nombres de tests sont présents dans la documentation ; aucun identifiant de run n’est exigé par le spec et l’absence de cet identifiant ne rend pas les vérifications non reproductibles.
- false — Le test d’espace non autorisé utilise un UUID distinct quand les comptes partagent le même espace ; il exerce bien le refus du responsable pour un espace non autorisé, sans devoir créer un deuxième espace.
- false — La migration C ne change que le défaut du seuil et conserve `SECURITY INVOKER`, le corps et les permissions ; un scénario inter-espace du RPC candidats n’est pas requis pour cette correction.
- false — Le RPC de nettoyage prend volontairement un identifiant exact, comme l’exige la matrice ; les tests ne découvrent pas de fixtures par préfixe et ne lui transmettent que les identifiants créés par leur exécution.
- medium / patch — Le nettoyage des quotas recensait tous les appels postérieurs à l’instantané, ce qui pouvait supprimer un appel concurrent non créé par le test. Il ne supprime désormais que les identifiants suivis après un appel réussi et une seule nouvelle ligne observée ; une situation ambiguë fait échouer le test sans suppression élargie.
- false — Le refus d’une catégorie réelle au nom non conforme est déjà testé avec un refus `22023` et une vérification d’existence ; le motif exact est strict dans la migration, sans résultat incorrect constaté.
- medium / patch — La procédure historique ne consignait pas explicitement la catégorie et l’espace finaux de la ressource déplacée ; le `README.md` précise maintenant que l’identifiant cible et l’appartenance au même espace ont été vérifiés.
- false — Le README indique que chacune des onze catégories approuvées a été réessayée et vérifiée absente ; un relevé de résultat supplémentaire par identifiant n’est pas nécessaire à la procédure et exposerait encore les identifiants opérationnels.
- false — `tests/indexing-rls.test.mjs` ne crée pas de catégorie RLS pour ce parcours ; son problème préexistant de nettoyage des ressources reste une tâche différée distincte et ne contredit pas les critères de cette livraison.
- medium / patch — Le test du RPC ne prouvait pas qu’une autre fixture de même format reste intacte ; il crée maintenant une seconde catégorie et vérifie qu’elle subsiste après le nettoyage de l’identifiant ciblé.
- medium / patch — Le constat indépendant sur le balayage temporel des appels de quota confirme le risque ci-dessus ; le correctif limite aussi ce chemin aux identifiants explicitement suivis.

## Verification

- `node --test tests/rls-cleanup.test.mjs` : helpers et erreurs.
- `node --env-file=.env.local --test tests/supabase-rls.test.mjs` : A,
  17/17, aucun scénario requis ignoré.
- `node --env-file=.env.local --test tests/semantic-search-rls.test.mjs` : C,
  premier appel/réessai, limites, références et droits.
- `npm run lint -- tests/helpers/rls-cleanup.mjs tests/rls-cleanup.test.mjs tests/supabase-rls.test.mjs tests/semantic-search-rls.test.mjs` : aucune erreur.
- `npm run test:unit` : 120 tests réussis.
- Validation YAML avec `js-yaml` et `git diff --check` : suivi valide, diff propre.

Contrôle final du parent : les trois fichiers de tests ciblés ont été relancés
ensemble, 33/33 réussis, aucun ignoré ; lint ciblé et validateur de suivi BMAD
réussis. Lecture distante seule : aucune catégorie RLS restante, ressource
conservée dans « Documents internes » du même workspace, passages accessibles.
Comparaison locale des corps SQL de l'ancien et du nouveau RPC : identiques.
L'intégration complète n'est pas revendiquée ; voir le travail différé d'indexation.
