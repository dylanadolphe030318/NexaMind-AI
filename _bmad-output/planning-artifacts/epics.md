---
status: draft
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-projet-ia-2026-10-27/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-projet-ia-2026-10-28/architecture-resume.NexMindAImd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/EXPERIENCE.md
---

# NexaMind AI - Découpage des epics

## Présentation

Ce document transforme le PRD, les documents UX et l’architecture de NexaMind AI en besoins vérifiables. Les epics, stories et sprints seront ajoutés après validation de cette extraction.

## Inventaire des besoins

### Exigences fonctionnelles

- **FR1 — Compte et connexion :** un visiteur peut créer un compte membre, se connecter et se déconnecter ; une personne non connectée ne peut pas accéder aux espaces protégés ; les erreurs d’identifiants restent compréhensibles et ne révèlent pas d’information sensible.
- **FR2 — Tableau de bord :** après connexion, un membre arrive sur un tableau de bord donnant accès aux ressources, à la recherche et à l’assistant. **[ASSUMPTION]** Le tableau de bord présente aussi les ressources récentes ou des indications utiles, avec un état vide clair.
- **FR3 — Ressources :** un membre crée, modifie et supprime ses propres ressources ; le responsable peut gérer toutes les ressources. Une ressource comporte un titre, du texte et une catégorie obligatoire. **[ASSUMPTION]** Elle indique aussi sa date de mise à jour et contient du texte saisi ou collé uniquement ; les fichiers sont exclus du MVP.
- **FR4 — Catégories et consultation :** les membres parcourent les ressources partagées, voient leur catégorie et leur date, filtrent par catégorie et ouvrent le détail. Le responsable crée et renomme les catégories. **[ASSUMPTION]** L’espace vide présente une action adaptée au rôle.
- **FR5 — Indexation réelle :** après création ou modification, le texte est découpé en passages, transformé en vecteurs persistants dans la base vectorielle et rendu disponible pour la recherche. Les mises à jour et suppressions sont répercutées ; les erreurs d’indexation sont signalées. **[ASSUMPTION]** L’interface montre les états en cours, prêt ou en échec et permet une relance après un échec.
- **FR6 — Recherche :** un membre recherche par mots-clés ou par sens ; chaque résultat présente un titre, un extrait et un accès à la ressource. Une recherche infructueuse est signalée et peut être reformulée.
- **FR7 — Assistant RAG :** un membre pose une question en langage courant. L’assistant utilise les passages pertinents des ressources autorisées, répond avec des sources identifiables et s’abstient si les ressources ne suffisent pas. **[ASSUMPTION]** Les erreurs de génération sont compréhensibles et la question peut être renvoyée.
- **FR8 — Historique :** un membre consulte, rouvre et supprime ses propres recherches et conversations ; les messages et leur ordre sont conservés pour une conversation. **[ASSUMPTION]** L’historique est privé, daté, conservé 30 jours et une recherche rouverte recharge ses résultats selon les ressources alors disponibles.
- **FR9 — Rôles et autorisations :** l’inscription crée un membre ; seul le responsable préconfiguré peut gérer les catégories et toutes les ressources. Les membres voient les ressources partagées et ne modifient ou suppriment que les leurs. Les droits s’appliquent aussi aux accès directs et à la recherche.
- **FR10 — Sécurité et confidentialité des données :** le système protège les ressources et historiques contre les accès non autorisés, garde les secrets hors du navigateur et ne transmet au fournisseur IA que les contenus accessibles à la personne connectée. Chaque membre ne voit que son propre historique.

### Exigences non fonctionnelles

- **NFR1 — Protection de l’authentification :** l’authentification et les sessions sont gérées de façon sécurisée.
- **NFR2 — Qualité de protection des données :** les contrôles d’accès et de confidentialité décrits en FR10 sont appliqués à la base de données, à la recherche vectorielle et à l’appel IA. Seules des données fictives ou explicitement autorisées sont transmises à un fournisseur externe.
- **NFR3 — Messages d’erreur :** les erreurs d’authentification, de ressource, de recherche et de génération sont compréhensibles et ne montrent pas de secrets ni de détails techniques inutiles.
- **NFR4 — Conservation :** recherches et conversations expirent après 30 jours ; le propriétaire peut les supprimer.
- **NFR5 — Temps de réponse :** **[ASSUMPTION]** avec un compte de test et 20 ressources indexées, 9 recherches sur 10 répondent en moins de 3 secondes et 9 questions sur 10 en moins de 15 secondes.
- **NFR6 — Compatibilité et accessibilité :** **[ASSUMPTION]** l’application fonctionne sur ordinateur et mobile ; les fonctions essentielles sont utilisables au clavier, les champs sont libellés, et le contraste vise WCAG 2.2 AA.
- **NFR7 — Limite de produit :** une seule organisation partagée dans le MVP ; pas de données confidentielles en démonstration. **[ASSUMPTION]**

### Exigences complémentaires de l’architecture

- Construire l’application avec Next.js ; Next.js affiche les pages, traite les demandes côté serveur, applique les règles métier et appelle le fournisseur IA.
- Utiliser Supabase pour l’authentification, les sessions, les données et le contrôle des accès ; utiliser PostgreSQL avec stockage vectoriel pour les passages et la recherche sémantique.
- Contrôler les droits côté base de données et côté serveur ; ne jamais dépendre uniquement du masquage d’un bouton dans l’interface.
- Garder les clés et appels IA côté serveur ; ne transmettre à l’IA que les données autorisées.
- Prévoir les données nécessaires aux profils et rôles, à l’espace commun, aux catégories, aux ressources, passages et vecteurs, recherches, conversations, messages et sources.
- Une conversation rouverte peut être poursuivie en tenant compte de son contexte ; son historique reste privé. L’expiration de 30 jours est calculée depuis la dernière activité réelle.
- **[ASSUMPTION]** Les ressources sont du texte saisi ou collé ; aucun stockage de fichiers n’est nécessaire dans le MVP.
- Points de décision encore ouverts dans les sources : hébergement de Next.js, fournisseur IA et budget/quotas, réglages de découpage et de recherche. La surveillance, les journaux, les sauvegardes et la séparation des environnements sont à définir avant une mise en production.

### Exigences UX et visuelles

- **UX-DR1 — Identité visuelle :** appliquer la palette et les tokens du document DESIGN : violet principal, rose en accent, fonds clairs, typographie système, espacements en multiples de 4 px et rayons définis ; garder les ressources et réponses prioritaires sur la décoration.
- **UX-DR2 — Contraste et états :** viser WCAG 2.2 AA pour les contrastes indiqués ; ne jamais communiquer une erreur, une réussite, une catégorie ou une permission par la seule couleur. Le focus est visible.
- **UX-DR3 — Navigation adaptative :** fournir les accès aux mêmes écrans depuis une navigation persistante sur ordinateur et compacte sur mobile ; indiquer l’écran actif autrement que par la couleur seule. **[ASSUMPTION]**
- **UX-DR4 — Ressources :** présenter titre, catégorie et date sur les cartes/lignes ; le détail permet de lire le contenu ; les résultats de recherche ajoutent un extrait et un lien vers la ressource.
- **UX-DR5 — Formulaires :** les champs ont des libellés ; titre, texte et catégorie manquants sont signalés près du champ concerné sans effacer les autres valeurs. **[ASSUMPTION]**
- **UX-DR6 — Actions autorisées :** n’afficher les actions de gestion qu’aux personnes qui y ont droit, sans que cela remplace le contrôle réel des autorisations.
- **UX-DR7 — Suppressions :** avant suppression, nommer l’élément et proposer clairement confirmer ou annuler ; après confirmation, la ressource disparaît aussi des résultats et de l’index.
- **UX-DR8 — Recherche et listes :** afficher chargement, erreur, résultats et état vide avec des messages simples ; conserver une requête qui a échoué et proposer de réessayer.
- **UX-DR9 — Assistant et sources :** distinguer visuellement la réponse de ses sources ; chaque source identifie et ouvre la ressource. Indiquer l’attente, l’échec ou l’insuffisance des ressources sans présenter une supposition comme certaine. **[ASSUMPTION]** L’interface propose de relancer après un échec technique.
- **UX-DR10 — Historique :** distinguer recherches et conversations, afficher leur date, prévoir états vide/chargement/erreur et signaler une conversation ou une source devenue indisponible. **[ASSUMPTION]**
- **UX-DR11 — Accessibilité et petits écrans :** toutes les fonctions essentielles sont utilisables au clavier et au toucher, avec ordre de focus lisible, contrôles nommés, textes agrandissables et sans défilement horizontal sur mobile. **[ASSUMPTION]**
- **UX-DR12 — Ton et mouvement :** employer des messages calmes, simples et précis, décrivant le problème et l’action possible ; utiliser des transitions discrètes et respecter la réduction des animations du système. **[ASSUMPTION]**

### Carte de couverture des exigences

FR1 : Epic 1 — créer un compte membre, se connecter et se déconnecter.
FR2 : Epic 1 — arriver sur un tableau de bord donnant accès aux fonctions principales.
FR3 : Epic 2 — créer, modifier et supprimer des ressources selon son rôle.
FR4 : Epic 2 — consulter, filtrer et classer les ressources dans des catégories.
FR5 : Epic 4 — préparer les ressources pour la recherche sémantique avec une indexation persistante.
FR6 : Epic 3 — rechercher des ressources et ouvrir les résultats.
FR7 : Epic 4 — poser une question et recevoir une réponse avec sources ou une abstention.
FR8 : Epic 3 — retrouver ses recherches ; Epic 4 — retrouver et poursuivre ses conversations.
FR9 : Epic 1 — définir les rôles et protéger les actions ; Epic 4 — préserver ces droits dans la recherche IA et les conversations.
FR10 : Epic 1 — protéger les données et secrets ; Epic 4 — limiter les contenus transmis à l’IA aux ressources autorisées.

## Liste des epics

### Epic 1 : Accéder à un espace de travail protégé

Un visiteur peut créer un compte membre, se connecter et atteindre un premier tableau de bord ; les rôles et les protections d’accès permettent d’utiliser l’espace sans exposer les données aux personnes non autorisées.
**FR couverts :** FR1, FR2, FR9, FR10.

### Epic 2 : Organiser les ressources partagées

Les membres peuvent consulter les ressources partagées, gérer leurs propres ressources textuelles et les classer ; le responsable peut gérer toutes les ressources et les catégories.
**FR couverts :** FR3, FR4.
**Dépendance :** Epic 1.

### Epic 3 : Retrouver les ressources et ses recherches

Les membres peuvent rechercher des ressources par mots-clés, ouvrir un résultat et retrouver leurs recherches récentes. Cette version reste utile sans assistant IA.
**FR couverts :** FR6 et la partie recherches de FR8.
**Dépendance :** Epic 2.

### Epic 4 : Questionner les connaissances avec une IA et des sources

Les membres peuvent interroger les ressources autorisées ; l’application prépare les textes, retrouve les passages utiles et fournit une réponse vérifiable avec ses sources, ou indique que les ressources ne suffisent pas. Les conversations restent privées et peuvent être reprises.
**FR couverts :** FR5, FR7, la partie conversations de FR8, FR9 et FR10 pour les usages IA.
**Dépendance :** Epics 1 et 2 ; cet epic vient après toutes les fonctionnalités standards.

**Ordre prévu pour les sprints IA :** préparation des données, recherche des passages pertinents, réponse de l’IA avec sources, gestion des conversations, puis qualité et garde-fous.

## Epic 1 : Accéder à un espace de travail protégé

Un visiteur peut créer un compte membre, se connecter et atteindre un premier tableau de bord ; les rôles et les protections d’accès permettent d’utiliser l’espace sans exposer les données aux personnes non autorisées.

### Story 1.1 : Voir la page d’accueil de NexaMind

En tant que visiteur,
je veux voir une page d’accueil claire,
afin de comprendre le service et de commencer à créer un compte ou à me connecter.

**Critères d’acceptation :**

**Étant donné** que j’ouvre l’adresse de l’application, **quand** la page d’accueil se charge, **alors** je vois le nom NexaMind AI et une courte présentation.

**Étant donné** que je consulte la page d’accueil, **quand** je cherche comment accéder au service, **alors** je trouve des liens clairement nommés pour créer un compte et me connecter.

**Étant donné** que j’ouvre l’application sur un écran mobile de 375 px ou un écran d’ordinateur de 1280 px, **quand** la page s’affiche, **alors** son contenu ne provoque pas de défilement horizontal.

### Story 1.2 : Créer un compte membre

En tant que visiteur,
je veux créer un compte membre,
afin de rejoindre l’espace de travail.

**Critères d’acceptation :**

**Étant donné** que les informations requises sont valides, **quand** je soumets le formulaire, **alors** un compte utilisable est créé avec Supabase Auth.

**Étant donné** que je m’inscris depuis l’application, **quand** mon compte est créé, **alors** son rôle est « membre » et le formulaire ne me permet pas de choisir le rôle responsable.

**Étant donné** qu’une information obligatoire manque ou que l’inscription échoue, **quand** le formulaire est envoyé, **alors** un message compréhensible indique quoi faire et les informations déjà saisies restent présentes.

### Story 1.3 : Se connecter et se déconnecter

En tant que membre,
je veux me connecter à mon compte et me déconnecter,
afin de retrouver mon espace sans le laisser ouvert aux autres.

**Critères d’acceptation :**

**Étant donné** que j’utilise un compte valide, **quand** je me connecte, **alors** une session est ouverte et je peux accéder à l’espace protégé.

**Étant donné** que j’utilise des identifiants invalides, **quand** je tente de me connecter, **alors** un message compréhensible s’affiche sans révéler si le compte existe.

**Étant donné** que je suis connecté, **quand** je me déconnecte, **alors** les pages protégées ne sont plus accessibles et une tentative d’ouverture me ramène vers la connexion.

### Story 1.4 : Accéder à son espace protégé

En tant que membre connecté,
je veux accéder à mon espace protégé,
afin de retrouver un point de départ personnel dans l’application.

**Critères d’acceptation :**

**Étant donné** que je me connecte, **quand** le tableau de bord s’affiche, **alors** je vois un accueil NexaMind AI et l’identité du membre connecté.

**Étant donné** qu’une personne n’est pas connectée, **quand** elle ouvre directement l’adresse du tableau de bord, **alors** elle est redirigée vers la connexion sans voir de données privées.

**Étant donné** que je consulte le tableau de bord, **quand** je cherche à fermer ma session, **alors** une action clairement nommée me permet de me déconnecter.

## Epic 2 : Organiser les ressources partagées

Les membres peuvent consulter les ressources partagées, gérer leurs propres ressources textuelles et les classer ; le responsable peut gérer toutes les ressources et les catégories.

### Story 2.1 : Gérer les catégories

En tant que responsable,
je veux créer et renommer les catégories,
afin que les ressources de l’équipe soient classées de manière cohérente.

**Critères d’acceptation :**

**Étant donné** que je suis responsable, **quand** je crée une catégorie, **alors** elle apparaît dans la liste des catégories disponibles.

**Étant donné** que je suis responsable, **quand** je renomme une catégorie, **alors** son nouveau nom est affiché partout où cette catégorie est proposée.

**Étant donné** que je suis membre, **quand** je consulte les catégories disponibles, **alors** je peux les voir et les choisir, mais pas les créer ni les renommer.

### Story 2.2 : Parcourir et ouvrir une ressource

En tant que membre,
je veux parcourir les ressources partagées et ouvrir leur contenu,
afin de lire les informations utiles à l’équipe.

**Critères d’acceptation :**

**Étant donné** qu’une ressource existe, **quand** je consulte la liste, **alors** je vois son titre, sa catégorie et sa date de mise à jour.

**Étant donné** que j’ouvre une ressource, **quand** son détail s’affiche, **alors** je peux lire son titre, son texte, sa catégorie et sa date de mise à jour.

**Étant donné** qu’aucune ressource n’existe, **quand** j’ouvre la liste, **alors** l’écran explique clairement qu’elle est vide et ne propose l’ajout qu’aux personnes autorisées. **[ASSUMPTION]**

### Story 2.3 : Ajouter une ressource textuelle

En tant que membre,
je veux saisir ou coller le titre et le texte d’une ressource, puis choisir sa catégorie,
afin de partager une information utile avec l’équipe.

**Critères d’acceptation :**

**Étant donné** que je crée une ressource, **quand** je saisis ou colle son titre et son texte et choisis une catégorie existante, **alors** je peux l’enregistrer.

**Étant donné** que l’enregistrement réussit, **quand** je consulte la liste et le détail, **alors** la ressource apparaît avec son titre, son texte, sa catégorie et sa date de mise à jour.

**Étant donné** que le titre, le texte ou la catégorie manque, **quand** je tente d’enregistrer, **alors** un message indique le champ à corriger sans effacer les autres valeurs ; aucun import de fichier n’est proposé.

### Story 2.4 : Modifier une ressource autorisée

En tant que membre,
je veux modifier mes propres ressources,
afin de garder les informations de l’équipe à jour.

**Critères d’acceptation :**

**Étant donné** qu’une ressource m’appartient, **quand** je modifie son titre, son texte ou sa catégorie et enregistre, **alors** les changements sont visibles et sa date de mise à jour est actualisée.

**Étant donné** que je suis responsable, **quand** je modifie une ressource partagée, **alors** les changements sont enregistrés même si la ressource appartient à un autre membre.

**Étant donné** que je suis membre et qu’une ressource appartient à quelqu’un d’autre, **quand** je tente de la modifier, y compris par son adresse directe, **alors** aucun changement n’est enregistré.

### Story 2.5 : Filtrer les ressources par catégorie

En tant que membre,
je veux filtrer la liste des ressources par catégorie,
afin de retrouver plus facilement les informations d’un même sujet.

**Critères d’acceptation :**

**Étant donné** que des ressources sont classées, **quand** je choisis une catégorie, **alors** la liste affiche uniquement les ressources de cette catégorie.

**Étant donné** qu’un filtre est actif, **quand** je le réinitialise, **alors** toutes les ressources partagées réapparaissent.

**Étant donné** qu’une catégorie est affichée, **quand** je consulte la liste, **alors** son nom est visible et la couleur seule ne sert pas à l’identifier.

### Story 2.6 : Supprimer une ressource autorisée

En tant que membre,
je veux supprimer mes propres ressources après confirmation,
afin de retirer les informations qui ne sont plus utiles.

**Critères d’acceptation :**

**Étant donné** que je demande la suppression d’une ressource, **quand** la confirmation s’affiche, **alors** elle nomme la ressource et propose clairement de confirmer ou d’annuler.

**Étant donné** que je suis membre propriétaire ou responsable, **quand** je confirme la suppression, **alors** la ressource n’apparaît plus dans les écrans de liste ou de détail déjà disponibles ; si j’annule, elle reste disponible.

**Étant donné** que je suis membre et qu’une ressource appartient à quelqu’un d’autre, **quand** je tente de la supprimer, **alors** aucun changement n’est enregistré ; après suppression autorisée, la ressource n’apparaît plus dans la liste et son écran de détail n’est plus accessible.

## Epic 3 : Retrouver les ressources et ses recherches

Les membres peuvent rechercher des ressources par mots-clés, ouvrir un résultat et retrouver leurs recherches récentes. Cette version reste utile sans assistant IA.

### Story 3.1 : Rechercher des ressources par mots-clés

En tant que membre,
je veux rechercher les ressources par mots présents dans le titre ou le texte,
afin de retrouver rapidement une information partagée.

**Critères d’acceptation :**

**Étant donné** qu’une ressource contient les mots recherchés dans son titre ou son texte, **quand** je lance la recherche, **alors** cette ressource apparaît dans les résultats.

**Étant donné** que des résultats sont affichés, **quand** je les consulte, **alors** chacun montre le titre, un extrait du texte et un lien pour ouvrir la ressource.

**Étant donné** qu’aucune ressource ne correspond, **quand** la recherche se termine, **alors** l’écran indique qu’aucun résultat n’a été trouvé et me laisse modifier la recherche.

**Étant donné** qu’une ressource a été supprimée, **quand** je recherche un terme qui figurait dans son titre ou son texte, **alors** cette ressource ne figure plus dans les résultats.

### Story 3.2 : Retrouver ses recherches récentes

En tant que membre,
je veux consulter la liste de mes recherches récentes,
afin de retrouver les requêtes que j’ai déjà faites.

**Critères d’acceptation :**

**Étant donné** que j’ai lancé une recherche, **quand** je consulte mon historique, **alors** cette recherche apparaît avec sa requête et sa date.

**Étant donné** que je consulte l’historique, **quand** je suis connecté, **alors** je ne vois que mes recherches et un autre membre ne peut pas ouvrir mon historique, même avec une adresse directe.

**Étant donné** que je n’ai encore aucune recherche enregistrée, **quand** j’ouvre l’historique, **alors** un état vide clair s’affiche.

### Story 3.3 : Relancer une recherche enregistrée

En tant que membre,
je veux rouvrir une recherche de mon historique,
afin de retrouver les ressources correspondantes sans ressaisir ma requête.

**Critères d’acceptation :**

**Étant donné** qu’une recherche est enregistrée dans mon historique, **quand** je la sélectionne, **alors** l’application réaffiche sa requête et relance la recherche.

**Étant donné** que je rouvre une recherche, **quand** les résultats sont chargés, **alors** ils correspondent aux ressources accessibles au moment de la réouverture.

**Étant donné** que la recherche ne retourne plus de résultat, **quand** les résultats s’affichent, **alors** l’écran indique qu’aucun résultat n’a été trouvé et me permet de modifier la requête.

### Story 3.4 : Supprimer une recherche de son historique

En tant que membre,
je veux supprimer une recherche de mon historique,
afin de ne conserver que les recherches qui me sont utiles.

**Critères d’acceptation :**

**Étant donné** que je demande la suppression d’une recherche, **quand** la confirmation s’affiche, **alors** elle identifie la recherche et propose de confirmer ou d’annuler.

**Étant donné** que je confirme la suppression, **quand** l’action est terminée, **alors** la recherche disparaît de mon historique et ne peut plus être rouverte ; si j’annule, elle reste présente.

**Étant donné** qu’une recherche appartient à un autre membre, **quand** je tente de la supprimer, **alors** l’action est refusée.

## Epic 4 : Questionner les connaissances avec une IA et des sources

Les membres peuvent interroger les ressources autorisées ; l’application prépare les textes, retrouve les passages utiles et fournit une réponse vérifiable avec ses sources, ou indique que les ressources ne suffisent pas. Les conversations restent privées et peuvent être reprises.

### Story 4.1 : Découper une ressource en passages

En tant que membre,
je veux que le texte de ma ressource soit découpé en passages enregistrés,
afin que ses informations puissent être préparées pour la recherche sémantique.

**Critères d’acceptation :**

**Étant donné** que j’enregistre ou modifie une ressource, **quand** sa préparation commence, **alors** son texte est découpé en passages liés à cette ressource.

**Étant donné** que la préparation des passages est terminée, **quand** le traitement est vérifié, **alors** les passages sont conservés durablement dans Supabase/PostgreSQL.

### Story 4.2 : Créer et enregistrer les embeddings

En tant que membre,
je veux que les passages de ma ressource soient transformés en embeddings persistants,
afin qu’ils puissent être comparés au sens d’une recherche.

**Critères d’acceptation :**

**Étant donné** que les passages d’une ressource existent, **quand** le calcul des embeddings se termine, **alors** chaque passage possède un embedding associé.

**Étant donné** que le calcul est terminé, **quand** le stockage est vérifié, **alors** les embeddings et leurs liens aux passages sont conservés durablement dans Supabase/PostgreSQL.

**[ASSUMPTION]** Le fournisseur d’embeddings sera choisi avant la réalisation de cette story.

### Story 4.3 : Suivre l’état de préparation d’une ressource

En tant que membre,
je veux voir si la préparation de ma ressource est en cours, terminée ou en échec,
afin de savoir si elle est prête pour une recherche sémantique.

**Critères d’acceptation :**

**Étant donné** que ma ressource est en préparation, **quand** j’en consulte l’état, **alors** l’interface indique si elle est en cours, prête ou en échec.

**Étant donné** que la préparation échoue, **quand** je consulte l’état de la ressource, **alors** un message compréhensible s’affiche et une action permet de relancer la préparation.

**Étant donné** qu’une ressource a été supprimée, **quand** j’effectue une recherche sémantique sur son contenu, **alors** aucun de ses passages n’est retourné par l’index.

### Story 4.4 : Retrouver les passages pertinents par le sens

En tant que membre,
je veux retrouver les ressources qui parlent de mon sujet même sans les mêmes mots,
afin de trouver l’information utile en langage courant.

**Critères d’acceptation :**

**Étant donné** qu’une ressource préparée traite du sujet recherché, **quand** je lance une recherche avec des mots différents de ceux de la ressource, **alors** un passage pertinent peut être retrouvé.

**Étant donné** que je lance une recherche sémantique, **quand** les passages sont récupérés, **alors** seuls les passages les plus pertinents sont proposés comme résultats.

### Story 4.5 : Afficher les extraits des passages retrouvés

En tant que membre,
je veux lire un extrait de chaque passage retrouvé et ouvrir sa ressource,
afin de vérifier rapidement si le résultat est utile.

**Critères d’acceptation :**

**Étant donné** que des passages pertinents sont retrouvés, **quand** je consulte les résultats, **alors** chaque résultat affiche un extrait du passage et le titre de la ressource correspondante.

**Étant donné** que je sélectionne un résultat, **quand** je l’ouvre, **alors** j’accède à la ressource correspondante.

**Étant donné** que la recherche ne retourne aucun passage pertinent, **quand** les résultats s’affichent, **alors** un état vide clair me permet de modifier la requête.

### Story 4.6 : Limiter la recherche aux ressources accessibles

En tant que membre,
je veux que la recherche sémantique respecte mes droits d’accès,
afin de ne jamais voir les contenus d’un autre espace autorisés.

**Critères d’acceptation :**

**Étant donné** que je suis connecté comme membre, **quand** j’effectue une recherche sémantique, **alors** les résultats ne contiennent que les ressources auxquelles j’ai accès.

**Étant donné** qu’une recherche sémantique échoue, **quand** je consulte l’écran de recherche, **alors** un message compréhensible s’affiche et ma requête peut être relancée.

### Story 4.7 : Générer une réponse à partir des passages retrouvés

En tant que membre,
je veux poser une question et recevoir une réponse fondée sur les passages retrouvés,
afin de comprendre l’information disponible dans mes ressources.

**Critères d’acceptation :**

**Étant donné** que ma question a retrouvé des passages pertinents, **quand** l’assistant génère sa réponse, **alors** il utilise ces passages comme contexte.

**Étant donné** que je consulte le résultat, **quand** la génération est terminée, **alors** une réponse liée au contenu des passages retrouvés est affichée.

### Story 4.8 : Afficher les sources de la réponse

En tant que membre,
je veux voir et ouvrir les sources utilisées pour la réponse,
afin de vérifier d’où vient l’information.

**Critères d’acceptation :**

**Étant donné** que l’assistant répond à ma question, **quand** sa réponse s’affiche, **alors** les sources utilisées sont présentées séparément de la réponse.

**Étant donné** qu’une source est affichée, **quand** je la sélectionne, **alors** elle identifie et ouvre la ressource correspondante.

### Story 4.9 : Signaler l’absence de réponse et les erreurs

En tant que membre,
je veux être averti si les ressources ne permettent pas de répondre ou si la génération échoue,
afin de ne pas confondre une erreur ou une supposition avec une réponse fiable.

**Critères d’acceptation :**

**Étant donné** qu’aucun passage suffisant n’est retrouvé, **quand** l’assistant répond, **alors** il dit qu’il ne trouve pas l’information dans les ressources disponibles et ne présente pas une supposition comme certaine.

**Étant donné** que l’assistant prépare sa réponse, **quand** je consulte l’écran, **alors** un état d’attente est affiché.

**Étant donné** que la génération échoue, **quand** je consulte l’écran, **alors** un message compréhensible permet de réessayer sans perdre la question.

### Story 4.10 : Consulter la liste de ses conversations

En tant que membre,
je veux consulter la liste de mes conversations avec l’assistant,
afin de retrouver les échanges que j’ai eus.

**Critères d’acceptation :**

**Étant donné** qu’une conversation est disponible, **quand** je consulte ma liste, **alors** elle apparaît avec sa date.

**Étant donné** que je consulte la liste des conversations, **quand** elle s’affiche, **alors** je ne vois que mes conversations ; un autre membre ne peut pas consulter cette liste, y compris par une adresse directe.

**Étant donné** qu’une conversation n’a pas eu d’activité depuis 30 jours, **quand** je consulte mon historique, **alors** elle n’est plus disponible. **[ASSUMPTION]**

### Story 4.11 : Rouvrir une conversation

En tant que membre,
je veux rouvrir une conversation qui m’appartient,
afin de relire ses messages et ses sources.

**Critères d’acceptation :**

**Étant donné** qu’une conversation m’appartient et est encore disponible, **quand** je l’ouvre, **alors** ses messages et les sources enregistrées s’affichent.

**Étant donné** qu’une conversation appartient à un autre membre, **quand** je tente de l’ouvrir, y compris par une adresse directe, **alors** l’accès est refusé et son contenu n’est pas révélé.

**Étant donné** que la conversation a expiré ou qu’une de ses sources n’est plus disponible, **quand** je l’ouvre, **alors** l’application indique clairement ce qui ne peut plus être consulté.

### Story 4.12 : Continuer une conversation précédente

En tant que membre,
je veux poser une nouvelle question dans une conversation rouverte,
afin de poursuivre l’échange sans perdre son contexte.

**Critères d’acceptation :**

**Étant donné** que j’ouvre une de mes conversations, **quand** elle s’affiche, **alors** un champ me permet de poser une nouvelle question.

**Étant donné** que j’envoie une nouvelle question, **quand** l’assistant répond, **alors** la question et la réponse sont ajoutées après les anciens messages.

**Étant donné** que l’assistant répond dans une conversation précédente, **quand** il prépare sa réponse, **alors** il tient compte des messages précédents, utilise uniquement les ressources accessibles à ce membre et affiche les sources de sa réponse.

### Story 4.13 : Supprimer une conversation de son historique

En tant que membre,
je veux supprimer une de mes conversations,
afin de retirer de mon historique les échanges que je ne souhaite plus conserver.

**Critères d’acceptation :**

**Étant donné** que je demande la suppression d’une conversation, **quand** la confirmation s’affiche, **alors** elle identifie la conversation et propose clairement de confirmer ou d’annuler.

**Étant donné** que je confirme la suppression, **quand** l’action est terminée, **alors** la conversation disparaît de mon historique et ne peut plus être rouverte ; si j’annule, elle reste disponible.

**Étant donné** qu’une conversation appartient à un autre membre, **quand** je tente de la supprimer, **alors** l’action est refusée.

### Story 4.14 : Relier les affirmations aux sources

En tant que membre,
je veux que chaque affirmation factuelle de l’assistant soit appuyée par une source,
afin de pouvoir vérifier la fiabilité de la réponse.

**Critères d’acceptation :**

**Étant donné** qu’une réponse contient une affirmation factuelle, **quand** je la consulte, **alors** cette affirmation peut être reliée à une source affichée.

**Étant donné** qu’aucune source ne soutient une affirmation, **quand** l’assistant vérifie sa réponse, **alors** il retire cette affirmation ou indique qu’il ne sait pas.

### Story 4.15 : Empêcher la divulgation de ressources non autorisées

En tant que membre,
je veux que l’assistant respecte mes droits d’accès aux ressources,
afin de ne pas recevoir des informations confidentielles d’un autre membre.

**Critères d’acceptation :**

**Étant donné** qu’une ressource n’est pas accessible à un membre, **quand** celui-ci pose une question sur son contenu, **alors** la réponse ne révèle ni le contenu ni ses sources.

**Étant donné** que l’assistant prépare le contexte d’une réponse, **quand** les passages sont sélectionnés, **alors** seuls ceux issus de ressources autorisées sont transmis.

### Story 4.16 : Vérifier la qualité et l’abstention de l’assistant

En tant que responsable,
je veux vérifier les réponses de l’assistant avec un jeu de questions de référence,
afin de m’assurer que les réponses sont sourcées et que l’assistant s’abstient quand l’information manque.

**Critères d’acceptation :**

**Étant donné** un jeu de 10 questions dont les réponses existent dans les ressources, **quand** la qualité est évaluée, **alors** au moins 8 réponses citent une source attendue.

**Étant donné** 3 questions dont les réponses sont absentes des ressources, **quand** l’assistant répond, **alors** il s’abstient dans les 3 cas.

## Plan des sprints

### Sprint 1 — Une première version protégée et visible

**Objectif :** poser les fondations Next.js et Supabase, puis permettre à un membre de créer son compte, se connecter et voir son espace protégé.
**Stories :** 1.1, 1.2, 1.3, 1.4 (4 stories).
**Résultat démontrable :** un visiteur voit la page d’accueil, crée un compte membre, se connecte et accède au tableau de bord protégé ; la déconnexion ferme l’accès.
**Type :** standard.

### Sprint 2 — Créer et gérer des ressources partagées

**Objectif :** permettre au responsable d’organiser les catégories et aux membres de créer et modifier leurs ressources.
**Stories :** 2.1, 2.2, 2.3, 2.4 (4 stories).
**Résultat démontrable :** le responsable crée une catégorie ; un membre consulte les ressources puis ajoute et modifie son texte dans cette catégorie.
**Type :** standard.

### Sprint 3 — Filtrer, supprimer et rechercher

**Objectif :** permettre aux membres de filtrer et rechercher les ressources, et de supprimer une ressource autorisée.
**Stories :** 2.5, 2.6, 3.1 (3 stories).
**Résultat démontrable :** un membre filtre et recherche des ressources par mots-clés, supprime sa propre ressource après confirmation, et vérifie que celle-ci n’apparaît plus dans les listes ni dans les résultats de recherche.
**Type :** standard.

### Sprint 4 — Retrouver ses recherches sans IA

**Objectif :** offrir un historique personnel de recherches que le membre peut consulter, relancer et nettoyer.
**Stories :** 3.2, 3.3, 3.4 (3 stories).
**Résultat démontrable :** un membre consulte ses recherches datées, en relance une et en supprime une autre ; un second membre ne peut pas accéder à cet historique.
**Type :** standard.

### Sprint 5 — Préparer les données pour l’IA

**Objectif :** transformer le texte des ressources en passages et embeddings conservés, avec un état de préparation visible et une suppression correcte de l’index.
**Stories :** 4.1, 4.2, 4.3 (3 stories).
**Résultat démontrable :** une ressource est découpée et indexée durablement ; son état et ses erreurs sont visibles, l’indexation peut être relancée, et une recherche ne retourne plus les passages d’une ressource supprimée.
**Type :** IA.

### Sprint 6 — Retrouver les passages pertinents

**Objectif :** retrouver les passages par leur sens, afficher des extraits utiles et respecter les droits d’accès.
**Stories :** 4.4, 4.5, 4.6 (3 stories).
**Résultat démontrable :** une recherche formulée avec d’autres mots retrouve un passage pertinent, affiche un extrait ouvrable et ne révèle que les ressources accessibles au membre.
**Type :** IA.

### Sprint 7 — Répondre aux questions avec des sources

**Objectif :** générer une réponse à partir des passages retrouvés et présenter ses sources ou son incapacité à répondre.
**Stories :** 4.7, 4.8, 4.9 (3 stories).
**Résultat démontrable :** une question reçoit une réponse liée aux passages avec sources ouvrables ; sans contexte suffisant, l’assistant le dit, et les états d’attente et d’erreur permettent de réessayer.
**Type :** IA.

### Sprint 8 — Retrouver et reprendre ses conversations

**Objectif :** permettre à chaque membre de consulter, rouvrir, poursuivre et supprimer ses propres conversations.
**Stories :** 4.10, 4.11, 4.12, 4.13 (4 stories).
**Résultat démontrable :** un membre consulte sa liste privée, rouvre un échange et poursuit la conversation ; il peut la supprimer, et un autre membre ne peut ni consulter sa liste ni ouvrir cet échange.
**Type :** IA.

### Sprint 9 — Vérifier la qualité et les garde-fous

**Objectif :** vérifier que les réponses restent reliées aux sources et que l’assistant protège les contenus et s’abstient lorsque nécessaire.
**Stories :** 4.14, 4.15, 4.16 (3 stories).
**Résultat démontrable :** les affirmations non étayées sont retirées ou signalées, les ressources non autorisées ne sont pas divulguées, au moins 8 réponses sur 10 citent une source attendue, et l’assistant s’abstient pour les 3 questions sans réponse.
**Type :** IA.
