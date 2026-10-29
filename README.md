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
3. Ouvrez **SQL Editor → New query**, copiez le contenu de `supabase/migrations/20261029133000_create_member_profiles.sql`, puis cliquez sur **Run**. Cette migration crée l’espace de travail, les profils membres et leurs politiques RLS. Ne créez pas ces tables manuellement dans Table Editor.
4. Dans **Authentication → Providers**, vérifiez que le fournisseur **Email** est activé.
5. Redémarrez le serveur local après toute modification de `.env.local`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
