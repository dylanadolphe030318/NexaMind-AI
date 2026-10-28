---
name: NexaMind AI
status: final
sources:
  - ../../prds/prd-projet-ia-2026-10-27/prd.md
updated: 2026-10-28
---

# NexaMind AI — Parcours et comportement

## Foundation

Application web utilisable sur ordinateur et mobile. « Les deux » est interprété ici comme un site web adaptatif, et non comme deux applications natives. **[ASSUMPTION]** Le choix d’un site web adaptatif plutôt que de deux applications natives reste à confirmer. Le PRD ne choisit pas de bibliothèque d’interface ; aucune n’est imposée ici. [DESIGN.md](./DESIGN.md) définit les couleurs, la typographie, les formes et les détails visuels. Les deux documents se complètent et prévalent sur une maquette en cas de divergence.

## Shared Glossary

- **Espace de travail** — lieu logique qui regroupe les membres et les ressources d’une entreprise ou d’une équipe.
- **Ressource** — contenu utile à l’activité : document, note, FAQ, procédure, fiche projet, compte rendu ou historique de tâche.
- **Catégorie** — classement choisi pour retrouver et organiser les ressources.
- **Index vectoriel** — empreinte numérique d’un texte, utilisée pour retrouver des passages proches par leur sens.
- **Base vectorielle** — base de données qui conserve ces empreintes et les liens vers les ressources correspondantes.
- **Recherche sémantique** — recherche qui tient compte du sens d’une question, même si les mots utilisés sont différents.
- **RAG** — méthode où l’application retrouve des passages utiles, les donne à l’IA comme contexte, puis présente une réponse liée à ces passages.
- **Source** — ressource ou passage affiché pour permettre de vérifier une réponse.
- **Membre** — personne inscrite dans l’espace de démonstration ; elle consulte les ressources partagées et gère ses propres ressources.
- **Responsable** — membre privilégié qui configure l’espace et peut gérer toutes les ressources.

## Information Architecture

| Écran ou vue | Accessible depuis | Rôle |
|---|---|---|
| Créer un compte / Se connecter | Visiteur | Créer un compte membre ou ouvrir une session |
| Tableau de bord | Après connexion, navigation principale | Accéder aux ressources, à la recherche et à l’assistant |
| Ressources | Navigation principale ou tableau de bord | Parcourir, filtrer par catégorie et ouvrir les ressources partagées |
| Détail d’une ressource | Liste ou résultat de recherche | Lire le contenu, sa catégorie et sa date de mise à jour |
| Ajouter / modifier une ressource | Ressources ; action autorisée selon le rôle | Saisir un titre, un texte et une catégorie |
| Catégories | Section ressources, responsable uniquement | Créer ou renommer les catégories disponibles |
| Recherche | Navigation principale ou tableau de bord | Chercher par mots-clés ou par sens et consulter les résultats |
| Assistant | Navigation principale ou tableau de bord | Poser une question, lire la réponse et ouvrir ses sources |
| Historique | Navigation principale | Retrouver et rouvrir ses recherches et conversations |

Sur ordinateur, les entrées principales restent visibles dans une navigation latérale. Sur mobile, une navigation compacte donne accès aux mêmes écrans. La gestion des catégories n’apparaît qu’au responsable. Ces choix organisent les fonctions du MVP sans ajouter de fonctions.

## Voice and Tone

L’interface parle simplement, avec calme et précision. Elle dit ce qui vient de se passer et ce que la personne peut faire ensuite. Elle ne promet pas que l’assistant a toujours raison.

| À privilégier | À éviter |
|---|---|
| « Aucun résultat. Modifiez votre recherche. » | « Oups, nous n’avons rien trouvé ! » |
| « Je ne trouve pas cette information dans les ressources disponibles. » | Une réponse spéculative présentée comme certaine |
| « Votre ressource est enregistrée. » | Un message technique ou une confirmation uniquement visuelle |
| « Impossible de charger les résultats. Réessayez. » | « Erreur 500 » ou un code sans explication |

**[ASSUMPTION]** Ces exemples fixent le ton des messages ; ils ne changent pas les règles métier du PRD.

## Component Patterns

Les éléments ci-dessous décrivent le comportement. Leur apparence est décrite dans [DESIGN.md](./DESIGN.md).

| Élément | Comportement |
|---|---|
| Navigation principale | Chaque destination nommée mène à l’écran correspondant. **[ASSUMPTION]** Sur ordinateur, les entrées principales restent visibles dans une navigation latérale. Sur mobile, une navigation compacte donne accès aux mêmes écrans. L’écran courant est indiqué par un libellé ou un état accessible, pas seulement par la couleur. |
| Bouton principal | Déclenche l’action principale visible de l’écran ; après activation, l’état de chargement ou le résultat est annoncé. **[ASSUMPTION]** |
| Bouton secondaire | Déclenche une action secondaire, comme annuler ou revenir ; ne remplace pas un libellé par une icône seule. **[ASSUMPTION]** |
| Formulaire de ressource | Le titre et le texte sont éditables ; une indication de validation est associée au champ concerné. **[ASSUMPTION]** |
| Sélecteur de catégorie | Propose les catégories existantes à tous les membres ; les actions de création et de renommage sont réservées au responsable. |
| Carte de ressource | Affiche le titre, la catégorie et la date ; l’action d’ouverture mène au détail. Les actions de modification et de suppression ne sont proposées que si le rôle le permet. |
| Ligne de ressource | Variante compacte de la carte dans les listes ; conserve le titre et la catégorie et mène au détail à l’activation. **[ASSUMPTION]** |
| Résultat de recherche | Présente le titre et un extrait ; l’ouverture mène à la ressource. |
| Réponse de l’assistant | Sépare clairement la réponse de ses sources ; chaque source permet d’identifier et d’ouvrir la ressource correspondante. |
| Lien de source | Ouvre ou identifie la ressource qui étaye la réponse de l’assistant. |
| Dialogue de confirmation | Présente l’élément concerné et les choix confirmer/annuler avant une suppression. **[ASSUMPTION]** Après confirmation d’une suppression de ressource, celle-ci n’apparaît plus dans les listes, les recherches ni l’index vectoriel. Pour l’historique, seul son propriétaire peut déclencher la suppression. **[ASSUMPTION]** |
| Indicateur d’état | Communique les états avec un libellé lisible et ne repose pas sur la couleur seule. **[ASSUMPTION]** |
| Contour de focus | Rend le contrôle clavier actif visible avec `{colors.focus}` ; **[ASSUMPTION]** le focus suit l’ordre de lecture. |

## State Patterns

| État | Écran | Réponse de l’interface |
|---|---|---|
| Chargement initial des données | Tableau de bord, ressources, historique | **[ASSUMPTION]** Afficher des placeholders simples à la place du contenu attendu ; annoncer le chargement aux technologies d’assistance. |
| Chargement ou échec d’accès | Créer un compte / Se connecter | **[ASSUMPTION]** Indiquer que l’action est en cours ; afficher un message compréhensible si elle échoue. Pour des identifiants invalides, ne révéler aucune information sensible. |
| Espace sans ressource | Tableau de bord ou ressources | **[ASSUMPTION]** Expliquer que l’espace est vide et proposer l’action d’ajout uniquement aux personnes autorisées. |
| Ressource en chargement, erreur ou introuvable | Détail d’une ressource | **[ASSUMPTION]** Signaler le chargement ; en cas d’erreur, proposer de réessayer ; si la ressource n’existe plus ou n’est pas accessible, ne pas afficher son contenu et expliquer que la page ne peut pas être ouverte. |
| Recherche en cours ou en échec | Recherche | **[ASSUMPTION]** Indiquer le chargement ; en cas d’erreur, conserver la requête et proposer une nouvelle tentative. |
| Aucun résultat de recherche | Recherche | Dire qu’aucun résultat n’a été trouvé et laisser la requête modifiable. |
| Catégories en chargement ou en erreur | Ressources / catégories | **[ASSUMPTION]** Indiquer le chargement ; en cas d’erreur, expliquer que les catégories ne sont pas disponibles et permettre de réessayer. |
| Validation incomplète | Ajout / modification | Indiquer le champ obligatoire manquant ; ne pas effacer les autres champs. **[ASSUMPTION]** |
| Indexation en cours | Ajout / modification | **[ASSUMPTION]** Montrer que la ressource est en cours de préparation et ne pas la présenter comme prête pour la recherche sémantique. |
| Indexation échouée | Ajout / modification | Afficher un message compréhensible ; la ressource n’est pas déclarée disponible pour la recherche sémantique. **[ASSUMPTION]** Le membre peut relancer l’indexation. |
| Réponse en préparation | Assistant | **[ASSUMPTION]** Indiquer que l’assistant prépare sa réponse, tout en évitant les animations distrayantes. |
| Contexte insuffisant | Assistant | Dire que les ressources disponibles ne permettent pas de répondre ; ne pas formuler une réponse comme certaine. Proposer de réessayer plus tard, sans relancer automatiquement la génération. |
| Échec de génération | Assistant | **[ASSUMPTION]** Expliquer que la réponse n’a pas pu être produite et permettre une nouvelle tentative. |
| Erreur de chargement | Toute liste concernée | Expliquer quelle donnée n’a pas pu être chargée et proposer de réessayer. **[ASSUMPTION]** |
| Accès refusé | Ressource ou action protégée | **[ASSUMPTION]** Ne pas révéler le contenu ; indiquer que l’action n’est pas autorisée et ramener vers une surface accessible. |
| Confirmation de suppression | Ressource ou historique | Nommer l’élément concerné et proposer explicitement de confirmer ou d’annuler. La suppression d’une ressource retire aussi son contenu des listes, recherches et vecteurs. |
| Historique disponible | Historique | Présenter les recherches et conversations conservées, que la personne peut rouvrir dans la limite de conservation de 30 jours. **[ASSUMPTION]** Distinguer visuellement les recherches des conversations et afficher leur date. |
| Historique vide | Historique | **[ASSUMPTION]** Indiquer qu’aucune recherche ou conversation n’est encore enregistrée et distinguer cet état d’une erreur de chargement. |
| Élément d’historique expiré ou indisponible | Historique ou conversation | **[ASSUMPTION]** Si une entrée de plus de 30 jours ou une conversation devenue indisponible est ouverte directement, expliquer qu’elle ne peut plus être consultée et permettre de revenir à l’historique. |
| Source d’une ancienne conversation indisponible | Conversation historique | **[ASSUMPTION]** Garder la réponse enregistrée visible et signaler qu’une source ne peut plus être ouverte, sans prétendre qu’elle est encore disponible. |
| Focus clavier | Tous les contrôles | Afficher le Contour de focus défini dans [DESIGN.md](./DESIGN.md) avec `{colors.focus}`. **[ASSUMPTION]** Le focus suit l’ordre de lecture. |

## Interaction Primitives

- Les boutons ont des libellés qui décrivent leur action : « Enregistrer », « Ouvrir la ressource », « Supprimer ».
- Les liens de source ouvrent ou identifient la ressource citée par l’assistant.
- Une action qui supprime des données demande une confirmation avant exécution.
- Les erreurs sont affichées près de la zone concernée et expliquées en termes simples. **[ASSUMPTION]**
- **[ASSUMPTION]** Les transitions restent discrètes et respectent le réglage de réduction des animations du système.
- Aucun raccourci clavier, commande IA ou outil de rédaction supplémentaire n’est prévu dans la première version du produit (MVP).

## Accessibility Floor

- Toutes les actions essentielles sont accessibles au clavier, et l’ordre de tabulation suit l’ordre de lecture. **[ASSUMPTION]**
- **[ASSUMPTION]** Chaque champ dispose d’un libellé visible et d’une indication textuelle en cas d’erreur.
- Le focus clavier est visible avec le Contour de focus défini dans [DESIGN.md](./DESIGN.md). **[ASSUMPTION]** Son ordre suit l’ordre de lecture.
- Les boutons, liens, filtres et états ont un nom et un rôle compréhensibles par les lecteurs d’écran. **[ASSUMPTION]**
- Les informations ne reposent pas uniquement sur les couleurs : catégories, erreurs, succès, chargement et sélection ont aussi des libellés ou signes textuels.
- Le contraste de texte vise au minimum WCAG 2.2 AA. **[ASSUMPTION]** Les textes peuvent être agrandis sans masquer les commandes essentielles.
- Les zones tactiles sont suffisamment grandes pour une activation confortable sur mobile.

## Responsive & Platform

Le produit reste une application web : les petits écrans ne deviennent pas un parcours mobile natif.

| Format | Comportement |
|---|---|
| Ordinateur | **[ASSUMPTION]** Navigation persistante et listes avec suffisamment d’espace pour les métadonnées et les extraits. |
| Mobile | Contenu en une colonne ; les formulaires et conversations utilisent la largeur disponible sans défilement horizontal. |
| Clavier et tactile | Les mêmes fonctions restent accessibles au clavier et au toucher ; aucune action n’est disponible uniquement au survol. |

## Key Flows

### Flow 1 — UJ-1 « Camille retrouve une procédure » (FR-6)

1. Camille se connecte et arrive au tableau de bord.
2. Elle ouvre la recherche et saisit quelques mots liés à sa question.
3. Elle compare les titres et les extraits des ressources retournées.
4. Elle ouvre la ressource qui semble pertinente et lit son contenu.
5. Si aucun résultat n’apparaît, elle modifie sa recherche.
6. **Résultat clé :** Camille ouvre la bonne procédure et peut lire l’information recherchée dans la ressource elle-même.

**En cas de difficulté [ASSUMPTION] :** si la recherche échoue techniquement, l’application conserve sa requête et propose de réessayer ; Camille peut ensuite ouvrir un résultat ou modifier les termes.

### Flow 2 — UJ-2 « Malik partage une ressource » (FR-3, FR-5)

1. Malik ouvre les ressources et choisit l’action d’ajout.
2. Il saisit un titre, colle ou écrit le texte et choisit une catégorie obligatoire.
3. Si un champ requis manque, l’interface lui indique lequel. **[ASSUMPTION]**
4. Il enregistre la ressource.
5. **[ASSUMPTION]** L’interface indique que la ressource est en cours d’indexation, puis signale qu’elle est disponible ou qu’une erreur doit être traitée.
6. **Résultat clé :** la ressource enregistrée apparaît dans l’espace partagé et pourra être retrouvée par la recherche.

**En cas de difficulté [ASSUMPTION] :** si un champ requis manque, Malik le complète sans ressaisir les autres. Si l’indexation échoue, l’interface explique que la ressource n’est pas encore recherchable et propose de relancer l’indexation.

**[ASSUMPTION]** Le parcours de saisie décrit ici suppose des contenus textuels uniquement ; la restriction aux textes et l’exclusion des fichiers sont des hypothèses indiquées dans le PRD.

### Flow 3 — UJ-3 « Lina pose une question métier » (FR-7)

1. Lina crée un compte membre ou se connecte, puis ouvre l’assistant.
2. Elle pose une question en langage courant sur le travail de l’équipe.
3. L’assistant recherche des passages dans les ressources disponibles. **[ASSUMPTION]** L’interface indique qu’une réponse est en préparation.
4. Lina lit la réponse et consulte les sources affichées.
5. Si les ressources ne suffisent pas, l’assistant le dit au lieu d’inventer une réponse et propose à Lina de réessayer plus tard, sans relancer automatiquement la génération.
6. **Résultat clé :** Lina vérifie l’information en ouvrant la ressource citée, ou sait clairement qu’elle n’a pas été trouvée.

**En cas de difficulté [ASSUMPTION] :** si la génération échoue, l’application explique le problème et propose une nouvelle tentative en conservant la question.

### Flow 4 — UJ-4 « Hugo reprend une recherche » (FR-8, FR-9)

1. Hugo ouvre l’historique depuis la navigation.
2. Si aucune recherche ou conversation n’est enregistrée, l’historique l’indique ; sinon, Hugo retrouve ses éléments récents et ouvre une recherche ou une conversation conservée depuis moins de 30 jours. **[ASSUMPTION]** Les éléments sont distingués par type et date.
3. Pour une conversation, il relit les messages enregistrés et peut ouvrir les sources encore disponibles.
4. Il saisit une nouvelle question dans la conversation rouverte et poursuit l’échange ; la nouvelle question et la réponse rejoignent cette conversation.
5. Pour une recherche, il relit sa requête. **[ASSUMPTION]** Une recherche rouverte affiche les résultats correspondant aux ressources disponibles au moment de la réouverture.
6. Si une conversation ou une source n’est plus disponible, l’application le signale clairement et Hugo peut revenir à l’historique. **[ASSUMPTION]**
7. Hugo peut supprimer l’une de ses recherches ou conversations. Avant la suppression, l’application nomme l’élément et lui demande de confirmer ou d’annuler ; seule la confirmation supprime l’élément de son historique.
8. **Résultat clé :** Hugo reprend une conversation en posant une nouvelle question, retrouve une recherche passée, ou supprime un élément qu’il ne souhaite plus conserver.

**En cas de difficulté [ASSUMPTION] :** si l’historique ne peut pas être chargé, l’application le signale et lui permet de réessayer sans présenter une liste vide comme si elle était complète.

### Flow 5 — Gérer une catégorie (responsable, FR-4)

1. Le responsable ouvre les ressources et accède à leur gestion des catégories.
2. Il crée une nouvelle catégorie ou renomme une catégorie existante.
3. Les catégories disponibles sont proposées lors de la création ou modification d’une ressource.
4. **Résultat clé :** le responsable peut classer une ressource dans la catégorie choisie par l’équipe.

**En cas de difficulté [ASSUMPTION] :** si la liste des catégories ou l’enregistrement échoue, l’interface explique l’échec et permet au responsable de réessayer sans effacer sa saisie.

L’accès à la gestion des catégories est placé dans l’écran Ressources ; le responsable peut y créer ou renommer les catégories.

### Flow 6 — Consulter et gérer une ressource (membre ou responsable, FR-3, FR-4, FR-9)

1. Un membre ou un responsable ouvre la liste des ressources partagées et sélectionne une ressource à laquelle il a accès.
2. Il consulte son contenu, sa catégorie et sa date de mise à jour.
3. Si la ressource appartient au membre, celui-ci peut la modifier ou la supprimer ; le responsable peut modifier ou supprimer toute ressource. Un membre ne dispose pas de ces actions sur la ressource d’un autre membre.
4. Pour modifier une ressource autorisée, la personne met à jour son titre, son texte ou sa catégorie, puis enregistre ; la ressource réouverte présente les changements.
5. Pour supprimer une ressource autorisée, la personne choisit « Supprimer ». L’application nomme la ressource et demande une confirmation ; une annulation la conserve, tandis qu’une confirmation la retire des listes, des recherches et de l’index vectoriel.
6. **Résultat clé :** la personne consulte la ressource partagée et ne peut modifier ou supprimer que les ressources permises par son rôle et sa propriété.

## Hypothèses UX à confirmer

- **[ASSUMPTION]** Surface : application web adaptative, sans applications mobiles natives.
- **[ASSUMPTION]** Contenus : textes saisis ou collés uniquement, sans fichiers ; cette restriction est une hypothèse héritée du PRD.
- **[ASSUMPTION]** Comportements de reprise après erreur autres que la proposition de réessayer plus tard lorsque le contexte est insuffisant.
- **[ASSUMPTION]** Règles d’accessibilité comportementales détaillées décrites dans Accessibility Floor.
- **[ASSUMPTION]** Confirmation avant suppression d’un élément d’historique et traitement d’un historique vide.
