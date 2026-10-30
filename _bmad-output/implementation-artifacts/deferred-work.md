## Deferred from: code review of story 1-1 (2026-10-29)

- Les liens d'inscription et de connexion de `src/app/page.tsx` mènent à des routes absentes. Corriger lors des stories 1.2 et 1.3, qui implémentent ces parcours. Motif du report : les routes d'inscription et de connexion font partie des stories 1.2 et 1.3, pas de la story d'accueil.

## Deferred from: code review of story 1-2-créer-un-compte-membre (2026-10-29)

- Le lien « Se connecter » de `src/app/signup/page.tsx` mène à `/login`, route qui sera créée dans la story 1.3.
- Avant le déploiement, documenter dans `README.md` la configuration de **Authentication → URL Configuration** afin que le **Site URL** Supabase pointe vers l’URL de l’application et que les liens de confirmation d’e-mail ne renvoient pas vers localhost.

## Deferred from: code review des stories 1.1–1.2 (2026-10-29)

- Avant l’ouverture des inscriptions publiques, provisionner par une opération de confiance un profil responsable initial lié à l’espace de travail. La migration crée l’espace, mais son déclencheur attribue uniquement le rôle `membre`.
