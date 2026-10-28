---
title: "NexaMind AI"
status: final
created: 2026-10-27
updated: 2026-10-27
---

# PRD : NexaMind AI

## 0. Objet du document

Ce document décrit le MVP de NexaMind AI à destination de l’équipe étudiante. Il transforme le cahier des charges en utilisateurs, parcours, fonctionnalités testables, limites et indicateurs. Les exigences viennent du cahier des charges ; aucune recherche utilisateur indépendante n’a été fournie. Toute interprétation est marquée **[ASSUMPTION]** et récapitulée à la fin. Ce PRD décrit le produit attendu, pas son architecture technique ni son code.

## 1. Vision

NexaMind AI est le MVP d’un copilote métier qui aide les indépendants, petites entreprises et équipes projet à retrouver et exploiter leurs connaissances. Il rassemble les ressources de travail dans un espace organisé, permet de les rechercher et répond aux questions en s’appuyant sur leur contenu.

La priorité produit est de fournir une réponse fiable à partir des ressources de l’équipe : ajouter une ressource, la retrouver par son sens, poser une question, puis vérifier la réponse à partir de ses sources. Si l’information n’existe pas dans les ressources accessibles, l’assistant le dit au lieu de l’inventer.

Le résultat est un prototype pédagogique. **[ASSUMPTION]** Il ne constitue pas un service commercial apte à recevoir des données confidentielles.

## 2. Utilisateurs cibles

### 2.1 Utilisateurs principaux

- **Responsable (utilisateur prioritaire)** — personne qui prépare et organise l’espace partagé, gère les ressources de tous les membres et utilise aussi l’assistant.
- **Membre** — indépendant, collaborateur ou nouvel arrivant dans l’espace de démonstration. Il recherche et consulte les ressources, pose des questions à l’assistant et peut créer, modifier ou supprimer uniquement ses propres ressources. « Contributeur » décrit une action d’un membre, pas un rôle séparé.

### 2.2 Besoins des utilisateurs

- Quand une tâche est bloquée par une information introuvable, retrouver rapidement la bonne ressource.
- Quand plusieurs documents parlent d’un même sujet, poser une question en langage courant et obtenir une réponse appuyée sur ces documents.
- Quand une ressource utile manque, l’ajouter et la classer pour qu’elle puisse être réutilisée.
- Quand une personne rejoint l’équipe, lui permettre d’apprendre en autonomie à partir des connaissances existantes.
- Quand une réponse de l’IA paraît incertaine, pouvoir vérifier les sources ou constater qu’aucune réponse fiable n’est disponible.

## 3. Parcours utilisateurs

- **UJ-1. Camille retrouve une procédure.** Camille, collaboratrice authentifiée, ouvre son tableau de bord, lance une recherche avec des mots simples, consulte les ressources proposées et ouvre la procédure pertinente. Elle sait si aucun résultat n’a été trouvé et peut reformuler sa recherche.
- **UJ-2. Malik partage une ressource.** Malik, membre, saisit ou colle un texte, lui donne un titre et choisit une catégorie obligatoire, puis l’enregistre. Le contenu devient consultable et est indexé pour la recherche sémantique. **[ASSUMPTION]** Les fichiers PDF et les autres formats sont exclus du MVP.
- **UJ-3. Lina pose une question métier.** Lina, nouvelle membre qui vient de créer son compte, ouvre l’espace de démonstration, pose une question à l’assistant, reçoit une réponse liée aux ressources retrouvées et peut ouvrir les sources. Si les contenus ne permettent pas de répondre, l’assistant le dit au lieu d’inventer une procédure.
- **UJ-4. Hugo reprend une recherche.** Hugo revient dans l’application, consulte ses recherches et conversations récentes, puis rouvre un échange précédent pour poursuivre son travail. **[ASSUMPTION]** Son historique est privé. Les éléments sont conservés 30 jours.

## 4. Glossaire

- **Espace de travail** — lieu logique qui regroupe les membres et les ressources d’une entreprise ou d’une équipe.
- **Ressource** — contenu utile à l’activité : document, note, FAQ, procédure, fiche projet, compte rendu ou historique de tâche.
- **Catégorie** — classement choisi pour retrouver et organiser les ressources.
- **Index vectoriel** — empreinte numérique d’un texte, utilisée pour retrouver des passages proches par leur sens.
- **Base vectorielle** — base de données qui conserve ces empreintes et les liens vers les ressources correspondantes.
- **Recherche sémantique** — recherche qui tient compte du sens d’une question, même si les mots utilisés sont différents.
- **RAG** — méthode où l’application retrouve des passages utiles, les donne à l’IA comme contexte, puis présente une réponse liée à ces passages.
- **Source** — ressource ou passage affiché pour permettre de vérifier une réponse.
- **Membre** — personne inscrite dans l’espace de démonstration ; elle consulte les ressources partagées et gère ses propres ressources.
- **Responsable** — membre privilégié qui configure l’espace et peut gérer toutes les ressources.

## 5. Fonctionnalités

### 5.1 Accès et espace de travail

L’application protège les ressources derrière un compte. Après création de compte, le membre rejoint l’espace de démonstration partagé. **[ASSUMPTION]** Le responsable prépare cet espace et son compte initial avant la démonstration. L’inscription autonome crée uniquement des comptes membre. Tous les membres peuvent consulter les ressources partagées et gérer leurs propres ressources et conversations. Le responsable peut gérer toutes les ressources. Aucune ressource n’est privée entre les membres et il n’existe qu’une seule organisation dans le MVP.

**Exigences fonctionnelles**

#### FR-1 : Créer un compte et se connecter

Un visiteur peut créer un compte membre et se connecter de manière sécurisée à l’espace de démonstration.

**Critères vérifiables :**
- Une personne peut créer un compte avec les informations requises, se déconnecter, puis se reconnecter.
- Toute inscription autonome crée un compte membre dans l’espace de démonstration ; le rôle responsable n’est pas attribuable par inscription.
- Une personne non connectée ne peut pas consulter le tableau de bord, les ressources ou les conversations.
- En cas d’identifiants invalides, l’application affiche un message compréhensible sans révéler d’information sensible.

#### FR-2 : Accéder à son espace de travail

Un membre connecté peut accéder à un tableau de bord qui donne accès à la recherche, aux ressources et à l’assistant.

**Critères vérifiables :**
- Après connexion, le tableau de bord est affiché et propose les accès aux fonctions principales.
- Le tableau de bord affiche les ressources récentes ou des indications utiles, et un état clair si l’espace est vide. **[ASSUMPTION]**

### 5.2 Gestion des ressources

Un membre peut ajouter et mettre à jour ses propres ressources, et consulter et organiser toutes les ressources partagées. Le responsable peut gérer toutes les ressources. Les ressources sont disponibles pour la recherche classique et l’index vectoriel.

#### FR-3 : Ajouter et modifier une ressource

Un membre peut créer ou modifier une ressource avec un titre, un contenu textuel et une catégorie obligatoire ; il ne peut modifier que ses propres ressources. Le responsable peut modifier toute ressource. **[ASSUMPTION]** Une date de mise à jour est également enregistrée.

**Critères vérifiables :**
- Une ressource enregistrée apparaît dans la liste et sa page affiche son titre et son contenu.
- Une modification enregistrée apparaît lorsque la ressource est rouverte.
- Un titre, un contenu non vide et une catégorie sont requis ; si l’un manque, un message indique le champ à corriger.
- **[ASSUMPTION]** Le MVP accepte uniquement un texte saisi ou collé ; les PDF et les autres formats sont hors périmètre.
- Un membre peut supprimer ses propres ressources et le responsable toute ressource ; après confirmation, le contenu disparaît des listes, de la recherche et de l’index vectoriel.

#### FR-4 : Organiser et consulter les ressources

Un membre peut parcourir les ressources, voir leur catégorie et leur date de mise à jour, les filtrer par catégorie et ouvrir leur contenu. Le responsable peut créer et modifier les catégories proposées.

**Critères vérifiables :**
- Une ressource apparaît dans la catégorie qui lui a été attribuée.
- Un filtre de catégorie ne montre que les ressources de cette catégorie et peut être réinitialisé.
- Le responsable peut créer une catégorie et modifier son nom ; les membres peuvent choisir parmi les catégories disponibles.
- Un espace sans ressource affiche un état vide et une action adaptée au rôle de l’utilisateur. **[ASSUMPTION]**

#### FR-5 : Mettre les ressources à jour dans l’index

Après ajout ou modification, l’application extrait le texte, le découpe en passages, calcule des représentations vectorielles et les enregistre dans une véritable base vectorielle persistante interrogée lors des recherches et questions. Les résultats ne doivent pas être simulés ni remplacés par une recherche dans une liste codée en dur.

**Critères vérifiables :**
- Un test de bout en bout montre qu’un texte enregistré produit des passages et des vecteurs persistés, puis qu’une question sémantique récupère le passage attendu depuis la base vectorielle.
- Un test vérifie que le passage récupéré est bien inclus dans le contexte transmis à l’IA ; la réponse affiche des sources correspondant aux passages effectivement récupérés.
- **[ASSUMPTION]** L’état d’indexation est visible : en cours, prêt ou en échec. Pendant une mise à jour, les anciens vecteurs sont retirés des résultats ; en cas d’échec, l’utilisateur peut relancer l’indexation.
- Si l’indexation échoue, la ressource n’est pas présentée comme disponible pour la recherche sémantique et une erreur compréhensible s’affiche.

### 5.3 Recherche et assistant IA

L’utilisateur peut chercher dans les ressources et poser des questions en langage courant. L’assistant utilise le RAG : il cherche des passages pertinents dans une vraie base vectorielle, les fournit à l’IA comme contexte et affiche une réponse contextualisée avec des sources vérifiables.

#### FR-6 : Rechercher des ressources

Un membre peut rechercher des ressources par mots-clés ou par sens, puis ouvrir les résultats.

**Critères vérifiables :**
- Une recherche par mots présents dans le titre ou le contenu retourne la ressource correspondante.
- Une recherche formulée avec des termes proches retourne une ressource pertinente lorsqu’elle existe.
- Chaque résultat affiche au minimum son titre et un extrait permettant de juger sa pertinence.
- Une recherche sans résultat affiche un état vide et permet de modifier la requête.

#### FR-7 : Poser une question à l’assistant

Un membre peut poser une question sur les ressources auxquelles il a accès et recevoir une réponse basée sur les passages retrouvés.

**Critères vérifiables :**
- La réponse affiche les sources utilisées ; chaque source ouvre ou identifie clairement la ressource concernée.
- Si aucun passage suffisant n’est retrouvé, l’assistant indique qu’il ne peut pas répondre à partir des ressources disponibles.
- Chaque affirmation factuelle de la réponse peut être reliée à une source affichée ; si une source ne l’appuie pas, l’affirmation est retirée ou signalée comme inconnue.
- Un état de chargement, une erreur compréhensible et une possibilité de réessayer sont disponibles en cas d’échec de génération. **[ASSUMPTION]**

### 5.4 Historique

L’utilisateur peut retrouver les conversations et recherches passées afin de poursuivre son travail.

#### FR-8 : Consulter l’historique

Un membre peut afficher et rouvrir ses conversations et recherches récentes.

**Critères vérifiables :**
- Une recherche conserve sa requête et ses résultats ; une conversation conserve ses messages dans l’ordre. **[ASSUMPTION]** Les deux types d’éléments affichent leur date et peuvent être supprimés par leur propriétaire. Les recherches et conversations sont conservées 30 jours.
- **[ASSUMPTION]** Rouvrir une recherche restaure la requête enregistrée et affiche les résultats correspondants aux ressources disponibles au moment de la réouverture.
- L’ouverture d’une conversation précédente restitue ses messages dans l’ordre.
- Un membre ne voit que son propre historique ; le responsable ne peut pas consulter les conversations privées d’un autre membre. **[ASSUMPTION]**
- Un membre peut supprimer l’un de ses éléments d’historique ; celui-ci disparaît alors de la liste et ne peut plus être rouvert.

### 5.5 Gestion des accès et des contenus

L’espace partagé compte deux rôles : membre et responsable. L’inscription autonome crée un compte membre. **[ASSUMPTION]** Les contenus acceptés sont uniquement des textes saisis ou collés ; les PDF et les autres formats ne sont pas pris en charge dans le MVP. Chaque ressource doit être classée dans une catégorie. Le responsable organise l’espace et peut gérer toutes les ressources. Chaque membre peut consulter toutes les ressources partagées, mais créer, modifier et supprimer uniquement les siennes. Les permissions s’appliquent à l’affichage, aux accès directs, à la recherche et au contexte envoyé à l’IA.

#### FR-9 : Respecter les rôles et les accès

L’application distingue les actions du responsable et du membre et n’utilise que des ressources autorisées pour chaque utilisateur.

**Critères vérifiables :**
- Une inscription autonome donne uniquement le rôle membre ; seul le compte responsable initial peut gérer l’espace.
- Un membre peut créer, modifier et supprimer ses propres ressources, mais ne peut pas modifier ou supprimer celles d’un autre membre ; le responsable peut modifier et supprimer toute ressource.
- Chaque membre retrouve les mêmes ressources partagées dans les listes, recherches et sources de l’assistant.
- Un membre ne peut pas ouvrir l’historique d’un autre membre, même en utilisant directement son adresse.

## 6. Qualité, confidentialité et sécurité

Les éléments ci-dessous sont nécessaires à un produit crédible, mais leurs seuils ne sont pas définis dans le challenge ; les valeurs chiffrées marquées comme hypothèses devront être validées.

- **[ASSUMPTION]** Le fournisseur IA, la base vectorielle et le budget ou plafond de requêtes restent à choisir avant l’architecture.
- Les mots de passe et sessions sont gérés par un mécanisme d’authentification sécurisé ; aucun secret privilégié n’est exposé au navigateur.
- Les ressources, recherches et conversations sont accessibles seulement aux personnes autorisées, y compris au moment de la recherche vectorielle et de l’appel à l’IA.
- **[ASSUMPTION]** Avec un compte de test, une seule personne connectée et 20 ressources indexées dans l’environnement de démonstration, 9 recherches sur 10 affichent leurs résultats en moins de 3 secondes et 9 questions sur 10 affichent la réponse finale en moins de 15 secondes. Le chronomètre part de l’envoi de la requête ; les erreurs et délais du fournisseur IA comptent comme des échecs.
- **[ASSUMPTION]** Le produit est utilisable sur ordinateur et écran mobile ; les fonctions essentielles sont réalisables au clavier et les champs disposent de libellés lisibles.
- Les erreurs d’authentification, d’ajout de ressource, de recherche et de génération sont présentées sans afficher de secrets ni de détails techniques inutiles.
- **[ASSUMPTION]** Seules des données fictives ou autorisées pour la démonstration sont utilisées.
- Les conversations et recherches sont conservées 30 jours.
- Le propriétaire peut supprimer ses conversations et recherches.

## 7. Limites du MVP

### 7.1 Inclus

- Application web avec création de compte, connexion et tableau de bord.
- Espace de travail structuré avec ajout, organisation, consultation et mise à jour des ressources.
- Recherche textuelle et sémantique dans les ressources indexées.
- Assistant question-réponse connecté aux ressources via RAG, avec affichage des sources et réponse prudente si l’information manque.
- Historique des recherches et conversations.
- Contrôle d’accès adapté au jeu de démonstration.
- **[ASSUMPTION]** Parcours d’évaluation de la qualité UX et du RAG avec un petit jeu de questions et de ressources préparé.
- Démonstration du Vibe Coding : cadrage, génération, tests, corrections et itérations observables.

### 7.2 Exclu du MVP

- **[HORS MVP]** Gestion complète de plusieurs organisations indépendantes, facturation, abonnements et administration d’entreprise.
- **[HORS MVP]** SSO, annuaires d’entreprise, rôles personnalisés et processus d’approbation complexes.
- **[HORS MVP]** Import automatique depuis des services externes (Drive, Notion, Slack, CRM, e-mail) et synchronisation continue.
- **[ASSUMPTION] [HORS MVP]** Import de fichiers, y compris les PDF ; seules les ressources sous forme de texte saisi ou collé sont acceptées.
- **[HORS MVP]** Le résumé automatique est exclu du MVP. **[ASSUMPTION]** La reformulation, la génération de contenu, les suggestions proactives et l’extraction de données sont également hors périmètre ; la question-réponse RAG sourcée suffit au MVP.
- **[HORS MVP]** Entraînement d’un modèle propriétaire, réponses garanties exactes ou remplacement d’un expert métier.
- **[HORS MVP]** Actions autonomes qui modifient des projets, envoient des messages ou exécutent des tâches.
- **[HORS MVP]** Application mobile native, fonctionnement hors ligne et engagements de disponibilité de niveau entreprise.

## 8. Mesures de réussite

Les seuils sont des hypothèses de démonstration et non des engagements de production.

### Principales

- **SM-1 — Accès de bout en bout :** au moins 4 essais sur 5 réussissent à créer un compte de test, se connecter et atteindre le tableau de bord sans aide. **[ASSUMPTION]** Valide FR-1 et FR-2.
- **SM-2 — Gestion des connaissances :** le responsable crée une catégorie, puis un membre ajoute une ressource de test dans cette catégorie et la retrouve dans la liste en moins de 2 minutes dans 4 essais sur 5. **[ASSUMPTION]** Valide FR-3 à FR-5.
- **SM-3 — Recherche utile :** un jeu fixe de 10 requêtes sur 20 ressources associe chaque requête à au moins une ressource acceptable ; une requête réussit si l’une de ses ressources attendues apparaît parmi les trois premiers résultats. Au moins 8 requêtes sur 10 réussissent. **[ASSUMPTION]** Valide FR-5 et FR-6.
- **SM-4 — RAG réel et vérifiable :** pour 10 questions dont les réponses existent, au moins 8 réponses citent une source attendue et chaque affirmation factuelle est appuyée par les sources ; pour 3 questions dont la réponse est absente, l’assistant s’abstient dans les 3 cas. Le jeu de test contient les questions, les sources attendues et la règle de notation ; un évaluateur applique la même règle à chaque réponse. **[ASSUMPTION]** Valide FR-5 et FR-7.
- **SM-5 — Continuité :** 5 essais vérifient que l’utilisateur peut retrouver une recherche et une conversation datées, les rouvrir, et qu’un autre membre ne peut pas lire cet historique ; les 5 essais réussissent. **[ASSUMPTION]** Valide FR-8 et FR-9.
- **SM-6 — Accès conforme :** 4 essais vérifient l’inscription membre, la création et la suppression de sa propre ressource, le refus de modifier ou supprimer la ressource d’un autre membre, et la modification ou suppression par le responsable ; les 4 passent. **[ASSUMPTION]** Valide FR-1, FR-3 et FR-9.
- **SM-7 — UX utilisable :** parmi 5 personnes qui découvrent le prototype, au moins 4 réussissent sans aide à créer un compte, retrouver une ressource, poser une question et ouvrir sa source en moins de 5 minutes ; aucun blocage ne les empêche d’achever le parcours. **[ASSUMPTION]** Valide FR-1, FR-2, FR-6 et FR-7. Les mêmes fonctions restent utilisables sur des écrans de 375 px et 1280 px sans défilement horizontal. **[ASSUMPTION]**
- **SM-8 — Démonstration du challenge :** la présentation montre la demande et le choix de stack avec leur justification, une génération IA, une vérification par test ou revue, une correction issue de cette vérification, puis une nouvelle validation réussie. Le test prouve aussi l’ingestion, le stockage vectoriel persistant, la récupération sémantique et l’envoi du contexte à l’IA. **[ASSUMPTION]** Valide les critères pédagogiques de choix de stack, RAG réel et Vibe Coding, en plus des fonctionnalités du produit.

### Contre-mesures (ne pas optimiser seules)

- **SM-C1 — Réponses sans preuve :** aucune question sans source suffisante ne doit recevoir une réponse présentée comme certaine ; contrebalance le taux de réponses utiles SM-4.
- **SM-C2 — Accès indu :** aucun scénario d’essai ne doit révéler à un membre l’historique d’un autre utilisateur ; contrebalance la facilité d’accès SM-1 et SM-5.
- **SM-C3 — Vitesse au détriment de la qualité :** ne pas réduire le nombre de sources ou masquer les échecs pour améliorer artificiellement la latence SM-4 ou la démonstration SM-6.

## 9. Questions ouvertes

Cette question doit être résolue avant l’architecture :

1. **Stack IA et budget :** quel fournisseur IA et quelle base vectorielle faut-il retenir, et quel budget ou plafond de requêtes leur attribuer ?

## 10. Index des hypothèses

- §1 et §2.1 — prototype non destiné aux données confidentielles.
- §3 UJ-4 et §5.4 FR-8 — historique privé, daté, recherche réexécutable et suppression des éléments par leur propriétaire.
- §5.1 — responsable initial préparé avant la démonstration ; une seule organisation et aucun contenu privé entre membres.
- §3 UJ-2, §5.2 FR-3, §5.5 et §7.2 — limitation aux textes saisis ou collés et exclusion des fichiers.
- §5.2 FR-2 à FR-4 — contenu récent ou indications au tableau de bord ; date de mise à jour ; état vide adapté.
- §5.2 FR-5 — états d’indexation visibles, retrait des anciens vecteurs pendant une mise à jour et relance après erreur.
- §5.3 FR-7 — états de chargement, erreur compréhensible et relance.
- §6 — seuils de latence, test sur un compte et 20 ressources, compatibilité mobile/clavier, données fictives ou autorisées.
- §7.1 et §7.2 — jeu de questions et de ressources pour évaluer l’UX et le RAG ; exclusion des fonctions IA autres que la question-réponse RAG.
- §9 — fournisseur IA, base vectorielle et budget à sélectionner avant l’architecture.
- §8 SM-1 à SM-8 — échantillons, seuils, protocole d’évaluation UX/RAG et preuves attendues pour la démonstration du challenge.
