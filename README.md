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
   # Optionnel : modèle des réponses de l'assistant (défaut : gpt-6-luna)
   OPENAI_CHAT_MODEL=gpt-6-luna
   ```

   Elle ne se lit que dans du code serveur (`import "server-only"`, comme `src/lib/supabase/server.ts`), jamais dans un composant client. Sur Vercel, elle se déclare dans les variables d’environnement du projet, sans préfixe `NEXT_PUBLIC_`.
   Lors de la création d'une ressource ou de la modification de son texte, le contenu est envoyé à OpenAI pour calculer les embeddings. Le formulaire exige une confirmation : n'envoyez que des données fictives ou explicitement autorisées.
3. Dans SQL Editor, appliquez dans l’ordre les fichiers SQL de supabase/migrations : 20261029133000_create_member_profiles.sql puis 20261030140000_create_categories.sql puis 20261030160000_create_resources.sql puis 20261030170000_resources_insert_policy.sql puis 20261030180000_resources_update_policy.sql puis 20261030190000_resources_length_checks.sql puis 20261030191000_categories_name_trim_check.sql puis 20261101140000_resources_delete_policy.sql puis 20261101180000_create_searches.sql puis 20261101190000_profiles_add_email.sql puis 20261101200000_searches_allow_empty_query.sql puis 20261102100000_resource_chunks.sql puis 20261103100000_resource_chunk_embeddings.sql puis 20261103110000_begin_resource_reindexing.sql puis 20261104100000_chunks_readable_when_ready.sql puis 20261104110000_lock_resource_revision.sql puis 20261104120000_limit_published_chunks.sql puis 20261105100000_search_resource_chunks.sql puis 20261105110000_semantic_search_rate_limit.sql puis 20261105130000_search_all_matching_chunks.sql puis 20261105140000_search_resource_chunks_hybrid.sql (les migrations 190000 et 191000 imposent en base les limites de saisie ; la 20261101140000 autorise le propriétaire ou un responsable à supprimer une ressource, story 2.6 ; la 20261101180000 crée la table privée de l’historique des recherches, story 3.2 ; la 20261101190000 ajoute l’adresse e-mail dans les profils ; la 20261101200000 autorise une recherche vide dans l’historique ; la 20261102100000 crée les passages des ressources, leur état de préparation et les fonctions qui les écrivent, story 4.1 ; la 20261103100000 ajoute les vecteurs pgvector et publie ensemble les passages, embeddings et état « prête » pour la révision courante, story 4.2 ; la 20261103110000 permet de relancer la préparation d’une ressource en échec, story 4.3 ; la 20261104100000 ne rend les passages lisibles que pour une ressource prête ; la 20261104110000 verrouille la ressource pendant une modification ; la 20261104120000 limite à 100 le nombre de passages publiés ; la 20261105100000 ajoute la recherche sémantique des passages avec les droits du membre, story 4.4 ; la 20261105110000 limite le nombre de recherches par minute ; la 20261105130000 renvoie les 5 meilleurs passages même s'ils viennent de la même ressource ; la 20261105140000 ajoute un classement textuel borné pour `/resources/search`, sans modifier le classement vectoriel de `/assistant`). Ils créent l’espace de travail, les profils, les catégories et les ressources avec leurs politiques RLS ; la migration 170000 autorise un membre à créer ses propres ressources (story 2.3) et la migration 180000 autorise le propriétaire ou un responsable à les modifier, avec mise à jour automatique de la date (story 2.4). Ne créez pas ces tables manuellement dans Table Editor.
   Après les migrations ci-dessus, appliquez `20261106120000_create_conversations.sql` : elle crée l’historique privé (stories 4.10), ses fonctions d’écriture atomique et fournit les identifiants de passage nécessaires aux références de sources. Les nouvelles tables ne doivent pas être créées manuellement.
   Appliquez ensuite `20261107100000_search_resource_chunks_hybrid_window.sql` dans une nouvelle requête du SQL Editor. Elle porte à 0,20 la fenêtre de classement hybride de `/resources/search` et ne change ni la RLS ni la limite de cinq passages. Si l’ancienne version a échoué avec l’erreur `42P13`, exécutez le fichier complet mis à jour : il supprime uniquement l’ancienne fonction avant de la recréer et réattribue ses permissions, sans supprimer ses dépendances. Ne rejouez pas le script après succès.
   Pour une installation neuve, appliquez ensuite `20261110143000_restore_hybrid_chunk_references.sql` pour conserver les références de passages dans l'ancien RPC hybride. Ce correctif est déjà appliqué au projet actuel : ne le rejouez pas.
   Pour la story 3.5 sur le projet actuel, appliquez manuellement dans une nouvelle requête SQL Editor le seul nouveau fichier `20261110210000_search_resource_chunk_candidates.sql`. Il ajoute un RPC distinct qui reprend le classement hybride et les références `chunk_id`/révision, sous RLS (`security invoker`), avec un plafond serveur de vingt candidats et une permission `authenticated` uniquement. Ne modifiez ni ne remplacez l'ancien RPC à cinq passages. La recherche appelle ce RPC avec la session du membre ; OpenAI sélectionne ensuite au plus cinq passages originaux, qui seuls peuvent être affichés ou transmis à la sélection de phrase. La question et jusqu'à vingt passages (titre et contenu) sont envoyés à OpenAI, ce qui peut augmenter le délai et le coût.
   Avant l'application manuelle, le nouveau parcours n'est pas opérationnel en base : ne lancez pas d'essais distants. Après application, vérifiez avec une session membre autorisée la limite de vingt et les références de passages, le maintien de la RLS avec cette session, le refus d'un appel anonyme et le réessai. Rejouez ensuite sans modifier les dix questions de `tests-ia.md` et évaluez Q1–Q8 selon la grille de la story. Q9/Q10 restent non vérifiées faute de ressource réellement interdite ; ne revendiquez ni validation complète ni score 8/10 validé avant leur vérification. L'évaluation navigateur finale reste à effectuer par Dylan.
   Pour une installation neuve, appliquez ensuite `20261111103000_cleanup_rls_test_category.sql`. Cette migration ajoute uniquement `public.cleanup_rls_test_category`; elle ne supprime aucune catégorie à l’installation et n’accorde aucun droit général `DELETE`. Le RPC exige une session authentifiée de responsable dans l’espace, verrouille l’identifiant exact, n’accepte que les noms de fixture `RLS-<UUID>` (éventuellement renommés en `-renommée`) et refuse les catégories encore utilisées. Un nouvel appel après suppression renvoie `false`, à confirmer par une lecture d’absence sous RLS.

   Après la livraison A (migration appliquée, tests réussis, inventaire approuvé nettoyé et commit A créé), appliquez `20261111110000_align_candidate_similarity_default.sql`. Cette migration conserve la signature, le corps, `SECURITY INVOKER`, le chemin SQL et les permissions du RPC candidats ; seul son seuil implicite passe de `0,3` à `0,2`. L’ancien RPC à cinq passages et l’assistant ne changent pas. Vérifiez avec `node --env-file=.env.local --test tests/semantic-search-rls.test.mjs` : le RPC sans seuil et avec `0,2` doit renvoyer les mêmes références pour une fixture à `0,25`, et la fixture doit disparaître à `0,3`. N’appliquez pas C avant A.

   Pour les tests RLS, fournissez les identifiants de deux membres distincts et du responsable dans `.env.local`, toujours avec la clé publishable. Lancez `node --test tests/rls-cleanup.test.mjs`, puis `node --env-file=.env.local --test tests/supabase-rls.test.mjs`. Le test d’intégration couvre le succès, le réessai, l’anonyme, le membre, un espace non autorisé, une catégorie réelle et une catégorie utilisée ; il nettoie les fixtures par identifiant et vérifie leur absence avant de déconnecter les sessions. Les erreurs de nettoyage et de déconnexion sont conservées avec l’erreur initiale. En cas d’échec, arrêter et conserver le diagnostic ; ne pas utiliser de clé privilégiée ni une suppression par préfixe.

   Le nettoyage historique approuvé le 11 novembre 2026 portait uniquement sur les onze catégories inventoriées et approuvées par Dylan. Avant ce retrait, la ressource `24f359d7-5869-4eac-beb9-a58ff599f98c` a été déplacée conditionnellement de `2a564d62-edf3-48ec-8ae5-7c8879336c48` vers « Documents internes » (`734b114b-cacb-4ace-90b1-e0484055ed49`). Son contenu, son passage et ses références accessibles ont été comparés avant/après sans journaliser leur contenu. Les onze catégories approuvées ont ensuite été vérifiées et retirées via le RPC, chacune avec réessai et lecture confirmant son absence. Ne rejouez pas cette opération.

   La « Phrase la plus pertinente » utilise désormais des phrases candidates numérotées,
   extraites côté serveur des cinq passages retenus (300 caractères maximum chacune).
   OpenAI choisit un seul numéro global (`answer` vide, `sources` avec ce numéro,
   `missing=false`), ou aucun (`sources` vide, `missing=true`). Le serveur restitue
   le texte et la source de la candidate, jamais une phrase rédigée par le modèle.
   Un numéro invalide, du texte généré ou une erreur fournisseur restent des erreurs
   explicites, sans repli. Aucun appel n'est effectué sans candidate admissible.
   Ce contrat est réservé à la recherche de ressources ; l'assistant reste inchangé.
   Les deux sélections de ressources (passages puis phrase) disposent chacune d'un
   budget de 2 048 tokens, raisonnement interne compris ; l'assistant conserve
   500 tokens. Ce plafond plus large peut augmenter le coût et le délai, sans
   garantir la disponibilité du fournisseur. Le délai maximal reste de 30 secondes
   par appel, sans réessai automatique. Les erreurs de réponse journalisent
   uniquement une catégorie (`length`, `refusal`, `incomplete`), jamais la question,
   les passages, le contenu du refus ou la clé. Aucun SQL ni réindexage supplémentaire
   n'est nécessaire pour ce changement.
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

### Tester la connexion sur Android Chrome et le réseau local

Le téléphone et le PC doivent utiliser le même réseau privé de confiance.
`localhost` sur le téléphone désigne le téléphone, pas le PC.
L'adresse Wi-Fi du PC au moment de ce diagnostic est `192.168.1.180`.
`next.config.ts` autorise précisément cet hôte dans `allowedDevOrigins`, pour
que Next.js accepte ses connexions de développement (`/_next/hmr`). Aucun joker
ni contournement des vérifications d'origine des actions serveur n'est nécessaire.
Si l'adresse Wi-Fi change, remplacer cette entrée par la nouvelle adresse et
adapter le certificat ci-dessous, puis redémarrer le serveur.

Après une modification de configuration, arrêter le serveur dans son terminal
avec **Ctrl+C** puis le relancer. Fermer les anciens onglets du téléphone.
Un blocage HMR a été observé ; l'effacement pendant la saisie n'a pas été
reproduit dans le navigateur automatisé. Ne pas considérer le test Android comme
validé avant d'avoir retesté sur le téléphone.

#### HTTPS local avec un certificat reconnu sur Android

Le simple préfixe `https://` ne suffit pas : le serveur doit utiliser un
certificat couvrant son adresse IP, et le téléphone doit reconnaître son autorité.
Ne pas ignorer les avertissements de certificat et ne pas désactiver TLS.
Cette procédure est destinée à ton propre téléphone de test, pas à la production.
Elle ajoute une autorité de confiance : ne l'installer que si tu contrôles le PC
et le téléphone ; la retirer après les tests.

1. Installer **mkcert** via Windows Package Manager :

   ```powershell
   winget install --id FiloSottile.mkcert --exact --source winget --scope user
   ```

   Cette commande installe l'outil officiel dont winget vérifie le téléchargement.
   Voir la [documentation mkcert](https://github.com/FiloSottile/mkcert).
2. Dans PowerShell, créer les certificats **hors du dépôt et de OneDrive** :

   ```powershell
   $tls = Join-Path $env:LOCALAPPDATA 'NexaMind\local-https'
   $env:CAROOT = Join-Path $tls 'ca'
   $env:TRUST_STORES = 'system'
   $mkcert = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\mkcert.exe'
   New-Item -ItemType Directory -Force -Path $tls,$env:CAROOT
   & $mkcert -install
   & $mkcert -cert-file "$tls\local.pem" -key-file "$tls\local-key.pem" localhost 127.0.0.1 192.168.1.180
   ```

   Ces commandes choisissent un dossier local non synchronisé, ajoutent l'autorité
   au magasin de confiance Windows (confirmation possible), puis génèrent le
   certificat et sa clé pour les adresses indiquées. Arrêter si une commande échoue.
   Ne jamais copier ou partager
   `local-key.pem` ni `rootCA-key.pem`.
3. Créer une copie du certificat **public** pour Android, dans le même terminal :

   ```powershell
   Copy-Item -LiteralPath "$env:CAROOT\rootCA.pem" -Destination "$tls\nexamind-local-ca.crt"
   ```

   Transférer **uniquement `nexamind-local-ca.crt`** sur le téléphone par câble USB.
   Ce fichier public est dans `%LOCALAPPDATA%\NexaMind\local-https`.
   Ne pas copier le dossier entier, le dossier d'autorité ni une clé dans `public`.
4. Sur Android : **Paramètres → Sécurité** (ou **Sécurité et confidentialité**)
   **→ Autres paramètres de sécurité → Chiffrement et identifiants
   → Installer un certificat → Certificat d'autorité de certification**.
   Les noms varient selon le fabricant. Sélectionner la copie publique et
   confirmer uniquement si elle provient de ton PC. Ne pas choisir un certificat
   client « VPN et applications ». Si le téléphone est géré et interdit
   l'installation, arrêter : ne pas contourner cette restriction.
5. Après avoir arrêté l'ancien serveur avec Ctrl+C, lancer :

   ```powershell
   $tls = Join-Path $env:LOCALAPPDATA 'NexaMind\local-https'
   $env:NODE_EXTRA_CA_CERTS = "$tls\ca\rootCA.pem"
   npm run dev -- --hostname 0.0.0.0 --port 3000 --experimental-https --experimental-https-key "$tls\local-key.pem" --experimental-https-cert "$tls\local.pem"
   ```

   Cette commande démarre Next.js en HTTPS pour le réseau local avec le certificat
   fourni ; Node utilise l'autorité locale pour ses propres vérifications TLS.
   Elle ne publie pas l'application sur Internet. Si Windows demande
   l'accès réseau, autoriser uniquement le réseau privé. Ne pas ouvrir de port
   sur la box ; ne pas désactiver le pare-feu. Vérifier le port annoncé dans le
   terminal ; les liens ci-dessous supposent le port 3000.
6. Fermer puis rouvrir Chrome sur le téléphone et ouvrir
   `https://192.168.1.180:3000/login`. Vérifier l'absence d'avertissement de
   certificat **avant** d'utiliser le compte de test. L'ancienne adresse HTTP
   ne convient plus. Aucun réglage Supabase n'est requis pour la connexion
   e-mail/mot de passe actuelle ; les parcours par lien e-mail ne sont pas
   couverts par ce test.
7. Saisir d'abord une adresse fictive et un faux mot de passe **sans envoyer le
   formulaire**. Changer de champ, ouvrir/fermer le clavier et attendre trente
   secondes : rien ne doit s'effacer. Tester ensuite la connexion avec le compte
   de test seulement si HTTPS est reconnu. Si l'effacement persiste, noter s'il
   survient pendant la saisie ou après « Se connecter », et relever l'heure et
   les erreurs du terminal sans inclure les identifiants.
8. À la fin des tests, arrêter le serveur et retirer cette autorité dans les
   certificats utilisateur Android. Supprimer la copie publique transférée.
   Garder toutes les clés privées sur le PC. Pour retirer aussi la confiance
   Windows, définir `CAROOT` sur `%LOCALAPPDATA%\NexaMind\local-https\ca` puis
   exécuter `mkcert -uninstall` avec le même outil.

### Suppression d'une conversation (story 4.13)

Après les migrations de continuation `20261109130000_continue_conversations.sql` et
`20261110123000_fix_conversation_generation_token.sql`, appliquez
`supabase/migrations/20261110140000_delete_owned_conversation.sql` dans une nouvelle
requête du SQL Editor, en copiant tout le fichier (`begin` et `commit` compris).
Cette migration ajoute une fonction, sans supprimer de conversation à son installation.
En cas d'erreur, arrêtez-vous et conservez le message complet.

Dans « Mes conversations », « Supprimer » ouvre une confirmation nommant l'échange.
« Annuler » ne change rien ; confirmer supprime définitivement la conversation,
ses messages et ses références de sources, mais conserve les ressources citées.
Seul le propriétaire peut supprimer, y compris face au rôle responsable.
Une fois la migration appliquée, lancez
`node --env-file=.env.local --test --test-timeout=240000 tests/conversations-rls.test.mjs`.
Le scénario de suppression ignoré pour migration absente ne constitue pas une validation.
Contrôle manuel : scénarios S8-H et S8-F de `tests-ia.md`.

### Correctif des références de recherche hybride

Après les migrations précédentes, ouvrez
`supabase/migrations/20261110143000_restore_hybrid_chunk_references.sql`.
Copiez tout le fichier dans une nouvelle requête du **Supabase → SQL Editor**,
puis cliquez sur **Run** (`begin` et `commit` compris).
Cette migration rétablit `chunk_id` et `revision`, retirés par la migration de
fenêtre hybride du 7 novembre. Elle ne modifie ni les données, ni le classement,
ni les droits d'accès. La recréation de la fonction et de ses permissions est
transactionnelle et sans `CASCADE`. En cas d'erreur, arrêtez-vous et conservez
le message complet ; ne supprimez pas les protections pour forcer l'application.
Ne rejouez pas les anciennes migrations après ce correctif.

Après succès, lancez :

```bash
node --env-file=.env.local --test --test-timeout=240000 tests/semantic-search-rls.test.mjs
```

Le test compare les identifiants et révisions réellement renvoyés aux passages
enregistrés. Aucun échec ni test ignoré ne doit subsister. Les tests locaux sur
le texte SQL ne remplacent pas cette vérification dans Supabase.

### Expiration et purge des conversations

Une conversation expire 30 jours après sa dernière nouvelle question. RLS la masque dès l'expiration, même si la purge n'est pas encore planifiée. La migration fournit `public.purge_expired_conversations()` ; elle ne planifie pas elle-même de tâche.

Appliquez `20261106120000_create_conversations.sql` dans une nouvelle requête du SQL Editor, après les migrations précédentes. Le script est transactionnel : si une erreur apparaît, arrêtez-vous et faites-la vérifier ; ne retirez pas `begin` ou `commit`. Ne rejouez pas le script après un succès. Tant que cette migration manque, l'enregistrement des questions de l'assistant affiche une erreur explicite et les tests de conversations sont ignorés : ils ne sont pas validés.

Dans **Supabase → Database → Extensions**, vérifiez que `pg_cron` est activée. Si elle ne l'est pas, activez-la avant de planifier la purge. Dans SQL Editor, vérifiez d'abord qu'aucune tâche de même nom n'existe :

```sql
select jobname, schedule, active
from cron.job
where jobname = 'purge-expired-conversations';
```

Si aucune ligne n'est retournée, créez la tâche quotidienne à 03:00 UTC :

```sql
select cron.schedule(
  'purge-expired-conversations',
  '0 3 * * *',
  $$select public.purge_expired_conversations();$$
);
```

Relancez la première requête pour vérifier la planification. Ne lancez pas la requête de planification une seconde fois si la tâche existe déjà.

Pour vérifier l'expiration sans attendre 30 jours, exécutez le fichier complet
`tests/conversations-expiration.sql` dans une nouvelle requête SQL Editor avec le
rôle `postgres`. Il crée des conversations fictives, vérifie leur visibilité sous
RLS et leur purge en cascade, puis annule le sous-bloc de test avec un signal
SQL dédié. Aucune donnée de test ni suppression n'est conservée. Une exécution
réussie affiche « Success. No rows returned » et peut afficher la notice
« Expiration RLS et purge : OK. Aucune modification conservee. ». Toute autre
erreur est propagée et annule le test ; transmettez-la avant de poursuivre.
Le fichier est une seule instruction `DO`, sans dépendance à une table temporaire.

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

Après application de toutes les migrations ci-dessus (catégories, ressources et conversations comprises), lancez `npm run test:integration`. Ces tests utilisent la clé publishable et les sessions de deux membres et du responsable : ils vérifient l’accès aux profils, aux catégories, aux ressources et aux conversations privées, y compris les refus d'accès d'un autre membre ou du responsable. Aucune clé `service_role` n’est utilisée.
Le test des conversations crée une question dans chaque compte de test ; ces lignes restent privées puis sont purgées après expiration (30 jours).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
