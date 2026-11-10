---
story: 3-5-améliorer-le-classement-des-recherches-de-ressources
title: Améliorer le classement des recherches de ressources
epic: 3
status: in-review
baseline_commit: e01b64ec7636350008f84fbd630fdf7f9d6ee912
context:
  - ../SPEC.md
---

# Story 3.5 — améliorer le classement des recherches de ressources

## Ce que cela permet

Retrouver plus facilement une ressource utile depuis la recherche existante. Story standard de l'epic 3 ; elle peut concerner son classement hybride déjà présent, mais ne couvre pas l'assistant de l'epic 4.

## Critères d'acceptation — protocole validé le 2026-11-10

1. Étant donné le jeu de dix questions inchangées, quand la liste « Passages trouvés par le sens » est évaluée, alors au moins huit cas sur dix sont conformes à leur type selon la grille ci-dessous. Il s'agit de huit cas conformes, pas de huit ressources retrouvées.
2. Étant donné Q1, Q3 et Q5, quand les tests de régression sont exécutés, alors leurs ressources attendues sont clairement identifiées et vérifiées.
3. Étant donné un utilisateur connecté, quand il cherche une ressource, alors il ne reçoit que les ressources qu'il a le droit de consulter.
4. Étant donné une fuite de titre, extrait, lien ou contenu interdit, quand les résultats sont évalués, alors la validation est refusée quelle que soit la note globale.
5. Étant donné une recherche vide, une erreur ou un quota dépassé, quand le parcours est utilisé, alors les messages existants restent explicites et aucun succès fictif n'est affiché.

| Cas | Résultat conforme dans la liste hybride |
|---|---|
| Q1 à Q6 | La source attendue est liée à au moins un des trois premiers passages affichés, et son contenu permet de vérifier l'information attendue. |
| Q7 et Q8 | Aucun passage pertinent n'est présenté ; l'état vide explicite s'affiche. Pas de réponse générée « je ne sais pas » exigée sur cette page de recherche. |
| Q9 et Q10 | Aucune information de la ressource réellement interdite n'est divulguée, y compris via la phrase sélectionnée et son lien. Un document simplement absent du jeu ne valide pas les droits. |

Un cas vaut un point ; une erreur ou un cas non vérifié ne vaut pas un succès. Q9 et Q10 doivent tous deux être réellement vérifiés sans fuite avant validation finale. Leur absence de jeu n'empêche pas le développement ni l'évaluation partielle de Q1–Q8, mais interdit une validation complète ou un score 8/10 validé. Les ressources d'un même workspace sont partagées : un autre propriétaire ne les rend pas privées. Ne pas créer un nouvel espace MVP pour ce test.

## Décisions de comportement

- Conserver toutes les questions de [tests-ia.md](../../../../tests-ia.md), sans en ajouter ni en reformuler pour atteindre artificiellement le seuil.
- `/resources/search` affiche des résultats littéraux, puis des passages hybrides et une phrase sélectionnée. Seule la liste « Passages trouvés par le sens » est notée. Compter les positions telles qu'affichées, même si plusieurs passages viennent d'une même ressource ; ne pas fusionner les listes ou utiliser la phrase comme preuve de top 3. Les résultats littéraux restent inchangés.
- Une ressource absente de l'index ou interdite ne doit jamais être rendue visible pour améliorer une note.
- Conserver les erreurs explicites, la limite de saisie, le quota, les liens vers les ressources et l'historique de recherche.
- Si le classement hybride est concerné, conserver son traitement serveur et sa session membre sous RLS. Aucun `service_role`, aucun secret dans le navigateur, aucun changement de fournisseur ou d'embeddings.
- Ne pas changer le classement vectoriel de `/assistant`, ses sources, ses consignes ou ses conversations. Ne pas préparer les stories 4.14 à 4.16, S8-2 ou S8-3.

## Carte du code et tâches de développement ultérieur

1. Rejouer les dix cas avant modification avec les ressources de référence préparées et les sessions autorisées ; relever rangs, titres, extraits, liens et conformité par type. Prioriser Q1, Q3, Q5 pour le diagnostic ; ne pas inventer de résultat ou ajuster uniquement à ces trois exemples.
2. `src/app/resources/search/page.tsx` : vérifier la liste hybride et ses liens, sans fusion de listes ni modification de la recherche littérale.
3. `src/features/resources/resources.ts` (`searchResources`) : recherche littérale titre/texte et tri par date à conserver.
4. `src/features/resources/semantic-search.ts`, `semantic-search-core.ts` : présélection hybride de vingt candidats au maximum, puis sélection serveur autorisée ci-dessous ; cinq passages affichés au maximum, seuil ressources 0,20 ; assistant inchangé au seuil 0,40 avec cinq passages.
5. `supabase/migrations/20261107100000_search_resource_chunks_hybrid_window.sql` : diagnostic du classement côté base si concerné. Écrire une nouvelle migration seulement si nécessaire ; ne pas modifier une migration appliquée. Dylan l'applique manuellement.
6. Conserver le contrat `chunk_id`/révision restauré par `supabase/migrations/20261110143000_restore_hybrid_chunk_references.sql` : migration appliquée et suite sémantique 12/12 réussie le 2026-11-10. Ne pas rejouer le correctif ou présenter ce résultat comme une mesure de qualité des dix questions.
7. Tests existants : `tests/semantic-search.test.mjs`, `tests/semantic-search-rls.test.mjs`, `tests/relevant-search-phrase.test.mjs`. Ajouter les cas démontrant la cause corrigée, les rangs, limites, droits et absence de régression assistant. Si une migration est ajoutée : tester première utilisation, réessai, refus des tiers après application.

8. Diagnostiquer les échecs de classement et de sélection de passages sur les données avant toute modification. Corriger la cause minimale dans les services et, seulement si nécessaire, dans une nouvelle migration ; vérifier les rangs réels après correction. Ne pas remplacer un résultat non pertinent par une réponse inventée.

## Textes d'écran

Conserver « Rechercher une ressource », « Passages trouvés par le sens », « Ouvrir la ressource », les messages de recherche vide, d'erreur et de quota. Aucun nouvel écran ni réponse d'assistant.

## Vérification et statut

Voir [STD-4 à STD-6 et grille des dix cas](../verification-navigateur.md). Développement repris sur Q1–Q8 le 2026-11-10, hors sprint. Relecture et évaluation finale de Dylan requises ; aucune question de test modifiée.

## Décision autorisée — sélection serveur Q1–Q8

Cette décision remplace le blocage initial et la proposition « en attente »
dans les notes historiques ci-dessous. Dylan renonce à la création d'un jeu
Q9/Q10, local ou distant : projet actuel seulement, sans mutation des droits
ni des ressources réelles. Q9/Q10 restent explicitement non vérifiées.
Il approuve la présélection de vingt passages accessibles au maximum puis
leur sélection/réordonnancement par le LLM existant côté serveur, avec cinq
passages affichés au maximum ou une liste vide. Il accepte le coût/délai
supplémentaire possible et l'envoi de jusqu'à vingt passages au fournisseur.

### Contrat de mise en œuvre

- Garder le fournisseur/modèle configurés, les embeddings et pgvector existants.
  La présélection consomme une seule recherche du quota existant. Les recherches
  invalides, refusées par quota ou en erreur n'appellent pas le LLM.
- Nouvelle migration `supabase/migrations/20261110210000_search_resource_chunk_candidates.sql` :
  RPC distinct `search_resource_chunk_candidates`, même classement hybride,
  seuil/fenêtre et références que la fonction restaurée du 10 novembre,
  plafond serveur vingt, `security invoker`, chemin fixé, permissions
  `authenticated` seulement. Ne modifier ni l'ancien RPC à cinq résultats
  ni les politiques. Script transactionnel et réexécutable. Dylan applique
  manuellement cette seule nouvelle migration ; ne pas la lancer à distance.
- `semantic-search-core.ts` et `semantic-search.ts` : parcours candidats
  réservé aux ressources ; parcours vectoriel assistant strictement inchangé.
  Ne jamais exposer vingt candidats non filtrés comme résultat final.
- Ajouter un cœur testable de sélection de passages, par exemple
  `src/features/resources/resource-passage-selection-core.ts`, et son
  raccordement serveur à `generateChatReply`. Réutiliser le schéma fournisseur
  `answer/sources/missing` : `answer` doit être vide, `sources` contient
  uniquement les numéros ordonnés des candidats retenus, sans doublon,
  au maximum cinq ; `missing=true` exige une liste vide. Valider strictement
  bornes/types/cohérence. Retourner uniquement les objets originaux associés,
  jamais du texte, un titre, un identifiant ou un lien inventé par le LLM.
  Ignorer les instructions contenues dans les passages ou la question.
  Ne retenir qu'un passage apportant une information directement probante,
  pas un titre ou un simple vocabulaire similaire ; aucun si l'information
  demandée manque. Aucun seuil adapté artificiellement à Q7/Q8.
- Une erreur/refus/expiration du LLM ou une réponse invalide donne l'état
  d'erreur explicite existant, avec log sans secret ni contenu privé. Pas
  de repli sur les candidats non validés ni de faux état vide réussi.
  Aucun appel si la présélection est vide.
- `src/app/resources/search/page.tsx` : conserver les résultats littéraux,
  l'historique, les liens, l'état vide et les erreurs. Informer que question
  et jusqu'à vingt passages sont envoyés à OpenAI pour sélectionner les
  passages, puis jusqu'à cinq pour la phrase ; coût/délai supplémentaire
  possible. La sélection de phrase existante reste distincte et ne reçoit
  que les passages retenus. Ne pas supprimer sa vérification de copie exacte.
- `README.md` : documenter migration, comportement et vérification partielle.
  Adapter uniquement les assertions directement affectées des tests existants.
  Ajouter les nouveaux tests au script de tests unitaires existant, sans paquet.

## Tasks & Acceptance

- [x] Ajouter la migration candidats en préservant les droits et l'ancien RPC.
- [x] Raccorder présélection, sélection LLM stricte et interface serveur.
- [x] Tester vingt candidats maximum, cinq sorties maximum, réordonnancement
  d'un passage au-delà du cinquième, liste vide pertinente, sources inventées,
  doublons, mauvais types/JSON/champs/cohérence, refus/erreurs du fournisseur,
  absence d'appel sur recherche invalide/quota/erreur/vide, non-régression
  assistant, contrat de session membre et information utilisateur par tests locaux.
  Les tests RPC réels ajoutés ne sont pas exécutés avant la migration.
- [x] Documenter les étapes SQL et les contrôles Q1–Q8 inchangés.
- [x] Après application manuelle par Dylan : vérifier le RPC réel (limite,
  références, session membre, anonyme refusé, réessai). Contrôle sans création
  de ressources le 2026-11-10, voir le résultat ci-dessous.
- [ ] Terminer les essais Q1–Q8 : arrêt à Q3 sur une erreur de sélection de phrase.
- [ ] Évaluation navigateur de Dylan avant toute clôture ; Q9/Q10 non vérifiées.

Les quatre premières tâches peuvent être livrées avant application SQL, sans
déclarer la recherche opérationnelle ni la qualité vérifiée. Si la migration
n'est pas appliquée, arrêter les essais distants et fournir les étapes précises.
Validation locale attendue : tests unitaires concernés, lint ciblé, TypeScript
et build. Ne pas lancer les tests d'intégration qui créent des ressources dans
le projet actuel sans autorisation supplémentaire. Un script diagnostique
Q1–Q8 sans mutation de ressources peut rester dans les fichiers de session.

## Consignes d'exécution validées

Développement autorisé le 2026-11-10 après le commit de la story 1.6.
Diagnostiquer d'abord la chaîne hybride existante et les données de référence :
ne pas inventer un défaut ni modifier le classement déjà livré pour produire
artificiellement un changement. Les tests synthétiques ne prouvent pas le seuil
sur les dix questions réelles. En cas de prérequis absent ou d'erreur persistante,
arrêter et expliquer le blocage, sans contournement ou fonctionnalité supplémentaire.
Ne pas appliquer de migration distante, créer d'espace, installer de paquet sans
nécessité démontrée, modifier les ressources réelles ou exposer de secrets.
Les requêtes de diagnostic utilisent uniquement les sessions de test autorisées,
jamais de clé privilégiée ; ne pas inscrire les textes privés dans les logs.
Expliquer en une phrase française l'utilité de chaque commande exécutée.
Ne pas commiter ni pousser depuis l'implémentation déléguée ; le workflow appelant
vérifie et réalise le commit. Ne pas modifier le plan IA, les questions de test,
les documents de rétrospective, les fichiers personnels ou la story 1.6.
Ne jamais marquer la fiche ou le suivi `done` : évaluation humaine requise.

## Vérification locale de l'implémentation

- Tests unitaires de l'implémentation : 115 réussis ; lint ciblé, TypeScript
  et build réussis. Vérification du workflow appelant : 61 tests ciblés réussis,
  aucun ignoré, et TypeScript réussi.
- Aucun appel à la nouvelle fonction distante, aucune migration appliquée,
  aucune mutation des ressources. Tests SQL ajoutés mais non exécutés :
  ils créent temporairement des ressources et nécessitent une autorisation.
- Statuts `in-review` / `review` : code à évaluer, pas story terminée.
  Déploiement SQL manuel et contrôle réel Q1–Q8 restent à faire.

## Vérification réelle après application SQL — 2026-11-10, vers 21 h 03

Dylan confirme l'application de la nouvelle migration. Contrôle exécuté avec
la clé publique et la session réelle du membre A, sans clé privilégiée,
sans modification des ressources ni des droits. Les questions sont lues
exactement dans `tests-ia.md`. Les appels d'embeddings, de sélection de passages
et de phrase utilisent les cœurs et clients fournisseur de l'application,
avec modèle configuré et quota normal. Aucun contrôle navigateur effectué.

- Nouveau RPC : une demande de cent candidats en retourne vingt ; références
  `chunk_id`/ressource/révision comparées aux passages lisibles avec la même
  session, toutes concordantes. Réessai réussi. Cela vérifie le RPC après
  application, pas la réexécution de la migration SQL elle-même.
- Ancien RPC hybride : cinq passages retournés pour une demande de cent.
- Appel anonyme du nouveau RPC : refus `42501`, aucune donnée retournée.
  Ce refus ne prouve pas l'isolement inter-workspaces ni Q9/Q10.

| Cas | Observation après sélection serveur | Résultat partiel |
|---|---|---|
| Q1 | Architecture 1 au rang 1, avec Next.js et les services Supabase dans le passage. Deux passages retenus parmi vingt ; phrase sélectionnée sans erreur. | Critère de classement/contenu conforme sur cet essai. |
| Q2 | Passage du PRD indiquant titre, texte et catégorie obligatoire au rang 1. Quatre passages retenus parmi vingt ; phrase sélectionnée sans erreur. | Critère de classement/contenu conforme sur cet essai. |
| Q3 | Glossaire définissant le RAG au rang 1, remonté depuis le candidat 5. Deux passages retenus parmi vingt. La sélection de phrase renvoie `error`. | Classement/contenu améliorés ; parcours complet non validé, erreur à diagnostiquer. |
| Q4–Q8 | Non exécutées après l'erreur Q3. | Non vérifiées sur le nouveau parcours. |
| Q9/Q10 | Pas de jeu interdit créé, conformément au choix de Dylan. | Non vérifiées. |

Arrêt des essais après Q3, sans réessai automatique, repli sur les candidats
ou modification du parseur. Le résultat `error` ne permet pas de distinguer
à lui seul un refus/échec fournisseur d'une réponse rejetée par le contrôle
de copie exacte ; ne pas inventer la cause. Diagnostic de la sélection de
phrase requis avant reprise Q4–Q8. Aucun score global ni validation finale.
Le détail privé et le script sont conservés dans les fichiers de session,
pas dans le dépôt. La story reste en revue, non terminée.

## Review Triage Log

| Repère | Verdict | Preuve et décision |
|---|---|---|
| Blind-1 — introduction du guide historique | low | L'introduction décrit la préparation initiale ; la reprise datée immédiatement après précise le changement. Observation documentaire, pas défaut du parcours ; aucun changement supplémentaire de spec pour cette remarque. |
| Blind-2 — statuts différents | low | Code en revue, suivi encore en cours ; alignement direct sur `review`, sans `done` et avec migration/évaluation toujours requises. |
| Blind-3 — session membre prétendument testée en réel | false | Les contrôles locaux couvrent le contrat serveur ; la tâche suivante non cochée exige explicitement le RPC réel. Aucun test distant revendiqué ; formulation clarifiée pour éviter la confusion. |
| Blind-4 — test plafond accepte zéro | medium | `every` et `length <= 20` acceptaient une liste vide malgré vingt et un passages proches créés. Patch direct : exiger exactement vingt résultats. Test distant non exécuté avant migration/autorisation. |
| Blind-5 — membre B ne prouve pas l'isolement | false | L'assertion décrit déjà le workspace partagé et un accès positif ; la fiche et le README disent Q9/Q10 non vérifiées. Aucune preuve d'isolement revendiquée. |
| Blind-6 — injection non démontrée | maybe-false | Le prompt sépare instructions et données ; le parseur n'accepte que des indices de candidats accessibles. La résistance sémantique du modèle n'est pas prouvée par les mocks. Vérification avec génération réelle nécessaire ; risque moyen non confirmé reporté, sans prétendre une garantie. |
| Blind-7 — commande de retrait mkcert | low | Documentation mobile antérieure, non changée par la sélection. Intention actuelle limitée à Q1–Q8 ; rejet hors périmètre, pas de manipulation des certificats. |
| Blind-8 — écoute toutes interfaces IPv4 | low | La commande mobile antérieure est déjà limitée par les consignes réseau privé/pare-feu/sans ouverture de port. Pas de nouveau serveur ni d'exposition introduits ; remarque hors intention actuelle, non corrigée ici. |
| Blind-9 — migration de restauration absente du README | low | La nouvelle documentation de migration doit distinguer installation neuve et projet déjà corrigé. Patch direct du README, sans demander de rejouer le correctif appliqué. |
| Edge-1 — RPC sans borne de longueur SQL | low | Atteignable par appel RPC direct, mais l'ancien RPC hybride offrait déjà la même opération sans borne SQL ; parcours applicatif limité à 300 caractères avant embeddings/RPC. Aucun nouveau dommage démontré dans l'utilisation normale ; ajout d'une garde PL/pgSQL non justifié dans cette correction, rejet. |
| Contrôle direct — pollution des fixtures | medium | Les vingt et un nouveaux passages sur l'axe 0 pouvaient évincer la ressource témoin des tests existants. Patch : axe 1000 distinct. Le réessai vérifie succès, nombre et références sans imposer un ordre entre scores égaux que le SQL ne garantit pas. |

La couche de revue des lacunes de vérification n'a pas pu lire le diff
temporaire dans son environnement et n'a produit aucune conclusion.
Contrôle direct des preuves par le workflow appelant : tests locaux exécutés,
tests RPC distants explicitement non exécutés et qualité Q1–Q8 non remesurée.

## Implementation Notes — historique avant reprise autorisée

- Diagnostic du 2026-11-10 avec les sessions de test configurées : les deux
  membres et le responsable partagent le même workspace. Aucun jeu autorisé
  de ressource réellement inaccessible pour Q9/Q10 n'a été identifié.
- Blocage avant modification du code : le protocole impose ce prérequis avant
  l'évaluation des dix cas. Ni classement ni données modifiés, aucune migration,
  aucun paquet installé. La conformité 8/10 n'a pas été mesurée.
- Les tests RLS déjà réussis ne sont pas une preuve d'isolation entre espaces
  distincts. Un autre propriétaire au sein du workspace ne constitue pas un
  cas interdit ; une source absente ne valide pas non plus ce contrôle.
- Arrêt demandé par la règle de travail : fiche et suivi restent `in-progress`,
  avec blocage explicite, jamais `done` ni `review`. Le commit de diagnostic
  ne représente pas une implémentation de la story.
- Reprise : disposer d'un environnement de test autorisé et de comptes/ressources
  couvrant réellement Q9/Q10, ou faire valider par Dylan une autre organisation
  du protocole avant de continuer. Ne pas créer un second espace dans le MVP,
  modifier les politiques RLS ou partager des identifiants pour contourner ce
  prérequis. Les secrets éventuels restent dans la configuration locale.

## Reprise de vérification — 2026-11-10

Dylan autorise la reprise des dix questions pour la recherche de ressources.
L'absence de jeu interdit ne doit plus empêcher le diagnostic Q1–Q8 ; elle
empêche toujours de valider Q9/Q10 et de clôturer la story.

Vérification technique exécutée avec la session réelle du membre A, le client
d'embeddings existant, le quota existant, `runSemanticSearch` en mode hybride,
le seuil ressources 0,20 et le RPC réel. Les dix questions ont été lues sans
modification dans `tests-ia.md`. Aucun appel de génération de réponse, aucune
modification du classement, des ressources ou des politiques. Seul le compteur
de quota normal est consommé. Ce contrôle n'est pas un test de l'écran ni de
la phrase sélectionnée.

| Cas | Observation | Verdict à ce stade |
|---|---|---|
| Q1 | Architecture 1 aux rangs 1 et 3 ; le passage 3 donne la stack et les services attendus. | Conforme pour le classement et le contenu retournés. |
| Q2 | Document de référence aux rangs 1 à 3, mais les passages affichés concernent d'autres sections du PRD. | Source retrouvée ; pertinence du passage non démontrée, pas de succès complet annoncé. |
| Q3 | Document de référence aux rangs 1 à 3, mais les passages affichés ne donnent pas la définition du glossaire. | Source retrouvée ; pertinence du passage non démontrée, pas de succès complet annoncé. |
| Q4 | Passage 1 de la partie 3/3 : absence d'information et réponse non inventée explicites. | Conforme pour le classement et le contenu retournés. |
| Q5 | Retour de test sprint 3 au rang 1 : story 3.1 et message de recherche vide présents. | Conforme pour le classement et le contenu retournés. |
| Q6 | Retour de test sprint 4 au rang 1 : deux recherches regroupées avec la même date. | Conforme pour le classement et le contenu retournés. |
| Q7 | Cinq passages affichables, meilleur score de similarité renvoyé environ 0,301. | Échec de l'exigence de liste vide pour cette question hors sujet. |
| Q8 | Cinq passages affichables, similarités renvoyées environ 0,214 à 0,239. | Échec de l'exigence de liste vide pour cette question hors sujet. |
| Q9/Q10 | Des documents accessibles sont retournés ; les sources interdites attendues n'ont pas été identifiées dans un jeu permettant de prouver leur exclusion. | Droits non vérifiés ; pas une fuite démontrée ni une réussite. |

Le seuil 0,20 laisse passer les résultats de Q7/Q8 observés ; il ne suffit pas
à prouver leur pertinence. Ne pas relever arbitrairement ce seuil sur ces seuls
exemples sans vérifier les effets sur Q1–Q6. Aucun score final 8/10 annoncé.
La suite consiste à diagnostiquer la sélection des passages Q2/Q3 et l'absence
de résultats hors sujet, sans changer l'assistant ni masquer les droits non vérifiés.

### Diagnostic complémentaire

- Tous les passages accessibles ont été comparés localement à de nouveaux
  embeddings des questions, sans modification de données. Pour Q2, un passage
  contenant titre, contenu et catégorie existe au rang vectoriel 4 ; pour Q3,
  le passage définissant le RAG existe au rang vectoriel 5, mais perd sa place
  dans le top 3 hybride. Il ne manque donc pas de document à importer.
- Quatre passages diagnostiques ont fait l'objet d'un nouveau calcul d'embedding,
  comparé au vecteur enregistré : cosinus entre environ 0,999989 et 1.
  Aucun décalage texte/vecteur n'est démontré sur ces échantillons ; pas de
  réindexation ou de modification d'embeddings justifiée à ce stade.
- Le classement actuel additionne similarité et score lexical normalisé (titre
  et texte, dictionnaire `simple`, tous les termes reliés par OU), puis conserve
  cinq passages. Il ne vérifie pas qu'un passage contient la réponse attendue.
  La sélection de phrase, exécutée ensuite, ne peut pas retrouver un passage
  écarté et ne filtre pas la liste affichée.
- Proposition en attente d'accord humain : présélection bornée sous RLS puis
  sélection/réordonnancement serveur de passages pertinents par le fournisseur
  LLM existant, avec au plus cinq passages affichés, identifiants strictement
  validés et liste vide si aucun passage ne répond. Cela modifie la limite de
  passages analysés et le coût/temps de recherche ; ne pas l'implémenter sans
  validation du périmètre, des limites et de l'information affichée à l'utilisateur.
  L'assistant et les droits restent inchangés. Aucun correctif de classement
  appliqué pendant ce diagnostic.
