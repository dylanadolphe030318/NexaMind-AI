---
title: 'Raccorder l’application Next.js au projet Supabase existant'
type: 'feature'
created: '2026-10-27'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L’application Next.js ne dispose actuellement d’aucune configuration Supabase, malgré l’existence d’un projet Supabase destiné à l’application.

**Approach:** Raccorder l’application au projet Supabase fourni, en utilisant une configuration locale sûre et les outils JavaScript/TypeScript adaptés au routeur App Router.

**Périmètre confirmé :** Raccordement technique uniquement : installer le SDK Supabase, configurer localement l’URL et la clé publique, et fournir des clients réutilisables côté navigateur et serveur. Aucune fonctionnalité métier, modification de schéma, migration ou mutation de données distantes n’est demandée.

## Boundaries & Constraints

**Always:** Utiliser l’URL du projet et la clé publique fournies via des variables d’environnement côté client explicitement préfixées pour Next.js. Ne jamais exposer de clé secrète ou de service-role.

**Never:** Ne pas modifier le schéma distant, créer ou supprimer des données, ni déployer l’application sur Supabase sans demande explicite.

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu | Gestion d’erreur |
|----------|---------------|------------------|------------------|
| Configuration présente | URL Supabase et clé publique définies dans l’environnement local | Le client Supabase peut être initialisé | Aucune |
| Configuration absente | Une variable d’environnement manque | L’erreur de configuration est explicite au moment où le client est utilisé | Pas de valeur de remplacement silencieuse |

</frozen-after-approval>

## Code Map

- `package.json` — dépendances et commandes du projet ; le SDK Supabase n’est pas encore installé.
- `src/app/layout.tsx` — layout racine Next.js ; actuellement basé sur le template initial.
- `src/app/page.tsx` — page d’accueil initiale ; aucun accès à Supabase.
- `.gitignore` — ignore déjà tous les fichiers `.env*`, ce qui permet de conserver la configuration locale hors du contrôle de version.
- `next.config.ts` — configuration Next.js existante ; aucune configuration Supabase.

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` et fichier de lock — ajouter `@supabase/ssr` et ses dépendances pour les clients App Router côté navigateur et serveur.
- [ ] `src/lib/supabase/client.ts` et `src/lib/supabase/server.ts` — exposer les clients réutilisables adaptés à chaque contexte, avec une erreur explicite si une variable manque.
- [ ] `.env.local` et `.env.local.example` — configurer l’URL et la clé publique fournies localement et documenter les noms `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sans inclure la clé réelle dans l’exemple.
- [ ] `README.md` — expliquer la configuration locale et le démarrage de l’intégration.
- [ ] Vérifications ciblées — confirmer le build, ESLint et l’exclusion de `.env.local` par Git.

**Acceptance Criteria:**
- Étant donné les variables Supabase configurées, quand un composant navigateur ou serveur initialise le client approprié, alors le client utilise l’URL et la clé publique fournies.
- Étant donné une configuration incomplète, quand le client est créé, alors une erreur explicite identifie la variable manquante sans exposer de secret.
- Étant donné que `.env.local` contient la configuration réelle, quand les fichiers sont contrôlés, alors cette configuration locale n’est pas suivie par Git.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm.cmd run build` — attendu : compilation Next.js et vérification TypeScript réussies.
- `npm.cmd run lint` — attendu : aucune erreur ESLint.
