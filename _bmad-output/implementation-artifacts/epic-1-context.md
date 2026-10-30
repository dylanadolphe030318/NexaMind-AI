# Epic 1 Context: Accéder à un espace de travail protégé

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre aux visiteurs de comprendre NexaMind AI, de créer un compte membre ou de se connecter, puis d’atteindre un tableau de bord protégé. L’authentification, les rôles et les contrôles d’accès doivent établir une base sûre pour les fonctionnalités partagées à venir, sans révéler de données privées ni d’informations sensibles.

## Stories

- Story 1.1: Voir la page d’accueil de NexaMind
- Story 1.2: Créer un compte membre
- Story 1.3: Se connecter et se déconnecter
- Story 1.4: Accéder à son espace protégé

## Requirements & Constraints

- La page d’accueil présente le nom NexaMind AI et une brève explication, avec des liens explicites vers l’inscription et la connexion.
- Une inscription réussie crée un compte utilisable avec le rôle membre. Le parcours d’inscription ne permet pas de choisir le rôle responsable.
- Une connexion valide ouvre une session et donne accès au tableau de bord, qui présente l’identité du membre. Une action clairement libellée permet de fermer la session.
- Les visiteurs ne peuvent ni consulter ni modifier les données produit. Toute tentative d’accès direct au tableau de bord les redirige vers la connexion sans exposer de données.
- Les erreurs d’authentification sont compréhensibles, ne révèlent pas si un compte existe et ne divulguent ni secrets ni détails techniques inutiles. En cas d’échec de formulaire, les informations déjà saisies restent présentes.
- Vérifier les autorisations avec de vraies sessions des rôles concernés, y compris les lectures directes en base ; les tests ne doivent pas contourner les règles avec une clé privilégiée.
- La page d’accueil doit fonctionner à 375 px et à 1280 px sans défilement horizontal. L’application vise un usage accessible au clavier et au toucher, avec champs libellés, focus visible, états compréhensibles sans dépendre uniquement de la couleur et contraste WCAG 2.2 AA.

## Technical Decisions

- Supabase Auth gère les comptes et les sessions, transmises en cookies SSR via `@supabase/ssr`. Supabase/PostgreSQL est la source de vérité pour les données et les autorisations.
- L’application Next.js traite les parcours côté serveur : les Server Components lisent les données et les Server Actions effectuent les mutations. Sans session, seule la création de compte est permise ; toute lecture ou mutation des données produit exige une session.
- Les tables exposées activent RLS. Les composants et actions serveur utilisent le client Supabase lié à la session courante afin que les politiques de base s’appliquent aussi aux accès serveur ; masquer une action dans l’interface ne remplace jamais ce contrôle.
- Le workspace unique et son profil responsable initial sont créés de façon idempotente par une opération de confiance avant l’ouverture des inscriptions. Chaque inscription rejoint ce workspace et reçoit un profil membre ; le propriétaire d’un profil ne peut pas modifier son rôle ni son workspace.
- Les clés privilégiées et autres secrets restent côté serveur et ne sont jamais intégrés au navigateur.

## UX & Interaction Patterns

- Présenter un parcours visiteur évident entre accueil, création de compte et connexion ; après authentification, conduire au tableau de bord avec une identité visible et une action de déconnexion facile à trouver.
- Afficher les mêmes fonctions sur ordinateur et mobile : navigation persistante sur grand écran, navigation compacte et contenu en une colonne sur mobile. Les liens, champs, messages d’erreur et actions restent nommés et utilisables au clavier comme au toucher.
- Garder les messages simples et calmes ; associer les erreurs à une explication textuelle et préserver les valeurs saisies. Rendre le focus clavier visible et ne pas communiquer permissions ou états par la couleur seule.

## Cross-Story Dependencies

- L’accueil et ses liens (1.1) conduisent aux parcours d’inscription et de connexion (1.2, 1.3). Une session ouverte donne accès au tableau de bord protégé (1.4) ; la déconnexion et les contrôles d’accès doivent ensuite empêcher le retour aux pages privées.
- L’initialisation fiable du workspace et du responsable précède l’ouverture des inscriptions. L’Epic 2 dépend des comptes et de l’espace protégé établis ici.
