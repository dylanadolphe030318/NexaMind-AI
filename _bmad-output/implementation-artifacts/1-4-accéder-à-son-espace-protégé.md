---
story: 1-4-accéder-à-son-espace-protégé
title: Accéder à son espace protégé
epic: 1
sprint: 1
status: in-review
baseline_commit: 60548053e1134213152766db9c6edfd125284b26
---

# Story 1.4 : Accéder à son espace protégé

## Récit utilisateur

En tant que membre connecté, je veux accéder à mon espace protégé afin de retrouver un point de départ personnel dans l'application.

## Critères d'acceptation

1. Étant donné que je me connecte, quand le tableau de bord s'affiche, alors je vois un accueil NexaMind AI et l'identité du membre connecté.
2. Étant donné qu'une personne n'est pas connectée, quand elle ouvre directement l'adresse du tableau de bord, alors elle est redirigée vers la connexion sans voir de données privées.
3. Étant donné que je consulte le tableau de bord, quand je cherche à fermer ma session, alors une action clairement nommée me permet de me déconnecter.
4. Étant donné qu'un visiteur ou un membre tente de lire directement des données protégées dans Supabase sans autorisation, quand les tests d'intégration interrogent la base avec sa session réelle, alors les politiques RLS refusent l'accès ou ne retournent que les lignes permises, sans utiliser une clé de service privilégiée pour contourner ces règles.

## Limites de la story

Cette première version couvre l'accueil protégé et l'identité du membre. Les ressources, la recherche et l'assistant IA ne font pas partie de cette story.

## Review Triage Log

| Constat | Verdict | Traitement | Éléments probants |
|---|---|---|---|
| Le README généralise la vérification à toutes les tables protégées alors que le test cite `profiles` et `workspaces`. | false | rejeté | La migration de cette version n'expose que ces deux tables protégées ; les deux sont testées. |
| Les critères de l'Epic 2–4 impliqueraient aussi de tester ressources, recherche, conversations et écritures. | false | hors périmètre | La story exclut explicitement les ressources, la recherche et l'assistant ; les autres stories ne font pas partie de son intention. |
| Les tests devraient couvrir les permissions du responsable. | false | hors périmètre | Cette story porte sur l'accès membre et ne définit aucun parcours ni droit du responsable. |
| Les identifiants manquants font ignorer l'unique test d'intégration et le processus retourne le succès. | medium | patch | `tests/supabase-rls.test.mjs` échoue maintenant immédiatement avec la liste des variables manquantes. |
| Le test anonyme exige une erreur au lieu d'accepter une réponse vide protégée par RLS. | false | rejeté | La migration révoque les privilèges `anon` sur les deux tables ; une erreur de lecture est le comportement retenu et valide. |
| Une clé service-role pourrait être fournie par erreur dans la variable publishable et contourner RLS. | medium | patch | Le test refuse maintenant les clés `sb_secret_` et les JWT dont le rôle est `service_role`, sans exposer la valeur. |
| Le critère RLS ne nomme pas chaque table ni chaque opération à tester. | false | rejeté | La story demande les refus ou lignes autorisées ; les tests établissent deux cas permis et deux cas interdits sans modifier la story. |
| Le résultat du chasseur d'edge-case décrit une entrée vide ou indécodable. | false | rejeté | Le diff est non vide et contient les modifications de cette story ; le résultat ne cite aucune défaillance du contenu. |
| Aucun test automatisé ne vérifie la redirection anonyme de `/dashboard`. | low | rejeté | La route de production renvoie effectivement `307` vers `/login` sans cookie ; l'ajout d'un harnais de test route nécessite davantage qu'une correction triviale. |
| Aucun test automatisé n'affirme l'identité rendue par le tableau de bord. | low | rejeté | Le composant affiche directement l'e-mail retourné par `auth.getUser()` et le build passe ; aucun harnais de test composant n'est configuré. |
| Aucun test automatisé ne vérifie la déconnexion depuis le tableau de bord. | low | rejeté | L'action appelle `auth.signOut()` puis redirige ; l'exécution avec une session réelle reste indisponible faute de comptes configurés. |
| Les variables absentes permettent au contrôle d'intégration de réussir sans assertions exécutées. | medium | patch | Même cause que le finding sur le test ignoré : le test échoue maintenant avant son inscription si les paramètres sont absents. |
| Les instructions de test ne précisent pas que les comptes doivent confirmer leur adresse lorsque Supabase l'exige. | low | patch | README.md précise maintenant de confirmer les comptes si la confirmation d'adresse est activée. |
| Le test d'isolation peut réussir si le profil du membre B n'existe pas. | medium | patch | `tests/supabase-rls.test.mjs` vérifie maintenant que B lit son propre profil avant que A tente de le lire. |
| Toute erreur de lecture anonyme était assimilée à un refus RLS. | medium | patch | Le test accepte maintenant seulement l'erreur PostgreSQL `42501` ou une réponse réussie vide ; les autres erreurs échouent. |
| La liste de tables protégées est codée en dur et ne couvre pas de futures tables. | false | rejeté | La migration actuelle n'expose que `profiles` et `workspaces` ; la story porte sur l'accès aux données effectivement présentes dans cette première version. |
| Le test visiteur n'utilise pas de session authentifiée. | false | rejeté | Un visiteur non connecté n'a pas de session membre ; le client anonyme utilise la clé publishable pour tester précisément l'accès visiteur. |
| Aucun test automatisé ne vérifie la redirection anonyme de `/dashboard`. | low | rejeté | carried : le contrôle manuel déjà consigné confirme le statut `307` vers `/login` sans cookie ; l'ajout d'un harnais de test route reste hors de ce patch. |
| Aucun test automatisé n'affirme l'identité rendue par le tableau de bord. | low | rejeté | carried : le composant rend l'e-mail retourné par `auth.getUser()` ; aucun harnais de test composant n'est configuré. |
| Aucun test automatisé ne vérifie la déconnexion depuis le tableau de bord. | low | rejeté | carried : la vérification avec une session réelle nécessite les comptes de test absents ; la nouvelle action affiche une erreur si Supabase refuse la déconnexion. |
| L'action redirige vers la connexion même si `auth.signOut()` renvoie une erreur. | medium | patch | L'action redirige maintenant vers le tableau de bord avec un message de reprise au lieu de laisser croire que la session est fermée. |
| La section de déploiement README ne décrit pas le choix Vercel. | false | rejeté | Le déploiement n'est pas dans la portée de la story 1.4 ; les instructions générales du README ne modifient pas l'accès protégé. |
| Une erreur de déconnexion peut être masquée si Supabase efface la session avant de retourner l'erreur. | medium | patch | `auth.signOut()` peut retirer la session sur une erreur distante ; le message est désormais présenté sur la page de connexion plutôt que sur le tableau de bord protégé. |
| Le test d'isolation n'imposait pas que les deux comptes d'essai aient le rôle membre ni ne vérifiait les deux sens. | medium | patch | Le test confirme le rôle `membre` pour A et B et vérifie que chacun ne peut pas lire le profil de l'autre. |
| La lecture de `searchParams` sur la page de connexion bloque le pré-rendu statique Next.js. | medium | patch | `npm run build` reproduisait le blocage de route ; `instant = false` autorise le rendu dynamique requis pour le message de déconnexion. |
| Le tableau de bord ne reprend pas la navigation persistante décrite dans le contexte de l’Epic 1. | false | rejeté | Le contexte de l’Epic n’est pas listé dans le frontmatter de cette story ; l’implémentation suit uniquement ses critères et le lien de marque ainsi que la déconnexion sont présents. |
| Le test anonyme pourrait réussir sans exposer de ligne si les tables étaient vides. | false | rejeté | Les tests exigent deux sessions dont les profils existent et lisent l’espace initial créé par migration ; une réponse vide due à l’absence de données ferait échouer les assertions de membre. |
| Le garde contre les clés Supabase privilégiées n’a pas de test unitaire isolé. | false | rejeté | Le test d’intégration refuse une clé `sb_secret_` ou un JWT `service_role` avant la création du client ; il n’utilise donc pas de clé privilégiée pour contourner RLS. |
| Le README ne précise pas les prérequis de profils et d’espace pour les deux comptes d’essai. | false | rejeté | La migration crée l’espace par défaut et le déclencheur crée le profil lors de l’inscription Auth ; le README précise de confirmer les comptes si nécessaire. |
| Le test ne vérifie pas l’accès de B à son espace ni le refus d’un espace appartenant à un autre membre. | false | rejeté | Cette version utilise un espace unique partagé ; le test vérifie l’accès autorisé à cet espace et l’isolation des profils dans les deux sens. |
| Aucun test automatisé ne vérifie la redirection anonyme de `/dashboard`. | low | rejeté | carried : le contrôle manuel déjà consigné confirme le statut `307` vers `/login` sans cookie ; l’ajout d’un harnais de test route nécessite davantage qu’une correction triviale. |
| Aucun test automatisé n’affirme l’identité rendue par le tableau de bord. | low | rejeté | carried : le composant rend l’e-mail retourné par `auth.getUser()` ; aucun harnais de test composant n’est configuré. |
| Aucun test automatisé ne vérifie la déconnexion depuis le tableau de bord. | low | rejeté | carried : la vérification avec une session réelle nécessite les comptes de test absents ; la nouvelle action affiche une erreur si Supabase refuse la déconnexion. |
