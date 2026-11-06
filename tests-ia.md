# Jeu de 10 questions de test pour l’assistant IA

Les sources sont les documents disponibles dans le projet. Pour les questions 9 et 10, importer le document indiqué comme ressource dans un espace distinct de celui du compte test : celui-ci ne doit pouvoir ni consulter la ressource ni en récupérer le contenu ou la citation.

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

Pour les questions 9 et 10, la réponse de l’assistant ne doit révélQer ni le contenu du document ni l’existence ou le titre de la source inaccessible.

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

Noter « réussi / à corriger » pour chaque scénario du sprint évalué, puis le résultat des dix questions. Aucune story ne sera marquée terminée avant l'évaluation de Dylan.
