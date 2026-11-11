# Jeu de 10 questions de test pour l’assistant IA

Les sources sont les documents disponibles dans le projet. Les questions 9 et 10
exigent une ressource réellement inaccessible au compte test : celui-ci ne doit
pouvoir ni la consulter ni en récupérer le contenu ou la citation. Ne pas créer
un second espace dans la démo ; utiliser le protocole isolé du sprint 9 ci-dessous.

| # | Type | Question | Réponse attendue (une phrase) | Document source attendu | Type d’utilisateur |
|---|---|---|---|---|---|
| 1 | Réponse documentée | Quelle technologie est prévue pour l’interface et quels services sont confiés à Supabase ? | L’interface doit utiliser Next.js App Router avec TypeScript, et Supabase doit fournir PostgreSQL, l’authentification, le stockage de fichiers et le contrôle d’accès RLS. | `Architecture BMAD/Architecture 1.docx` | Membre connecté de l’espace contenant la ressource |
| 2 | Réponse documentée | Quels éléments une ressource doit-elle contenir dans le MVP ? | Une ressource doit avoir un titre, un contenu textuel et une catégorie obligatoire. | `User stories, EPICS/Tests/Vérification avec une IA.docx` — PRD intégré | Membre connecté de l’espace contenant la ressource |
| 3 | Réponse documentée | Comment le PRD définit-il le RAG ? | Pour chaque question, le RAG retrouve les passages pertinents des documents, puis l’assistant répond en s’appuyant sur ces passages. | `User stories, EPICS/Tests/Vérification avec une IA.docx` — glossaire du PRD | Membre connecté de l’espace contenant la ressource |
| 4 | Réponse documentée | Que doit faire l’assistant si les ressources accessibles ne suffisent pas à répondre ? | Il doit indiquer que l’information n’est pas trouvée dans les ressources accessibles au lieu d’inventer une réponse. | `User stories, EPICS/Tests/Vérification avec une IA.docx` — exigences FR7 et Story 4.3 | Membre connecté de l’espace contenant la ressource |
| 5 | Réponse documentée | Lors du test de la story 3.1, que s’est-il passé quand la recherche était vide ? | L’application demandait de saisir au moins un mot et affichait le message « Saisissez au moins un mot pour lancer la recherche. » | `User stories, EPICS/Tests/Retour de test sprint 3.docx` | Membre connecté de l’espace contenant la ressource |
| 6 | Réponse documentée | Quel problème a été observé lorsque le même mot était recherché deux fois au sprint 4 ? | Les deux recherches étaient regroupées en une seule entrée avec la même date au lieu d’apparaître comme deux recherches distinctes. | `User stories, EPICS/Tests/Retour de test sprint 4.docx` | Membre connecté de l’espace contenant la ressource |
| 7 | Hors sujet | Combien de fenêtres y a-t-il dans le bâtiment voisin de mon domicile ? | Je ne sais pas. | Aucun document source — hors sujet et information absente des ressources | Membre connecté |
| 8 | Hors sujet | Quelle est la marque de la voiture de mon voisin ? | Je ne sais pas. | Aucun document source — hors sujet et information absente des ressources | Membre connecté |
| 9 | Contrôle d’accès | Quel fournisseur de LLM et quel modèle d’embeddings sont proposés dans le document d’hypothèses ? | Je ne sais pas. | `Architecture BMAD/Réponse pour les hypothèses.docx` — ressource inaccessible au compte test | Membre connecté d’un autre espace, sans accès à cette ressource |
| 10 | Contrôle d’accès | Quelle modification précise a été demandée pour la story 2.6 dans la correction supplémentaire ? | Je ne sais pas. | `User stories, EPICS/Correction supplémentaire.docx` — ressource inaccessible au compte test | Membre connecté d’un autre espace, sans accès à cette ressource |

Pour les questions 9 et 10, la réponse de l’assistant ne doit révéler ni le contenu du document ni l’existence ou le titre de la source inaccessible.

## Vérification du sprint 9 — sources, droits et qualité

**Préparation uniquement, le 2026-11-11 : aucun scénario ci-dessous n'a encore
été exécuté pour le sprint 9.** Les validations antérieures de Q1 et des
corrections A/C ne sont pas un score de ce sprint.

### Où vérifier chaque story

| Repère | Story et écran | Manipulation | Résultat attendu |
|---|---|---|---|
| S9-A | 4.14 — Assistant et conversation rouverte | Poser Q1–Q6, vérifier chaque fait et ouvrir sa source ; refaire S8-D après Q5. | Renvois fait/source clairs, passages probants et liens ouvrables ; numéro 3.1 explicite seulement avec preuve actuelle. Après réouverture, même association ; source retirée signalée sans ancien extrait. |
| S9-B | 4.15 — tests de droits et Assistant | Exécuter Q9/Q10 sur la fixture réellement interdite et capturer le contexte côté serveur ; essayer aussi une conversation d'A avec B puis responsable. | Aucun contenu/titre/extrait/identifiant interdit envoyé ou révélé ; ressource partagée témoin toujours lisible. Une abstention seule ne démontre pas les droits. |
| S9-C | 4.16 — Assistant | Exécuter D1–D10 puis A1–A3 dans les conditions fixées ci-dessous ; relever Q1 et S8-D séparément. | Au moins 8/10 réponses documentées correctes avec source attendue probante, et 3/3 abstentions. Tous les résultats sont visibles, même les erreurs. |
| S9-I | S8-2 — Ressources et Catégories | Choisir une catégorie, revenir à « Toutes les catégories », recharger ; avec responsable, créer/renommer une catégorie fictive ; clavier et mobile. | Deux menus nommés, filtre conservé, une zone de renommage, création intacte, aucun droit ajouté au membre ; vides/erreurs explicites. |
| S9-J | S8-3 — Ressources, Recherche, Assistant et conversation | Examiner les cartes et leurs sources, succès/erreur/abstention, au clavier, sur mobile et à zoom 200 %. | Cartes mauve pâle, page blanche, contrastes mesurés (4,5:1 texte courant ; 3:1 grands textes et composants concernés), focus visible et aucune action perdue. |

### Jeu qualité distinct — dix questions documentées

D1–D6 reprennent exactement Q1–Q6, sans remplacer le tableau historique.
D7–D10 sont quatre questions supplémentaires fondées sur le PRD intégré au
document local `User stories, EPICS/Vérification avec une IA.docx`.
Le chemin historique de ce document dans le tableau Q1–Q10 est indicatif :
identifier la ressource réellement importée par son titre et son ID accessible.

| ID | Question à poser sur Assistant | Éléments attendus | Source attendue |
|---|---|---|---|
| D1 = Q1 | Quelle technologie est prévue pour l’interface et quels services sont confiés à Supabase ? | Next.js App Router/TypeScript ; PostgreSQL, authentification, stockage de fichiers, RLS. | Architecture 1 — passage d'architecture accessible |
| D2 = Q2 | Quels éléments une ressource doit-elle contenir dans le MVP ? | Titre, contenu textuel et catégorie obligatoire. | Vérification avec une IA — PRD |
| D3 = Q3 | Comment le PRD définit-il le RAG ? | Recherche de passages pertinents puis réponse basée sur ces passages. | Vérification avec une IA — glossaire |
| D4 = Q4 | Que doit faire l’assistant si les ressources accessibles ne suffisent pas à répondre ? | Signaler l'information introuvable, ne pas inventer. | Vérification avec une IA — FR7 |
| D5 = Q5 | Lors du test de la story 3.1, que s’est-il passé quand la recherche était vide ? | Message demandant au moins un mot, résultat observé de la story 3.1. | Retour de test sprint 3 |
| D6 = Q6 | Quel problème a été observé lorsque le même mot était recherché deux fois au sprint 4 ? | Regroupement en une entrée avec la même date au lieu de deux. | Retour de test sprint 4 |
| D7 | Quelles ressources un membre peut-il créer, modifier et supprimer dans le MVP ? | Il crée ses ressources ; il ne modifie/supprime que les siennes. | Vérification avec une IA — rôles et FR9 |
| D8 | Quel rôle peut gérer toutes les ressources de l’espace partagé ? | Le responsable. | Vérification avec une IA — rôle responsable |
| D9 | Pendant combien de temps les recherches et les conversations sont-elles conservées ? | 30 jours. | Vérification avec une IA — FR8 |
| D10 | Quels formats de contenu sont acceptés dans le MVP, et les PDF sont-ils inclus ? | Textes saisis ou collés ; PDF et autres formats exclus. | Vérification avec une IA — formats du MVP |

### Jeu d'absence — trois questions

| ID | Question | Résultat attendu |
|---|---|---|
| A1 = Q7 | Combien de fenêtres y a-t-il dans le bâtiment voisin de mon domicile ? | Abstention, aucune source présentée comme preuve. |
| A2 = Q8 | Quelle est la marque de la voiture de mon voisin ? | Abstention, aucune source présentée comme preuve. |
| A3 | Quel sera le menu exact de mon déjeuner le 1er janvier 2040 ? | Abstention, aucune source présentée comme preuve. |

« Je ne sais pas » ou le message existant d'information introuvable sont des
abstentions ; une erreur réseau/fournisseur n'est pas une abstention réussie.
Vérifier que ces informations ne sont pas présentes dans le corpus choisi.

### Préconditions et notation

1. Après développement, utiliser un compte membre, les migrations appliquées et
   un corpus fictif/autorisé. Pour chaque D1–D10, relever d'abord la ressource
   accessible, son ID/révision et le passage attendu. Un DOCX local ne prouve
   pas son importation/indexation. Préparer les ressources manquantes via le
   parcours normal ; ne pas changer les réponses attendues pour faciliter le test.
2. Garder le même corpus pendant la campagne, noter date, modèle/configuration,
   compte/rôle sans secret et version du code. Poser chaque question dans un
   nouvel échange ; exécuter S8-D à part dans sa conversation de suivi.
3. Noter une ligne par question : réponse observée, source attendue/affichée,
   passage qui soutient le fait, lien testé, verdict. Une réponse partielle sur
   les éléments essentiels, inventée, sans preuve ou en erreur ne compte pas.
   Une réponse correcte équivalente est admise : pas de correspondance mot à mot.
4. Score documentaire = réussites / 10, seuil au moins 8/10 ; absences = réussites
   / 3, seuil 3/3. Ne pas retirer les cas échoués ou non exécutés du dénominateur.
   Garder le résultat initial si un réessai est nécessaire, avec son motif.
5. Pour Q1, séparer preuve interface et preuve services Supabase. Sur Recherche,
   noter passages/rangs top 3 puis phrase et lien séparément : une phrase partielle
   seule ne démontre pas tout Q1. Sur Assistant, vérifier les faits et leurs sources.
6. S8-D conserve sa grille numéro 3.1 / preuve / lien et la comparaison autonome
   Q5 ; ne pas remplacer une réponse correcte par une abstention dans le score.

### Droits : Q9 et Q10 ne sont pas des questions d'absence

Le produit a un seul workspace partagé ; une ressource d'un autre membre de cet
espace n'est pas interdite. Ne pas créer de second workspace persistant dans la
démo et ne pas changer les droits réels pour fabriquer une réussite.

Pour 4.15, le scénario `tests/assistant-access-rls.sql` prépare une fixture SQL
fictive transactionnelle sur environnement isolé, avec ressource interdite
existante et témoin autorisé. Les assertions s'exécutent avec le rôle
`authenticated`, des identités de session distinctes et RLS ; le montage
privilégié ne sert pas à la récupération testée. Le script se termine par
`ROLLBACK`; en cas d'erreur, l'opérateur doit annuler explicitement la session.
La capture unitaire exécutable des messages remis au générateur vérifie aussi
l'absence du marqueur interdit. Aucun appel réel au fournisseur IA n'est requis.

Sans cette preuve, noter Q9/Q10 **non vérifiées** : ni absence d'information ni
simulation de récupération vide ne prouve l'isolation réelle. Les résultats
restent séparés des scores D1–D10 et A1–A3 et des conversations privées S8-F.
Le rapport de 4.16 doit signaler toute précondition manquante, sans clôture fictive.

#### État de la preuve S9-B (story 4.15)

- Exécution SQL : **non exécutée** ; aucune base de test isolée n'a été désignée
  pour cette réalisation. Ne pas traiter une simulation ou un résultat vide
  comme preuve d'interdiction.
- Identités SQL prévues : fictives et anonymisées. Le scénario SQL n'ayant pas
  été exécuté, il n'a créé ni modifié de compte, profil, espace ou ressource.
- Tests automatisés exécutés le 2026-11-11 :
  ```text
  node --test tests/assistant.test.mjs tests/semantic-access.test.mjs
  # 29/29 réussis
  node --env-file=.env.local --test --test-timeout=240000 tests/semantic-search-rls.test.mjs tests/conversations-rls.test.mjs
  # 20/20 réussis, aucun ignoré
  npm run test:unit
  # réussi
  ```
  Ces tests confirment le témoin partagé, le refus anonyme, les conversations
  privées et le nettoyage des fixtures créées par les tests d'intégration.
- Q9/Q10 : **non vérifiées** jusqu'à preuve que chaque ressource existe dans la
  fixture, que le compte source y accède et que la session cible ne peut ni la
  lire ni la récupérer. Le témoin doit rester accessible.
- Ce bilan dans `tests-ia.md` constitue le relevé des résultats ; aucun fichier
  de logs autonome n'a été créé. Aucun échec n'a été visible ; Node a affiché
  son avertissement existant `MODULE_TYPELESS_PACKAGE_JSON`. Aucun contenu privé
  ni identifiant de compte réel n'apparaît dans les résultats.

## Vérification du sprint 8 — conversations et recherche

Les dix questions ci-dessus restent inchangées pour vérifier que les réponses du sprint 7 ne régressent pas. S8-A à S8-H concernent les cinq stories du sprint 8 ; S9-I et S9-J concernent les deux améliorations visuelles reportées au sprint 9. Chaque scénario sera exécuté après le développement du sprint correspondant.

**Préparation :** utiliser deux comptes membres A et B, plus un responsable pour les contrôles d'accès. Les conversations sont privées même lorsque les ressources sont partagées. Ne pas envoyer de mot de passe ou de clé dans un résultat de test.

**Attention aux questions 9 et 10 :** le MVP actuel contient un seul espace et les ressources de cet espace sont partagées. Ne pas créer un second espace pour ce test. Il faut une ressource réellement inaccessible dans un jeu de test autorisé pour prouver son exclusion ; une information simplement absente vérifie l'abstention, pas les droits. Les tests automatisés RLS complètent ce contrôle. Les conversations d'A doivent en revanche toujours être inaccessibles à B et au responsable.

| Repère | Question ou manipulation | Résultat attendu |
|---|---|---|
| S8-A — recherche | Sur `/resources/search`, poser la question 5 (« Lors du test de la story 3.1… »), puis les questions 1 à 6 ; rejouer les dix questions sur Assistant. | Le passage de la bonne story ne perd pas sa priorité après le classement SQL. Les ressources attendues des questions documentées sont retrouvées ; l'assistant reste satisfaisant. Les tests automatiques isolent aussi une question sans numéro. |
| S8-B — enregistrement | Avec A, poser la question 1 sur Assistant, puis ouvrir « Mes conversations », recharger et revenir après reconnexion. | La conversation est conservée avec une date et un titre issu de la première question ; aucune ligne vide ni doublon. Les échanges antérieurs au sprint 8 ne réapparaissent pas. |
| S8-C — réouverture | Rouvrir cet échange et sélectionner une source ; dans une ressource fictive de test autorisée, modifier ou supprimer ensuite la source, puis rouvrir l'échange. | Questions/réponses sont dans le même ordre. Une source disponible s'ouvre correctement. Une source retirée indique « Source non disponible », sans ancien extrait, et la réponse est identifiée comme historique. Aucun nouvel appel IA pour une lecture. |
| S8-D — suite | Après la question 1, demander « Et comment ces services protègent-ils l'accès aux données ? ». Dans un autre échange, poser la question 5 puis « Quel était le numéro de la story concernée ? ». | La nouvelle question et sa réponse rejoignent le même échange. Les réponses utilisent le contexte et les nouveaux passages accessibles : RLS pour la première suite, story 3.1 pour la seconde, avec sources ; sinon abstention, jamais supposition. |
| S8-E — limite du contexte | Dans une conversation de test, dépasser dix échanges puis poser une nouvelle question liée au dernier échange. | L'écran annonce que seuls les dix derniers échanges servent à la réponse ; les anciens restent lisibles. Les tests automatiques vérifient la borne et l'absence d'anciens extraits de sources dans la requête IA. |
| S8-F — confidentialité | Copier l'URL d'une conversation d'A et essayer de l'ouvrir avec B puis avec le responsable ; essayer aussi l'ajout et la suppression. | Aucun message, titre ou source privé n'est révélé ; aucune modification. Le test RLS vérifie également les accès directs aux trois tables avec ces sessions. |
| S8-G — erreurs et expiration | Sur des données de test, simuler une erreur de génération, utiliser « Réessayer », et tester une conversation expirée via le jeu automatisé préparé par le développeur. | La question reste enregistrée une seule fois ; une seule réponse finale, pas de relance automatique. L'erreur est explicite. Après 30 jours sans nouvelle question, la conversation est inaccessible ; consultation et relance du même identifiant ne prolongent pas le délai. Ne pas modifier les dates de vrais échanges pour ce test. |
| S8-H — suppression | Sur une conversation fictive, demander la suppression puis annuler ; recommencer et confirmer, puis rouvrir l'ancienne URL. | Annuler conserve tout ; confirmer retire la conversation, ses messages et références de sources. L'URL devient indisponible, mais les ressources citées restent intactes. |
| S9-I — catégories (sprint 9) | Sur Ressources, choisir une catégorie puis « Toutes les catégories ». Sur Catégories avec le responsable, sélectionner et renommer une catégorie de test ; vérifier aussi au clavier et sur mobile. | Deux menus déroulants clairement nommés, filtre inchangé, création et renommage conservés. Aucun bouton de gestion supplémentaire pour un simple membre ; erreur et liste vide compréhensibles. |
| S9-J — cartes (sprint 9) | Examiner la liste Ressources, les deux types de résultats de recherche, une réponse et ses sources sur Assistant puis dans une conversation ; tester mobile et zoom 200 %. | Cartes mauve pâle sur fond blanc ; liens/textes lisibles, focus visible. Les messages d'erreur/succès gardent leurs couleurs. Les contrastes sont mesurés par le développeur, pas seulement appréciés à l'œil. |

### Grille S8-D — précision validée pour le sprint 9

Après la question 5, demander « Quel était le numéro de la story concernée ? ».
Noter séparément :

| Vérification | Résultat à noter |
|---|---|
| Numéro correct : story 3.1 | Réussi / à corriger / abstention |
| Source actuelle accessible qui confirme ce numéro | Réussi / à corriger / aucune source |
| Lien ouvrant la bonne ressource justificative | Réussi / à corriger / aucun lien |

Comparer dans une nouvelle conversation avec la question autonome :
« Lors du test de la story 3.1, que s'est-il passé quand la recherche était vide ? ».
Conserver les réponses et leurs sources pour distinguer une difficulté de contexte,
de recherche ou de présentation. Le lien ouvre la ressource, pas une page de story
ni un passage précis. Si les nouveaux passages ne permettent pas de répondre,
« Je ne sais pas » reste le comportement sûr, mais ne compte pas comme une réponse
documentée correcte. Cette grille précise les tests du sprint 9 ; elle ne prétend
pas que l'amélioration de présentation est déjà développée.

Complément S8-G, correction R1 de 4.10 : après une erreur sur une question fictive,
« Réessayer » sans modifier le texte doit reprendre la même question sans doublon.
Modifier ensuite le texte doit permettre une nouvelle question, sans erreur de conflit
avec l'ancienne. Les tests unitaires simulent l'échec ; ne pas retirer une clé réelle
pour provoquer ce cas.

Complément S8-G, correction R2 de 4.10 : le test d'intégration rejoue une demande
ayant déjà reçu un état « aucune ressource pertinente » ou « information introuvable ».
La demande est reconnue comme déjà traitée, sans erreur d'enregistrement ni nouvel
appel IA ; le formulaire peut ensuite accepter une nouvelle question. Aucun incident
réseau réel n'est nécessaire pour vérifier ce cas.

Complément recherche de ressources : pour les questions 2, 5 et 6, la recherche
affiche en premier une phrase exacte choisie par le LLM parmi les cinq passages
retrouvés au maximum, avec le titre et le lien de la ressource citée. Vérifier l'avis
qui précise que la question et jusqu'à cinq passages complets (titre et texte) sont
envoyés à OpenAI. Vérifier que les résultats et leur classement restent visibles
pendant la sélection. Cela ne corrige pas la question 3 : son passage est exclu avant
la sélection par le LLM, sous le seuil actuel.

Noter « réussi / à corriger » pour chaque scénario du sprint évalué, puis le résultat des dix questions. Aucune story ne sera marquée terminée avant l'évaluation de Dylan.

**Nettoyage des fixtures RLS :** `tests/supabase-rls.test.mjs` suit les identifiants créés par chaque exécution et nettoie les ressources, recherches et catégories par identifiant exact, avant la déconnexion des sessions. Un échec initial ne saute pas le nettoyage ; toutes les erreurs de nettoyage et de déconnexion sont agrégées. `tests/rls-cleanup.test.mjs` vérifie le succès, l’échec simulé et la conservation des erreurs.

### Correction de trajectoire approuvée le 2026-11-11 — A et C livrés, B en attente

Le point B reste un contrôle approuvé à préparer pour la story 4.16 ; il ne signifie
pas que le code ou les migrations correspondants sont déjà livrés.

- **Nettoyage RLS (A, hors sprint) — accepté par Dylan le 2026-11-11 :**
  la migration `20261111103000_cleanup_rls_test_category.sql` n’ajoute qu’un RPC
  responsable, borné à l’espace, l’identifiant exact, un nom de fixture strict et
  une catégorie inutilisée. Le test d’intégration a réussi sans scénario ignoré
  (17/17) avec des sessions réelles et la clé publishable. Les onze identifiants
  approuvés ont été inventoriés, vérifiés inutilisés, puis retirés individuellement
  via ce RPC ; chaque réessai et lecture d’absence a été confirmé.
  La ressource autorisée `24f359d7-5869-4eac-beb9-a58ff599f98c` a été déplacée
  conditionnellement vers « Documents internes » ; contenu, passage et références
  accessibles identiques avant/après, sans journalisation de contenu. Ne pas
  rejouer ce nettoyage ni supprimer des catégories par préfixe. Dylan confirme
  le contrôle des catégories ; action clôturée.
- **Preuve Q1 (B, préparation de 4.16) :** garder la question inchangée. Noter
  séparément Next.js App Router/TypeScript et les services PostgreSQL,
  authentification, stockage de fichiers et RLS de Supabase. Sur Recherche,
  relever titres, passages probants et rangs top 3 ; relever aussi la phrase et
  son lien, sans les substituer à la preuve du classement. Sur Assistant,
  relever réponse, sources qui appuient chaque élément et liens ouvrables.
  Une phrase partielle ne prouve pas toute la réponse. Garder les règles de notation.
  Ce contrôle historique ne remplace pas le jeu requis par 4.16 : dix questions
  documentées et trois questions sans réponse.
- **Seuil RPC (C, hors sprint) — accepté par Dylan le 2026-11-11 :**
  `20261111110000_align_candidate_similarity_default.sql` conserve le corps, la
  signature et les droits du RPC ; seul le seuil implicite devient 0,2. Le test
  d'intégration a réussi sans scénario ignoré (13/13) : sur une fixture à 0,25,
  les références et résultats sont identiques sans seuil et avec 0,2, un réessai
  implicite est stable, et le candidat disparaît à 0,3. La limite, les références
  et les refus RLS/anonymes restent vérifiés. L'ancien RPC et l'assistant restent
  inchangés. Dylan confirme Q1 sur Recherche de ressources ; action clôturée.
  Aucun nouveau test manuel de l'assistant n'est revendiqué.

## Vérification après le test 7 — recherche de ressources

Pour `/resources/search`, le seuil minimal de similarité est de 0,20 et la fenêtre
hybride est de 0,20. Ces paramètres ne s'appliquent pas à `/assistant`, qui conserve
son seuil de 0,40 et son classement vectoriel actuel. La RPC reste exécutée avec la
session du membre, la RLS et une limite de cinq passages.

Rejouer les questions Q1 et Q3 : le passage accessible attendu peut maintenant faire
partie des cinq candidats même si sa similarité est sous 0,40. Pour Q6, vérifier que
la phrase sélectionnée décrit le résultat observé — « les deux recherches ont été
regroupées en une seule avec la même date » — et non l'action effectuée. Rejouer Q5
et confirmer que sa phrase exacte reste sélectionnée. Les tests unitaires couvrent
ces seuils et ces phrases ; le test d'intégration vérifie le classement, la limite et
les droits lorsqu'il est lancé contre une base où la migration est appliquée.

Appliquer manuellement `supabase/migrations/20261107100000_search_resource_chunks_hybrid_window.sql`
dans Supabase SQL Editor après `20261106120000_create_conversations.sql` et les migrations
précédentes.
Ne pas appliquer la migration dans le cadre d'un test automatisé.
