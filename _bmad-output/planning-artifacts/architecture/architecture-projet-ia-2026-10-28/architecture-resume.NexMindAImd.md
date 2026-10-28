# Résumé de l’architecture — NexaMind AI

## Fonctionnement général

**Utilisateur → Next.js → Supabase → base de données :** l’utilisateur agit dans l’application ; Next.js traite sa demande côté serveur et Supabase vérifie ses droits avant de lire ou modifier les données.

## Rôle des outils

**Next.js** affiche l’application et reçoit les actions des utilisateurs. Il vérifie les demandes, applique les règles métier et appelle l’IA côté serveur, sans exposer ses clés dans le navigateur.

**Supabase** gère les comptes et les sessions, stocke les données et contrôle les accès. Sa base PostgreSQL conserve aussi les vecteurs utilisés pour retrouver des contenus pertinents.

## Principales données stockées

- **Profils et espace de travail :** rôle de chaque personne (membre ou responsable) et rattachement à l’espace commun.
- **Catégories et ressources :** contenus partagés, catégorie, propriétaire et état de leur indexation.
- **Passages de ressources :** morceaux de texte et vecteurs permettant la recherche contextuelle.
- **Recherches et résultats :** requêtes personnelles et résultats recalculés à la réouverture.
- **Conversations, messages et sources :** échanges privés et références des ressources citées.

## Qui peut faire quoi ?

- **Visiteur :** créer un compte ; il ne consulte pas les données de l’application.
- **Membre :** lire les ressources et catégories communes, créer des ressources, modifier ou supprimer les siennes, et gérer son propre historique.
- **Responsable :** gérer toutes les ressources et les catégories ; son historique reste privé comme celui d’un membre.

## Décisions importantes

- **Les accès sont contrôlés par la base de données.** Chaque personne voit seulement les données permises par son rôle et son historique reste privé.
- **L’IA fonctionne côté serveur.** Les secrets ne sont pas envoyés au navigateur ; les réponses doivent s’appuyer sur les ressources accessibles et citées.
- **Les conversations gardent leur contexte.** Une conversation rouverte peut être poursuivie ; une nouvelle question tient compte des échanges précédents.
- **L’historique est limité dans le temps.** Recherches et conversations expirent 30 jours après leur dernière activité effective.
- **Les données envoyées à l’IA doivent être autorisées.** Seules des données fictives ou explicitement autorisées sont transmises à un fournisseur externe.

## Points encore ouverts

- Choisir le serveur qui exécutera Next.js ; GitHub est le dépôt du code.
- Définir le budget et les quotas d’utilisation de l’IA.
- Préciser le découpage des textes et les réglages de recherche après des essais.
- **[ASSUMPTION]** Le MVP accepte uniquement du texte saisi ou collé, sans fichiers ; l’usage de Supabase Storage dépendra de la portée retenue.
- Définir avant un usage en production la surveillance, la journalisation, les sauvegardes et la séparation des environnements.
