# Plan des sprints — NexaMind AI

Ce plan présente les sprints et leurs résultats démontrables en termes simples. Les stories gardent leur numéro pour faciliter le lien avec le découpage des epics.

| Sprint | Objectif | Stories | Ce que je pourrai montrer à la fin | Type |
|---|---|---|---|---|
| 1 | Poser les fondations Next.js et Supabase, puis permettre à un membre de créer son compte et d’accéder à son espace protégé. | 1.1 Voir la page d’accueil de NexaMind<br>1.2 Créer un compte membre<br>1.3 Se connecter et se déconnecter<br>1.4 Accéder à son espace protégé | Un visiteur voit la page d’accueil, crée un compte membre, se connecte au tableau de bord protégé, puis se déconnecte. | Standard |
| 2 | Permettre au responsable d’organiser les catégories et aux membres de créer et modifier leurs ressources. | 2.1 Gérer les catégories<br>2.2 Parcourir et ouvrir une ressource<br>2.3 Ajouter une ressource textuelle<br>2.4 Modifier une ressource autorisée | Le responsable crée une catégorie ; un membre consulte les ressources, puis ajoute et modifie son texte dans cette catégorie. | Standard |
| 3 | Permettre aux membres de filtrer et rechercher les ressources, et de supprimer une ressource autorisée. | 2.5 Filtrer les ressources par catégorie<br>2.6 Supprimer une ressource autorisée<br>3.1 Rechercher des ressources par mots-clés | Un membre filtre et recherche des ressources par mots-clés, supprime sa propre ressource après confirmation, puis vérifie qu’elle n’apparaît plus dans les listes ni dans les résultats. | Standard |
| 4 | Permettre à chaque membre de retrouver, relancer et supprimer ses recherches sans IA. | 3.2 Retrouver ses recherches récentes<br>3.3 Relancer une recherche enregistrée<br>3.4 Supprimer une recherche de son historique | Un membre consulte ses recherches datées, en relance une et en supprime une autre ; un autre membre ne peut pas accéder à son historique. | Standard |
| 5 | Préparer les ressources pour la recherche IA en les découpant en passages et en enregistrant leurs représentations. | 4.1 Découper une ressource en passages<br>4.2 Créer et enregistrer les embeddings<br>4.3 Suivre l’état de préparation d’une ressource | Une ressource est découpée et préparée pour la recherche ; son état et ses erreurs sont visibles, la préparation peut être relancée, et une ressource supprimée ne ressort plus de l’index. | IA |
| 6 | Retrouver les passages pertinents par leur sens, afficher des extraits et respecter les droits d’accès. | 4.4 Retrouver les passages pertinents par le sens<br>4.5 Afficher les extraits des passages retrouvés<br>4.6 Limiter la recherche aux ressources accessibles | Une recherche formulée avec d’autres mots retrouve un passage pertinent, en montre un extrait ouvrable et ne révèle que les ressources accessibles au membre. | IA |
| 7 | Répondre aux questions à partir des passages retrouvés, montrer les sources ou signaler que l’information manque. | 4.7 Générer une réponse à partir des passages retrouvés<br>4.8 Afficher les sources de la réponse<br>4.9 Signaler l’absence de réponse et les erreurs | Une question reçoit une réponse liée aux passages avec des sources ouvrables ; si le contexte ne suffit pas, l’assistant le dit et permet de réessayer après une erreur. | IA |
| 8 | Permettre à chaque membre de consulter, rouvrir, continuer et supprimer ses propres conversations. | 4.10 Consulter la liste de ses conversations<br>4.11 Rouvrir une conversation<br>4.12 Continuer une conversation précédente<br>4.13 Supprimer une conversation de son historique | Un membre consulte sa liste privée, rouvre un échange et poursuit la conversation ; il peut la supprimer, tandis qu’un autre membre ne peut ni consulter sa liste ni ouvrir l’échange. | IA |
| 9 | Vérifier que les réponses sont appuyées par leurs sources, que les contenus non autorisés restent cachés et que l’assistant s’abstient lorsque nécessaire. | 4.14 Relier les affirmations aux sources<br>4.15 Empêcher la divulgation de ressources non autorisées<br>4.16 Vérifier la qualité et l’abstention de l’assistant | Les affirmations non étayées sont retirées ou signalées, les ressources non autorisées ne sont pas divulguées, au moins 8 réponses sur 10 citent une source attendue, et l’assistant s’abstient pour les 3 questions sans réponse. | IA |

## Récapitulatif

- **Nombre total de sprints :** 9.
- **Nombre total de stories :** 30.

## Points encore ouverts

- Choisir l’hébergement de Next.js.
- Choisir le fournisseur IA et préciser le budget ou les limites d’utilisation ; le fournisseur d’embeddings reste aussi à choisir.
- Définir les réglages de découpage des textes et de recherche.
- Avant une mise en production, définir la surveillance, les journaux, les sauvegardes et la séparation des environnements.
