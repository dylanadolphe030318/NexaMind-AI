# Contrat de réalisation du sprint 9

## Ordre et points d'arrêt

| Ordre | ID | Fiche | Prérequis fonctionnel |
|---|---|---|---|
| 1 | 4-14 | [Affirmations et sources](stories/4-14-relier-les-affirmations-aux-sources.md) | Sprint 8 et corrections A/C acceptés |
| 2 | 4-15 | [Non-divulgation](stories/4-15-empecher-la-divulgation-de-ressources-non-autorisees.md) | Contrat des citations de 4.14 |
| 3 | 4-16 | [Évaluation](stories/4-16-verifier-la-qualite-et-l-abstention-de-l-assistant.md) | 4.14 et 4.15 évaluées |
| 4 | s8-2 | [Catégories](stories/s8-2-categories-en-listes-deroulantes.md) | Ordre planifié, aucune dépendance IA nouvelle |
| 5 | s8-3 | [Cartes](stories/s8-3-cartes-mauve-pale.md) | Surfaces de 4.14 et S8-2 stabilisées |

Les cinq fiches sont préparées, pas développées. Dylan a choisi sans nouvelle
pause de relecture de fiche (`spec_checkpoint: false`), avec pause après chaque
story (`done_checkpoint: true`). Plus tard : une story à la fois, un commit par
story, arrêt en cas d'erreur persistante ; livraison en revue jusqu'à son évaluation.
Pas de push automatique. La préparation n'autorise aucun travail de code.

## Architecture à préserver

- `src/features/assistant/assistant.ts` utilise `searchPassages` :
  classement vectoriel, seuil 0,40 et cinq passages. Recherche de ressources :
  RPC candidats vingt, seuil 0,20, puis zéro à cinq passages sélectionnés.
  Ne pas remplacer un parcours par l'autre pour augmenter un score.
- OpenAI `gpt-6-luna`, embeddings `text-embedding-3-small` de 1536 dimensions,
  pgvector dans Supabase ; secrets depuis l'environnement serveur, jamais
  `NEXT_PUBLIC_` pour une clé IA ou privilégiée.
- Budgets actuels : assistant 500 tokens, sélections de ressources 2048 ;
  délai 30 secondes ; règles de quotas et dix échanges récents inchangés.
- Le client OpenAI partage actuellement le schéma `answer/sources/missing`
  entre assistant et sélections. Une évolution du format de l'assistant doit
  isoler ce contrat sans changer le format des deux sélections de ressources.
- L'historique aide à comprendre une question, jamais à prouver un fait.
  Les preuves proviennent des passages actuels autorisés. Réponses historiques
  signalées comme telles ; source retirée : « Source non disponible ».

## Citations et vérification

Les références doivent rendre observable l'association fait/source sur la
réponse et après réouverture. Le serveur valide les indices/identifiants contre
les passages effectivement fournis ; le modèle ne choisit jamais une URL libre.
Une citation structurellement valide ne garantit pas qu'elle prouve le fait :
tester les contre-exemples contrôlés et vérifier les passages pendant l'évaluation.
Ne pas ajouter de vérificateur LLM externe ou d'appel supplémentaire par défaut.

Conserver la lecture des réponses anciennes sans leur inventer une association.
Si les relations persistantes changent, créer une migration additive et ses tests
atomiques ; ne jamais rejouer ni modifier une migration appliquée. Les contrôles
demandés sont première utilisation, réessai, refus d'un tiers et compatibilité
historique. Une migration installée ou un test ignoré ne prouve pas le scénario.

## Preuve des droits, sans détour produit

Tout membre peut lire les ressources du workspace commun. Un autre propriétaire
n'est donc pas une preuve d'interdiction ; les conversations, elles, sont privées.
Ne pas créer de second workspace persistant dans la démo, ne pas déplacer des
ressources réelles et ne pas changer les droits pour réussir Q9/Q10.

Le futur développeur fournira un test SQL dans un environnement isolé :
fixtures fictives nécessaires à une séparation de workspace, installation par
chemin de confiance distinct, changement vers le rôle et la session testés pour
les assertions, puis `ROLLBACK` même en cas d'échec. Pas d'usage produit de cette
exception. Tester ressource, passages et RPC de récupération avec ces sessions.
Compléter avec un test exécutable de l'orchestration qui capture le contexte
effectivement transmis et exclut le marqueur interdit. Un faux `retrieve` vide
ne suffit pas à prouver RLS ; un test SQL seul ne prouve pas le prompt assemblé.
Si l'environnement isolé manque, signaler le contrôle non vérifié et arrêter la
clôture de 4.15, sans présenter une absence d'information comme contrôle d'accès.

## Évaluation et nettoyage

Le [fichier de test](../../../tests-ia.md) conserve Q1–Q10 et ajoute une section
sprint 9. Qualité : D1–D10 distinctes, dix questions avec preuves accessibles ;
absence : A1–A3 ; droits : Q9/Q10 séparées, pas dans le dénominateur 8/10.
Consigner la version du corpus, le compte/rôle sans identifiants secrets, la date,
la réponse observée, la preuve et le verdict. Préparer les ressources manquantes
par leur parcours normal plus tard ; aucune importation aujourd'hui.

Utiliser des données fictives ou autorisées, nettoyer les IDs exacts créés, garder
les erreurs de nettoyage visibles et ne pas toucher aux données d'une autre
exécution. Ne pas réintroduire les catégories de test RLS déjà retirées.
Les 33 tests techniques des corrections A/C ne sont pas un score du sprint 9.

## Sources de décision

- [Plan validé](../../planning-artifacts/plan-sprints.NexMind%20AImd.md), sprint 9
  et précisions des 10 et 11 novembre.
- [Epics](../../planning-artifacts/epics.md), stories 4.14–4.16.
- [PRD](../../planning-artifacts/prds/prd-projet-ia-2026-10-27/prd.md),
  FR-7, FR-9 et objectifs de qualité.
- Fiches S8-2 et S8-3 transférées du sprint 8 avec identifiants et critères
  conservés ; les anciennes copies sont remplacées par une indication de transfert.
