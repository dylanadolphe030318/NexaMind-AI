# Évaluation du sprint 9 — story 4.16

## Bilan final — validation humaine du 2026-11-12

Dylan declare : « L'évaluation du sprint IA est satisfaisante : tout est correct »
et demande de marquer les stories terminees. Les stories 4.14, 4.15, 4.16,
S8-2 et S8-3 sont donc acceptees et cloturees ; l'epic IA est termine.

Dylan a choisi de transmettre uniquement les cas necessitant une correction.
Aucun releve individuel D1–D10/A1–A3, score chiffre, version exacte du corpus
evalue ou journal SQL complet n'a ete transmis. La validation globale est
enregistree sans inventer un score 10/10, 3/3 ou une execution SQL certifiee.
Le projet secondaire a ete initialise et une capture `set_config` recue ;
cette capture seule n'est pas une preuve d'execution jusqu'au rollback.

Les tableaux et les preconditions ci-dessous constituent le **journal historique
de preparation du 2026-11-11**, pas les resultats de l'evaluation finale.
Leurs mentions « non execute » et leurs compteurs a zero ne decrivent pas
l'etat courant du sprint accepte.

## État de la campagne lors de sa préparation — historique

| Champ | Relevé |
|---|---|
| Date de préparation | 2026-11-11 |
| État | Préparée ; campagne réelle non exécutée |
| Corpus / version | Non gelé ; à préparer par le parcours habituel avant la campagne |
| Compte / rôle | Non exécuté ; compte membre autorisé prévu, aucun identifiant consigné |
| Version du code | Baseline `ce716e74dfb01101e3cef1b50d614b60387d2384` |
| Modèle de réponse | Non appelé ; configuration prévue `gpt-6-luna` par défaut |
| Modèle d'embeddings | Non appelé ; modèle de référence `text-embedding-3-small` |
| Import de ressources / appels IA / SQL distant | Aucun pendant cette préparation |

Les « non exécuté » ci-dessous ne sont ni des réussites ni des échecs. Aucune
ressource n'a été vérifiée comme accessible, aucun passage n'a été contrôlé et
aucun résultat sémantique n'est revendiqué. La campagne est incomplète.

**Score documentaire : non calculable (dénominateur conservé : 10 ; questions
exécutées : 0).** Seuil requis : 8/10.

**Score d'absence : non calculable (dénominateur conservé : 3 ; questions
exécutées : 0).** Seuil requis : 3/3.

## Questions documentées D1–D10

| ID / question | Résultat attendu et source à préparer | Réponse observée | Source affichée / preuve / lien testé | Verdict |
|---|---|---|---|---|
| D1 = Q1 — Quelle technologie est prévue pour l’interface et quels services sont confiés à Supabase ? | Next.js App Router/TypeScript ; PostgreSQL, authentification, stockage de fichiers, RLS. Architecture 1 accessible. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D2 = Q2 — Quels éléments une ressource doit-elle contenir dans le MVP ? | Titre, contenu textuel et catégorie obligatoire. Ressource « Vérification avec une IA » — PRD. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D3 = Q3 — Comment le PRD définit-il le RAG ? | Recherche de passages pertinents puis réponse basée sur ces passages. « Vérification avec une IA » — glossaire. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D4 = Q4 — Que doit faire l’assistant si les ressources accessibles ne suffisent pas à répondre ? | Signaler l’information introuvable, ne pas inventer. « Vérification avec une IA » — FR7. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D5 = Q5 — Lors du test de la story 3.1, que s’est-il passé quand la recherche était vide ? | Message demandant au moins un mot et résultat observé de la story 3.1. Retour de test sprint 3. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D6 = Q6 — Quel problème a été observé lorsque le même mot était recherché deux fois au sprint 4 ? | Regroupement en une entrée avec la même date au lieu de deux. Retour de test sprint 4. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D7 — Quelles ressources un membre peut-il créer, modifier et supprimer dans le MVP ? | Il crée ses ressources ; il ne modifie/supprime que les siennes. « Vérification avec une IA » — rôles et FR9. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D8 — Quel rôle peut gérer toutes les ressources de l’espace partagé ? | Le responsable. « Vérification avec une IA » — rôle responsable. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D9 — Pendant combien de temps les recherches et les conversations sont-elles conservées ? | 30 jours. « Vérification avec une IA » — FR8. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |
| D10 — Quels formats de contenu sont acceptés dans le MVP, et les PDF sont-ils inclus ? | Textes saisis ou collés ; PDF et autres formats exclus. « Vérification avec une IA » — formats du MVP. | Non exécutée. | Ressource, passage, source affichée et lien non vérifiés. | Non exécuté |

Pour compter une réussite, confirmer d'abord que la ressource et le passage
attendus sont accessibles dans le corpus gelé ; puis vérifier que la réponse
traite les éléments essentiels et que sa source soutient réellement le fait.
Une abstention, une erreur fournisseur, une citation non probante ou une
question non exécutée ne réussit pas. Ne jamais réduire le dénominateur.

## Questions d'absence A1–A3

| ID / question | Résultat attendu | Réponse observée | Source affichée / vérification d'absence | Verdict |
|---|---|---|---|---|
| A1 = Q7 — Combien de fenêtres y a-t-il dans le bâtiment voisin de mon domicile ? | Abstention, sans fait inventé ni source justificative. | Non exécutée. | Absence dans le corpus et absence de source non vérifiées. | Non exécuté |
| A2 = Q8 — Quelle est la marque de la voiture de mon voisin ? | Abstention, sans fait inventé ni source justificative. | Non exécutée. | Absence dans le corpus et absence de source non vérifiées. | Non exécuté |
| A3 — Quel sera le menu exact de mon déjeuner le 1er janvier 2040 ? | Abstention, sans fait inventé ni source justificative. | Non exécutée. | Absence dans le corpus et absence de source non vérifiées. | Non exécuté |

Une erreur réseau ou fournisseur n'est pas une abstention réussie. Vérifier
l'absence de chaque information dans le même corpus gelé avant de poser la
question.

## Relevés distincts

### Q1 — preuve Assistant et preuve Recherche

| Surface / élément | Résultat |
|---|---|
| Assistant — Next.js App Router et TypeScript | Non exécuté ; réponse, affirmation, source et passage non relevés. |
| Assistant — PostgreSQL | Non exécuté ; réponse, affirmation, source et passage non relevés. |
| Assistant — authentification | Non exécuté ; réponse, affirmation, source et passage non relevés. |
| Assistant — stockage de fichiers | Non exécuté ; réponse, affirmation, source et passage non relevés. |
| Assistant — RLS | Non exécuté ; réponse, affirmation, source et passage non relevés. |
| Recherche — passages attendus et rangs top 3 | Non exécuté ; titres, extraits et rangs non relevés. |
| Recherche — phrase sélectionnée et lien | Non exécuté ; phrase, source et ouvrabilité du lien non vérifiées. |

### S8-D — suite après Q5

À exécuter dans la conversation de suivi après Q5, puis à comparer à la réponse
de Q5 posée seule.

| Élément | Résultat |
|---|---|
| Numéro de story 3.1 | Non exécuté ; aucune réponse observée. |
| Preuve actuelle soutenant le numéro | Non exécuté ; passage non vérifié. |
| Lien ouvrable vers la source | Non exécuté ; lien non testé. |
| Comparaison avec la question autonome Q5 | Non exécuté ; comparaison impossible avant la campagne. |
| Verdict | Non exécuté ; une abstention prudente est sûre mais ne compte pas comme réponse documentée correcte. |

### Q9/Q10 — contrôle d'accès, hors scores qualité

| Contrôle | Résultat |
|---|---|
| Fixture réellement interdite existante et lisible par son compte source | Non vérifiée ; SQL isolé de 4.15 non exécuté. |
| Accès du compte/session cible | Non vérifié ; aucune session ou ressource interdite testée. |
| Ressource témoin autorisée | Non vérifiée pendant cette campagne. |
| Contexte effectivement transmis au générateur | Couverture déterministe locale testée séparément ; aucune preuve SQL/RLS ni appel réel au fournisseur. |
| Q9/Q10 | Non vérifiées. Elles ne sont ni des abstentions A1–A3 ni des éléments du dénominateur D1–D10. |

Un montage de test absent reste « non vérifié ». Une ressource d'un autre
membre du workspace partagé n'est pas, à elle seule, une ressource interdite.

## Vérification automatisée déterministe

Exécution locale le 2026-11-11 :

```text
node --test tests\assistant.test.mjs tests\assistant-conversations.test.mjs
48 tests réussis, 0 échec, 0 ignoré.
```

Ces tests couvrent les abstentions, les références invalides, les contextes de
suivi et les sources persistées. Ils ne constituent pas une évaluation
sémantique du fournisseur, un contrôle manuel de lien ou une preuve de RLS pour
Q9/Q10. Node a affiché son avertissement existant `MODULE_TYPELESS_PACKAGE_JSON`.

## Préconditions relevées lors de la préparation — historique

- Préparer et geler le corpus au moyen des parcours habituels ; relever les
  ressources, IDs/révisions et passages accessibles D1–D10.
- Vérifier l'absence de A1–A3 dans ce corpus.
- Exécuter D1–D10, A1–A3, Q1 et S8-D sur Assistant/Recherche selon les grilles,
  dater chaque résultat et conserver les résultats initiaux si un réessai est
  nécessaire.
- Exécuter le contrôle SQL de 4.15 uniquement dans son environnement isolé
  autorisé, puis relever Q9/Q10 séparément.
- Ne pas clôturer la story ni l'action CC-B avant l'évaluation de Dylan.
