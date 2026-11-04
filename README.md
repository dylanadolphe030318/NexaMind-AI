This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Configuration Supabase

1. Dans Supabase, ouvrez **Project Settings → API** et copiez le **Project URL** ainsi que la **Publishable key**. L’URL doit être l’adresse racine du projet, sans `/rest/v1`.
2. À la racine du dépôt, créez `.env.local` :

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

   N’utilisez jamais une clé `service_role` dans le navigateur ou dans ce fichier.

   Pour l’IA (epic 4), ajoutez aussi la clé OpenAI, **sans** préfixe `NEXT_PUBLIC_` pour qu’elle reste côté serveur :

   ```env
   OPENAI_API_KEY=<openai-key>
   ```

   Elle ne se lit que dans du code serveur (`import "server-only"`, comme `src/lib/supabase/server.ts`), jamais dans un composant client. Sur Vercel, elle se déclare dans les variables d’environnement du projet, sans préfixe `NEXT_PUBLIC_`.
   Lors de la création d'une ressource ou de la modification de son texte, le contenu est envoyé à OpenAI pour calculer les embeddings. Le formulaire exige une confirmation : n'envoyez que des données fictives ou explicitement autorisées.
3. Dans SQL Editor, appliquez dans l’ordre les fichiers SQL de supabase/migrations : 20261029133000_create_member_profiles.sql puis 20261030140000_create_categories.sql puis 20261030160000_create_resources.sql puis 20261030170000_resources_insert_policy.sql puis 20261030180000_resources_update_policy.sql puis 20261030190000_resources_length_checks.sql puis 20261030191000_categories_name_trim_check.sql puis 20261101140000_resources_delete_policy.sql puis 20261101180000_create_searches.sql puis 20261101190000_profiles_add_email.sql puis 20261101200000_searches_allow_empty_query.sql puis 20261102100000_resource_chunks.sql puis 20261103100000_resource_chunk_embeddings.sql puis 20261103110000_begin_resource_reindexing.sql puis 20261104100000_chunks_readable_when_ready.sql puis 20261104110000_lock_resource_revision.sql puis 20261104120000_limit_published_chunks.sql (les migrations 190000 et 191000 imposent en base les limites de saisie ; la 20261101140000 autorise le propriétaire ou un responsable à supprimer une ressource, story 2.6 ; la 20261101180000 crée la table privée de l’historique des recherches, story 3.2 ; la 20261101190000 ajoute l’adresse e-mail dans les profils ; la 20261101200000 autorise une recherche vide dans l’historique ; la 20261102100000 crée les passages des ressources, leur état de préparation et les fonctions qui les écrivent, story 4.1 ; la 20261103100000 ajoute les vecteurs pgvector et publie ensemble les passages, embeddings et état « prête » pour la révision courante, story 4.2 ; la 20261103110000 permet de relancer la préparation d’une ressource en échec, story 4.3 ; la 20261104100000 ne rend les passages lisibles que pour une ressource prête ; la 20261104110000 verrouille la ressource pendant une modification ; la 20261104120000 limite à 100 le nombre de passages publiés). Ils créent l’espace de travail, les profils, les catégories et les ressources avec leurs politiques RLS ; la migration 170000 autorise un membre à créer ses propres ressources (story 2.3) et la migration 180000 autorise le propriétaire ou un responsable à les modifier, avec mise à jour automatique de la date (story 2.4). Ne créez pas ces tables manuellement dans Table Editor.
4. Dans Authentication -> Providers, vérifiez que le fournisseur Email est activé.
5. Pour créer le responsable initial, inscrivez d’abord son compte comme membre puis, dans SQL Editor, remplacez l’adresse ci-dessous et exécutez cette promotion manuelle :

   ```sql
   update public.profiles as profile
   set role = 'responsable'
   from auth.users as auth_user
   where profile.id = auth_user.id
     and auth_user.email = '<adresse-du-responsable>'
     and profile.role = 'membre';
   ```

   Vérifiez que le profil correspondant a le rôle responsable. Les rôles ne se modifient jamais depuis l’application.
6. Redémarrez le serveur local après toute modification de .env.local.

Un fichier `.env.example` sans secret est fourni comme modèle. Copiez-le vers `.env.local`, puis remplacez les valeurs fictives. La migration 20261103100000_resource_chunk_embeddings.sql doit être appliquée après 20261102100000_resource_chunks.sql avant de créer ou modifier une ressource avec embeddings.

Avant d'appliquer la migration pgvector, vérifiez le schéma de l'extension dans **Supabase → SQL Editor** :

```sql
select namespace.nspname as schema_name
from pg_extension as extension
join pg_namespace as namespace on namespace.oid = extension.extnamespace
where extension.extname = 'vector';
```

Si la requête ne retourne aucune ligne, la migration crée l'extension dans `extensions`. Si elle retourne un autre schéma que `extensions`, arrêtez-vous et faites vérifier la migration avant de l'exécuter.

### Vérifier les politiques RLS avec des sessions réelles

Créez deux comptes membre de test distincts dans Supabase, puis ajoutez leurs identifiants à `.env.local` (ne les commitez pas). Les variables du responsable sont nécessaires : sans elles, les sous-tests du responsable sont ignorés et aucune catégorie n'est créée pour les tests de ressources (stories 2.3 et 2.4), qui échouent alors sur une base neuve :

```env
RLS_TEST_MEMBER_A_EMAIL=<e-mail-du-membre-a>
RLS_TEST_MEMBER_A_PASSWORD=<mot-de-passe-du-membre-a>
RLS_TEST_MEMBER_B_EMAIL=<e-mail-du-membre-b>
RLS_TEST_MEMBER_B_PASSWORD=<mot-de-passe-du-membre-b>
RLS_TEST_MANAGER_EMAIL=<e-mail-du-responsable>
RLS_TEST_MANAGER_PASSWORD=<mot-de-passe-du-responsable>
```

Si la confirmation d'adresse e-mail est activée dans Supabase, confirmez les comptes de test utilisés avant de lancer les tests.

Après application de toutes les migrations ci-dessus (catégories et ressources comprises), lancez `npm run test:integration`. Ces tests utilisent la clé publishable et les sessions de deux membres et du responsable : ils vérifient l’accès aux profils, aux catégories ainsi que les autorisations de création et de renommage. Aucune clé `service_role` n’est utilisée.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
