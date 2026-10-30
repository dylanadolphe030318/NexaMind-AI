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
3. Dans SQL Editor, appliquez dans l’ordre les fichiers SQL de supabase/migrations : 20261029133000_create_member_profiles.sql puis 20261030140000_create_categories.sql puis 20261030160000_create_resources.sql puis 20261030170000_resources_insert_policy.sql. Ils créent l’espace de travail, les profils, les catégories et les ressources avec leurs politiques RLS ; la dernière migration autorise un membre à créer ses propres ressources (story 2.3). Ne créez pas ces tables manuellement dans Table Editor.
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

### Vérifier les politiques RLS avec des sessions réelles

Créez deux comptes membre de test distincts dans Supabase, puis ajoutez leurs identifiants à `.env.local` (ne les commitez pas). Les variables du responsable sont facultatives : sans les deux, le sous-test AC4 correspondant sera ignoré avec un message explicite :

```env
RLS_TEST_MEMBER_A_EMAIL=<e-mail-du-membre-a>
RLS_TEST_MEMBER_A_PASSWORD=<mot-de-passe-du-membre-a>
RLS_TEST_MEMBER_B_EMAIL=<e-mail-du-membre-b>
RLS_TEST_MEMBER_B_PASSWORD=<mot-de-passe-du-membre-b>
RLS_TEST_MANAGER_EMAIL=<e-mail-du-responsable>
RLS_TEST_MANAGER_PASSWORD=<mot-de-passe-du-responsable>
```

Si la confirmation d'adresse e-mail est activée dans Supabase, confirmez les comptes de test utilisés avant de lancer les tests.

Après application de la migration des catégories, lancez `npm run test:integration`. Ces tests utilisent la clé publishable et les sessions de deux membres et du responsable : ils vérifient l’accès aux profils, aux catégories ainsi que les autorisations de création et de renommage. Aucune clé `service_role` n’est utilisée.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
