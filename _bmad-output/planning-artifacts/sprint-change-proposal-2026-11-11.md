# Correction de trajectoire — 2026-11-11

**Projet :** NexaMind AI
**Déclencheur :** rétrospective de la story 3.5, acceptée par Dylan le 2026-11-11
**Mode :** proposition complète en bloc
**État :** approuvée par Dylan le 2026-11-11, puis A et C livrées sur demande
explicite ; migrations appliquées et nettoyage confirmé. A et C acceptées par
Dylan le 2026-11-11 ; B reste une précision de la future story 4.16.

## 1. Résumé du problème

Trois ajustements sont demandés :

1. Retirer les catégories de test « RLS... » restantes et empêcher leur retour.
2. Faciliter la vérification de Q1, qui demande plusieurs informations.
3. Harmoniser le seuil par défaut du RPC de candidats avec celui de la recherche.

Preuves :

- [Rétrospective de la story 3.5](../implementation-artifacts/story-3-5-retro-2026-11-11.md).
- [Test RLS](../../tests/supabase-rls.test.mjs), ligne 190 : création d'une
  catégorie `RLS-<UUID>` ; lignes 625–639 : nettoyage sans suppression de catégorie.
- [Migration catégories](../../supabase/migrations/20261030140000_create_categories.sql),
  lignes 57–60 : seuls SELECT, INSERT et UPDATE sont accordés aux sessions.
  Aucun droit DELETE ni politique de suppression n'est défini.
- [Schéma des ressources](../../supabase/migrations/20261030160000_create_resources.sql),
  ligne 7 : une catégorie utilisée par une ressource ne peut pas être supprimée
  (`on delete restrict`).
- [Q1](../../tests-ia.md) demande Next.js App Router/TypeScript et les services
  PostgreSQL, authentification, stockage de fichiers et RLS de Supabase.
- [RPC candidats](../../supabase/migrations/20261110210000_search_resource_chunk_candidates.sql),
  ligne 11 : défaut 0,3 ; [configuration applicative](../../src/features/resources/semantic-search-core.ts),
  ligne 8 : seuil ressources 0,2, passé explicitement par le service.

La story 3.5 reste terminée. Le retour final 10/10 est une acceptation humaine,
pas une preuve que les défauts historiques de nettoyage n'existent plus.
L'origine précise et l'utilisation de chaque catégorie actuelle devront être
contrôlées avant toute suppression ; aucune donnée Supabase n'a été inspectée ici.

## 2. Impacts sur le projet

### Epics, stories et sprints

- **Epic 2 :** entretien technique des données de test ; aucune fonction générale
  « supprimer une catégorie » n'est ajoutée à la page Catégories.
- **Epic 3 :** harmonisation du RPC de recherche ; classement, plafond de vingt
  candidats, cinq passages affichés, références et sélection par numéro inchangés.
- **Epic 4 / 4.16 :** préciser la preuve conservée pendant l'évaluation Q1,
  sans modifier les objectifs de qualité et d'abstention de l'assistant.
- **Sprint 9 :** conserver cinq stories et leur ordre
  `4.14 → 4.15 → 4.16 → S8-2 → S8-3`. Les deux corrections techniques sont
  enregistrées hors sprint, à effectuer et à évaluer séparément avant son
  développement. Elles ne sont pas une sixième et une septième story déguisées.
- Aucun epic ajouté ou supprimé ; aucun sprint terminé redécoupé.

### PRD, architecture, UX et autres artefacts

- **PRD :** pas de changement de périmètre ni de critères SM-3/SM-4. Les dix
  questions historiques ne remplacent pas le jeu exigé par 4.16 (dix questions
  documentées et trois questions sans réponse).
- **Architecture AD-2/AD-3 :** les assertions des tests restent sous sessions
  utilisateur et RLS. La suppression de fixtures nécessite un chemin technique
  de nettoyage borné, distinct des opérations produit ; voir proposition A.
  Cette exception sera documentée si approuvée.
- **Architecture AD-5/AD-7 :** aucun changement OpenAI, embeddings 1536,
  pgvector, budget, quotas, délai ni récupération vectorielle de l'assistant.
- **UX :** aucun nouvel écran, bouton de suppression ou changement de palette.
  Les sélecteurs doivent afficher les catégories réelles restantes ; pas de
  filtre qui cache arbitrairement tous les noms commençant par « RLS ».
- **Tests et documentation :** consignes de nettoyage, preuve Q1, tests RPC
  et étapes d'application SQL à compléter après approbation.
- La préparation de 4.16 ne possède pas encore de fiche autonome dans le dépôt ;
  reporter la précision dans les epics et le plan, puis dans la fiche à sa création.

## 3. Approche recommandée

**Ajustement direct limité, sans retour en arrière ni réduction du MVP.**

- A : correction de nettoyage des fixtures et opération de retrait contrôlée.
- B : précision de vérification de Q1 dans le travail déjà prévu pour 4.16.
- C : nouvelle migration pour le défaut du RPC de candidats.

Effort relatif : moyen pour A (autorisation et protection des données), faible
pour B et C. Risque principal : supprimer une catégorie utile ou élargir des
droits ; les protections ci-dessous sont obligatoires.

Les corrections A et C précèdent le développement du sprint 9 si approuvées.
Pas de nouvelle estimation horaire ni de date de livraison. Un rollback de 3.5
n'apporterait rien ; aucun objectif produit n'est rendu impossible.

## 4. Modifications proposées — avant / après

### A — Nettoyage des catégories de test, hors sprint

**Avant :** le scénario crée une catégorie avec la session responsable, mais
ne peut pas la supprimer ; son `finally` nettoie d'autres tables uniquement.

**Après proposé :**

- Prévoir dans une nouvelle migration un RPC technique de nettoyage réservé
  au responsable connecté du workspace. Si `security definer` est nécessaire,
  fixer le `search_path`, vérifier explicitement identité, rôle et workspace,
  et révoquer l'exécution pour l'anonyme. Ce RPC n'accorde aucun DELETE général.
- Ne traiter qu'un identifiant précis de catégorie dont le nom correspond
  exactement au format de fixture `RLS-<UUID>`, avec suffixe de renommage du test
  éventuellement reconnu. Un simple préfixe `RLS` ne suffit pas.
- Refuser toute catégorie d'un autre workspace, au nom non conforme ou utilisée
  par une ressource. Ne pas supprimer ni réaffecter cette ressource.
- Le test mémorise l'identifiant créé et nettoie cette seule fixture dans son
  `finally`, avant déconnexion du responsable. Vérifier les erreurs du nettoyage,
  y compris les refus : aucun nettoyage prétendument réussi sans contrôle.
- Pour les anciennes lignes : fournir d'abord un inventaire avec identifiants,
  noms et nombre de ressources liées ; Dylan valide la liste exacte avant
  exécution. Pas de suppression globale par préfixe, de cascade ou de clé
  `service_role` dans le runner.
- Vérifier première utilisation, réessai, refus membre/anonyme/autre workspace,
  refus d'une catégorie réelle ou utilisée, et nettoyage après échec simulé.

**Artefacts concernés après accord :** nouvelle migration, test RLS, README,
consignes de test et exception de nettoyage dans AD-2/AD-3.

**Justification :** corriger la cause et les lignes résiduelles, sans créer une
fonction de suppression générale dans le MVP.

### B — Preuve de Q1, précision de 4.16

**Avant :** noter un verdict global et les sources attendues ; les précisions
du sprint 9 séparent déjà numéro, source et lien pour S8-D, pas les éléments Q1.

**Après — texte à ajouter aux consignes et à la préparation de 4.16 :**

> Pour Q1, relever séparément la preuve de Next.js App Router/TypeScript et celle
> des services PostgreSQL, authentification, stockage de fichiers et RLS de
> Supabase. Sur Recherche de ressources, noter les passages probants et leurs
> positions, puis la phrase affichée et son lien à titre complémentaire : la
> phrase ne remplace jamais la preuve du classement top 3. Sur Assistant, noter
> la réponse, les sources qui confirment les affirmations et les liens ouvrables.
> Une phrase partielle ne démontre pas, seule, toute la réponse. Les questions
> et règles de notation restent inchangées.

**Artefacts concernés après accord :** section de préparation 4.16 dans
[epics.md](epics.md), précisions du sprint 9 dans
[plan-sprints.NexMind AImd.md](plan-sprints.NexMind%20AImd.md), et section datée
dans [tests-ia.md](../../tests-ia.md). Aucun nouvel écran ni appel LLM demandé.

**Justification :** distinguer une preuve incomplète d'une erreur de sélection,
sans rouvrir la story acceptée ou déplacer le seuil de réussite.

### C — Défaut du RPC candidats, hors sprint

**Avant :** `p_min_similarity real default 0.3` dans le RPC de candidats, 0,2
explicitement transmis par la recherche de ressources.

**Après proposé :** défaut du seul `search_resource_chunk_candidates` à 0,2,
via une nouvelle migration ; ne pas modifier ni rejouer une migration appliquée.

- Préserver la signature, le corps de classement, la RLS, les permissions,
  les références et le plafond de vingt.
- Tester une invocation sans seuil et la comparer à l'invocation avec 0,2,
  avec une fixture contrôlée dont la similarité est entre 0,2 et 0,3 et
  admissible dans la fenêtre hybride. Ne pas tester seulement « aucun échec ».
- Vérifier première utilisation, réessai et refus anonyme ; vérifier que
  l'ancien RPC et l'assistant gardent leur comportement.
- Appliquer la migration seulement après validation de Dylan ; rejouer les
  contrôles dépendants avant son évaluation.

**Artefacts concernés après accord :** nouvelle migration, tests sémantiques
d'intégration/unitaires et consignes README. Aucune réindexation nécessaire.

**Justification :** même comportement implicite et explicite pour les clients
du RPC ; la page actuelle passe déjà 0,2 et ne doit pas changer.

## 5. Transmission pour réalisation

**Portée : modérée**, à cause du chemin de nettoyage privilégié et du suivi de
corrections hors sprint ; pas de refonte produit.

- **Dylan :** valider ou réviser la proposition, puis approuver les identifiants
  à nettoyer et appliquer les migrations selon les étapes fournies.
- **Développeur :** réaliser A puis C séparément sur demande, tests ciblés et
  commit pour chaque correction ; fournir les contrôles SQL avant l'application.
  S'arrêter si une erreur persiste ; aucune story terminée sans évaluation.
- **Préparation des stories :** reprendre B dans 4.16, sans démarrer le sprint 9.

Critères de réussite : plus de fixtures confirmées inutilisées dans la démo,
aucune catégorie réelle supprimée, les tests ne laissent plus leur catégorie
même après échec, le défaut RPC correspond à 0,2, Q1 possède une preuve lisible,
et le sprint 9 reste à cinq stories.

L'approbation de cette correction de trajectoire autorise son enregistrement
dans les documents de planification ; elle ne déclenche pas le développement,
la suppression de données ni l'application de migrations.

## 6. Checklist et état de décision

| Éléments | État | Résultat |
|---|---|---|
| 1.1–1.3 : déclencheur et preuves | [x] | Rétro 3.5, Q1, création sans nettoyage, seuils divergents. |
| 2.1–2.5 : epics et ordre | [x] | Aucun epic invalide ; sprint 9 et ordre conservés. |
| 3.1 : PRD | [x] | Objectifs MVP et notation préservés. |
| 3.2 : architecture | [x] | Exception technique bornée proposée pour A ; autres invariants inchangés. |
| 3.3 : UX | [x] | Aucun nouveau parcours ni camouflage des données. |
| 3.4 : artefacts secondaires | [x] | Migrations, tests et documentation identifiés. |
| 4.1 / 4.4 : ajustement direct | [x] | Option recommandée. |
| 4.2 / 4.3 : rollback / réduction MVP | [N/A] | Non nécessaires. |
| 5.1–5.5 : proposition et transmission | [x] | Avant/après, responsabilités et critères décrits. |
| 6.1 / 6.2 : cohérence | [x] | Deux corrections hors sprint ; précision B dans 4.16. |
| 6.3 : approbation complète | [x] | Dylan a répondu « Oui, j’approuve » après le passage à la validation finale. |
| 6.4 : suivi | [x] | Actions A, B et C ouvertes dans sprint-status.yaml ; aucune story marquée `done`. |
| 6.5 : transmission | [x] | Plan de réalisation ci-dessus finalisé ; démarrage sur demande distincte. |

**Décision utilisateur :** approbation explicite complète obtenue le 2026-11-11,
pour l'enregistrement de la correction de trajectoire sans démarrage du développement.

**Journal de transmission :** plan, epics, consignes de test, précision
architecturale, rétrospective et suivi synchronisés après accord. A et C sont
des corrections hors sprint ; B sera reprise dans la fiche 4.16 à sa création.
Le développeur dispose de l'ordre, des protections et des critères de contrôle.
Aucune exécution d'agent de développement, migration ou suppression n'a été lancée.

### Suite autorisée et réalisée après la validation documentaire

Dylan a ensuite autorisé le développement, les migrations et les commits. Il a
confirmé les onze identifiants inventoriés et choisi explicitement de déplacer
la seule ressource liée dans « Documents internes » avant le retrait de sa catégorie.
Cette opération ponctuelle ne modifie pas le refus permanent du RPC pour les
catégories utilisées.

A et C sont implémentées et appliquées ; les catégories approuvées sont absentes,
la ressource est conservée dans la catégorie cible du même workspace et ses
passages restent accessibles. Le contrôle final du corps SQL confirme que le
classement du RPC candidats est inchangé. Les 33 tests ciblés relancés ensemble
réussissent sans scénario ignoré, ainsi que lint et la validation du suivi YAML.
Les 120 tests unitaires ont également réussi pendant la réalisation.

Les commits de réalisation sont
`e39e23dff15d89f57719abe9f2353745f7b4ccf2` (A) et
`913213dec406db787227a7c43ac52bd47e88237c` (C), suivis de correctifs de tests.
Aucun push. L'intégration complète n'a pas été relancée ; le nettoyage préexistant
du test d'indexation est consigné séparément dans le travail différé.
Le 2026-11-11, Dylan confirme « c'est ok » après la consigne de contrôler les
catégories et Q1 (top 3 et source ouvrable) sur Recherche de ressources.
A et C sont acceptées et clôturées dans le suivi. Cette confirmation n'est pas
un nouvel essai de l'assistant ; aucune story du sprint 9 n'est commencée ou terminée.
