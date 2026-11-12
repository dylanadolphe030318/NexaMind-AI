# Correction de trajectoire — refonte visuelle globale

**Projet :** NexaMind AI  
**Date :** 2026-11-11  
**Identifiant :** CC-2026-11-11-UI  
**Mode :** proposition groupee  
**Etat :** realisee et validee par Dylan le 2026-11-12, correctif `Date.now()` inclus.

**Qualification finale (2026-11-12) :** Dylan precise qu'il s'agit simplement
d'une correction de trajectoire, pas d'un nouveau sprint. La proposition
historique de « sprint 10 UI » ci-dessous est remplacee sur ce point :
les trois lots et leurs noms UI10 sont conserves pour la tracabilite, mais
le plan reste a neuf sprints. Cette validation ne cloture pas le sprint IA 9
et ne constitue pas un resultat de campagne IA ou de test SQL RLS.

Cette proposition est distincte de
[la correction A/B/C du meme jour](sprint-change-proposal-2026-11-11.md),
qui reste conservee sans modification.

## 1. Resume du changement

Dylan fournit une reference « Mobile E-Wallet — App Design UI KIT » et demande
d'en adapter l'esprit a toutes les pages de NexaMind AI, accueil et connexion
compris. Il confirme le fond blanc et les cartes mauve pale deja prevus, puis
demande une correction de trajectoire presentee en bloc avant developpement.

Ce changement est une nouvelle exigence visuelle, pas une panne du RAG.
Le livrable reste une interface originale de gestion des connaissances :
pas de reproduction des illustrations, logos, ecrans bancaires, graphiques,
donnees financieres ou fonctions de paiement de la reference.

### Direction proposee

- Fond general blanc `#FFFFFF`, sans fond lavande global.
- Cartes d'information mauve pale `#F3EDF8` ; formulaires et champs clairs.
- Violet plus profond pour la marque, les reperes et les actions principales.
- Degrade violet reserve au logo et aux boutons principaux, jamais derriere
  les longs contenus, les sources ou les messages d'etat.
- Cartes plus arrondies, bordures fines, ombres discretes et espaces plus aeres.
- Hierarchie nette : titre, explication, action principale, contenu et sources.
- Le site reste adaptatif, sans cadre de telephone artificiel sur ordinateur.
- Les labels francais, actions, destinations, permissions et parcours existants
  restent disponibles ; aucune nouvelle fonctionnalite n'est incluse.

## 2. Analyse d'impact

### Etat de depart verifie

- Les cinq stories du sprint IA 9 sont en revue, pas terminees :
  4.14, 4.15, 4.16, S8-2 et S8-3.
- La correction de references libres de 4.14 est commitee dans `0c35f35`.
- Les tests humains, la campagne qualite 4.16 et le SQL RLS isole restent ouverts.
- [Le plan](plan-sprints.NexMind%20AImd.md) impose 3 a 5 stories par sprint,
  complements et corrections planifiees compris ; le sprint 9 est deja complet.
- [DESIGN](ux-designs/ux-projet-ia-2026-10-28/DESIGN.md) contient encore un fond
  de token `#FFFAFC`, alors que son ajout sprint 9 et le code utilisent le blanc.
  Il prevoit aussi un violet plus doux et limite davantage les ombres.
- [Le tableau de bord](../../src/app/dashboard/page.tsx) reutilise actuellement
  une carte d'authentification ; les pages utilisent des styles communs dans
  [globals.css](../../src/app/globals.css). Une modification globale peut donc
  affecter des formulaires ou des confirmations au-dela des seules listes.

### Epics et stories

| Zone | Impact | Ce qui ne change pas |
|---|---|---|
| Epic 1 : acces et espace membre | Accueil, inscription, connexion, tableau de bord et presentation de la navigation | Sessions, redirections, role lu au serveur, deconnexion |
| Epic 2 : ressources | Listes, details, formulaires, confirmations et categories | Texte seulement, categorie obligatoire, droits d'ecriture |
| Epic 3 : recherche | Resultats, historique et confirmation de suppression | Requetes, filtres, classement, relance et autorisations |
| Epic 4 : assistant | Formulaire, reponses, sources, listes et conversations rouvertes | Citations, abstention, budgets, quotas et historique prive |

Aucun epic n'est obsolete, ajoute ou supprime. Aucun travail termine n'est
rouvert. S8-2/S8-3 gardent leurs identifiants et leur historique de livraison :
la refonte les prolonge, elle ne les remplace pas et ne vaut pas acceptation.

### Artefacts

- **PRD :** pas de nouvelle exigence fonctionnelle ni changement des scores
  SM-3/SM-4. Preciser en section 6 la coherence visuelle de toutes les pages,
  avec conservation des contraintes clavier, mobile et lisibilite.
- **Epics :** actualiser UX-DR1 et rattacher les trois complements UI ci-dessous
  aux epics existants, sans changer les criteres metier des anciennes stories.
- **Architecture :** AD-1 a AD-7 restent inchanges. Ajouter seulement une
  convention de presentation partagee ; pas de nouvelle bibliotheque UI,
  dependance externe, appel IA, schema, migration ou variable d'environnement.
- **UX :** actualiser les tokens, formes, elevations et composants dans DESIGN ;
  preciser dans EXPERIENCE que l'apparence change sans modifier les parcours.
- **Plan/suivi :** proposer un sprint 10 UI de trois stories ; ne pas ajouter
  une sixieme story ni une correction planifiee deguisee au sprint 9.
- **Tests :** conserver les tests de comportement et ajuster seulement les
  attentes visuelles effectivement remplacees par la proposition approuvee.
  Les questions IA et leur notation restent inchangees.
- **Infrastructure/deploiement :** aucun changement necessaire identifie.

## 3. Approche recommandee

**Ajustement direct : sprint 10 UI transversal, trois stories, une seule
direction visuelle appliquee a toutes les pages.**

Il ne s'agit pas de faire valider une page prototype puis de decider des autres :
les trois stories forment des lots de realisation pour couvrir tout le perimetre.
Un commit par story, controles automatiques a chaque lot, puis evaluation humaine
globale. Chaque story reste en revue jusqu'a validation de Dylan.

Si cette proposition est approuvee pour implementation, le lot UI peut etre
realise avant les essais humains differes du sprint IA 9. Cela ne cloture ni
ce sprint ni l'epic IA ; les preuves restantes devront etre produites sur la
version finale de l'interface et les seuils IA restent identiques.

| Option | Effort / risque | Decision proposee |
|---|---|---|
| Ajuster la presentation existante | Effort moyen, risque moyen de regressions CSS transversales | Recommande ; tests et inventaire de routes obligatoires |
| Revenir sur les stories IA livrees | Effort et risque inutiles ; ne resout pas la demande visuelle | Ecarte |
| Reduire/redefinir le MVP | Aucun objectif fonctionnel devenu impossible | Non necessaire |

Impact calendrier : un lot UI supplementaire, pas une livraison deja incluse
dans les cinq stories IA. Pas d'estimation horaire fiable a ce stade.

## 4. Modifications proposees — avant / apres

### A. Identite visuelle — DESIGN

**Avant :** violet `#653A91`, fond de token `#FFFAFC`, rayons 6/10/16 px ;
ombres principalement reservees aux superpositions ; boutons unis.

**Apres propose :**

| Element | Valeur / regle |
|---|---|
| Fond global | `#FFFFFF` sur toutes les pages |
| Surface d'information | `#F3EDF8` pour les cartes de contenu |
| Surface de saisie | Blanc, texte sombre, bordure visible |
| Violet principal | `#5B21B6` |
| Violet profond | `#3B0764` |
| Bouton principal | Degrade `#5B21B6` vers `#6D28D9`, texte blanc |
| Texte courant | `#252032` |
| Texte secondaire sur cartes | `#6E6878` |
| Focus | Contour sombre visible, detache du bouton et du fond |
| Rayons | Champs 12 px, boutons 14 px, cartes 20 px |
| Ombres | Legeres, non indispensables pour distinguer un controle |
| Typographie | Police systeme existante, texte courant au moins 16 px |
| Espacement | Echelle existante de 4 px, zones tactiles confortables |

Ces couleurs sont des cibles a mesurer, pas des contrastes declares valides
sans test : au moins 4,5:1 pour texte normal, 3:1 pour grand texte, controles
concernes et focus. Verifier aussi les etats survol, desactive et erreur.
Pour les degrades, verifier les combinaisons sur toute la plage du fond.
Les liens dans les contenus et sources restent soulignes.

**Justification :** retrouver la profondeur violette et les formes de la
reference tout en respectant le fond blanc et les cartes mauves demandes.

### B. Parcours — EXPERIENCE

**Avant :** composants simples avec presentation existante ; adaptation mobile
et navigation deja decrites dans les parcours.

**Apres propose :** conserver les memes liens, actions, labels, validations et
confirmations ; harmoniser leur presentation et leur emplacement lisible.
La page courante reste identifiable autrement que par la couleur.
Les menus de categories restent natifs ; pas de remplacement par un composant
personnalise qui changerait leur comportement.

Les erreurs, succes, absences, sources indisponibles et etats d'indexation
conservent leurs textes et codes visuels distincts. Les questions historiques
ne prennent pas le style des reponses. Les actions destructives gardent leur
confirmation et ne deviennent pas des boutons primaires violets ordinaires.

### C. PRD et epics

**Avant :** compatibilite/accessibilite en PRD section 6, identite generique
violet/rose dans UX-DR1.

**Apres propose :** ajouter la coherence visuelle de l'ensemble des routes,
fond blanc et cartes mauves, reference a DESIGN pour les valeurs exactes.
Conserver le rose seulement comme accent secondaire si utile, sans l'imposer
a tous les composants. Les exigences fonctionnelles FR1 a FR10 sont inchangees.

### D. Plan — nouveau sprint 10 UI propose

**Avant :** neuf sprints ; sprint 9 de cinq stories, en attente d'evaluation.

**Apres propose :** ajouter un dixieme sprint non IA, trois complements
transversaux. Les autres sprints et leurs nombres de stories restent inchanges.

#### UI10-1 — Harmoniser le socle, l'accueil et l'acces

**Permet de faire :** retrouver la meme identite des le premier ecran et dans
les reperes communs de l'application.

- Fichiers cibles : `src/app/globals.css`, `src/app/layout.tsx`,
  `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`,
  `src/app/dashboard/page.tsx` et composants d'acces existants associes.
- Extraire un composant de presentation partage seulement si une duplication
  reelle le justifie ; ne pas transformer le layout racine en barriere de session.
- Etant donne accueil, connexion, inscription ou tableau de bord, quand la page
  s'affiche, alors elle utilise la nouvelle identite sur fond blanc, sans masquer
  de texte, de champ, de role ou d'action existante.
- Etant donne un visiteur, quand il ouvre une page protegee, alors les protections
  existantes restent actives ; les pages publiques restent accessibles.
- Etant donne une saisie invalide ou un envoi en cours, quand le formulaire
  s'affiche, alors le message et l'etat des controles restent visibles.

#### UI10-2 — Harmoniser les ressources, categories et recherches

**Permet de faire :** lire et gerer les connaissances dans des ecrans coherents
avec l'accueil, sans perdre les filtres ou les actions autorisees.

- Routes : `/resources`, `/resources/new`, `/resources/[id]`,
  `/resources/[id]/edit`, `/resources/[id]/delete`, `/categories`,
  `/resources/search`, `/resources/searches`,
  `/resources/searches/[id]/delete`.
- Fichiers : pages correspondantes sous `src/app`, composants de presentation
  sous `src/features/resources` et styles partages, sans changer les services.
- Etant donne une liste, un resultat ou un detail, quand le contenu est disponible,
  alors titre, metadonnees, texte/extrait et liens restent lisibles dans les
  nouvelles cartes mauves.
- Etant donne un filtre de categorie actif, quand la page est rechargee ou
  « Toutes les categories » est choisi, alors le comportement actuel est conserve.
- Etant donne membre et responsable, quand les actions sont presentees,
  alors les permissions et confirmations actuelles sont conservees.
- Etant donne vide, erreur, preparation ou echec d'indexation, quand cet etat
  survient, alors il reste distinct et ne prend pas l'apparence d'un succes.

#### UI10-3 — Harmoniser l'assistant et verifier l'ensemble

**Permet de faire :** poser des questions et relire ses echanges dans le nouveau
style, avec des preuves toujours faciles a ouvrir.

- Routes : `/assistant`, `/assistant/conversations`,
  `/assistant/conversations/[id]`, suppression integree et etat de chargement.
- Fichiers : pages correspondantes, `assistant-form.tsx`,
  `assistant-answer.tsx`, composants de presentation des conversations et tests.
- Etant donne une reponse nouvelle ou rouverte, quand elle est affichee,
  alors chaque lien de source et sa numerotation restent identiques ; les
  questions, reponses et sources sont visuellement distinctes.
- Etant donne une abstention, une source indisponible, une erreur ou un quota,
  quand cet etat est affiche, alors son texte et les actions existantes restent
  disponibles, sans nouvel appel automatique.
- Etant donne l'une des seize pages inventoriees et les etats disponibles,
  quand l'ecran est utilise a 320/375/1280 px ou au zoom 200 %, alors aucun
  contenu ni controle essentiel n'est masque ou ne deborde horizontalement.
- Etant donne une navigation au clavier, quand les controles sont parcourus,
  alors focus, labels, ordre et actions restent utilisables.

Dependances : UI10-2 et UI10-3 reutilisent UI10-1 ; realisation dans l'ordre
UI10-1, UI10-2, UI10-3 pour limiter les conflits sur les styles.
UI10-3 inclut la verification visuelle transversale, pas une fonctionnalite
d'evaluation ni la cloture de la campagne qualite IA.

### E. Architecture et verification

**Avant :** presentation partagee dans les styles globaux et composants ;
appels et donnees sensibles au serveur.

**Apres propose :** ajouter a la convention de presentation l'usage des tokens
et de classes ciblees, sans recoloration aveugle de tous les blocs ni ajout de
`use client` aux pages serveur pour une raison purement decorative.

Verification de chaque lot :

1. Tests existants couvrant les composants modifies, TypeScript et lint.
2. Tests des contrastes et du rendu : liens, labels, etats et boutons.
3. Build de production apres integration de l'ensemble.
4. Navigateur sur les vraies routes publiques et authentifiees avec roles
   membre/responsable ; ne pas remplacer ce controle par un gabarit injecte.
5. Si les sessions de test manquent, signaler precisement les routes non
   verifiees et ne pas annoncer une validation complete.
6. Tests de non-regression de l'assistant et des deux selections de recherche,
   sans modifier budgets, prompts, quotas, SQL ou classement.
7. Aucun appel IA reel ni changement des donnees requis pour la seule refonte.
   Une reprise de recherche ou un envoi peut appeler l'IA : ne pas les lancer
   dans le navigateur sans autorisation et corpus fictif/autorise.

## 5. Transmission pour implementation

**Classification : moderee**, car la presentation touche tous les epics et
necessite l'ajout d'un lot de trois stories, mais pas de nouvelle architecture.

- **Pilotage produit / suivi :** apres approbation, actualiser plan, epics,
  PRD, DESIGN, EXPERIENCE et convention de presentation ; preparer les trois
  fiches UI avec inventaire des routes et criteres ci-dessus.
- **Developpement :** appliquer la direction a toutes les pages dans l'ordre
  des trois lots, sans phase prototype limitee a un seul ecran ; un commit
  par story et aucune cloture automatique.
- **Dylan :** approuver la proposition, puis evaluer le rendu global et les
  parcours. Les essais IA 9 et la preuve RLS restent suivis separement.
- Pas de push, migration, changement de role ou nettoyage de donnees inclus.

**Signal de reussite :** toutes les pages partagent le style violet demande,
fond blanc et cartes mauves, et les fonctions existantes restent accessibles
au clavier, au toucher et avec les permissions actuelles.

## 6. Checklist et decisions en attente

| Items | Etat | Conclusion |
|---|---|---|
| 1.1 | [x] | Declencheur visuel apres S8-3, sans defaut IA invoque |
| 1.2-1.3 | [x] | Nouvelle exigence, reference fournie et choix de Dylan |
| 2.1-2.5 | [x] | Quatre epics concernes, aucun supprime, sprint UI distinct propose |
| 3.1 | [x] | MVP et criteres metier inchanges, precision visuelle PRD proposee |
| 3.2 | [x] | Architecture preservee, convention de presentation seule |
| 3.3 | [x] | Tokens, composants, parcours et accessibilite analyses |
| 3.4 | [x] | Tests/doc impactes, infrastructure et CI/CD sans changement prevu |
| 4.1 | [x] | Ajustement direct retenu comme recommandation |
| 4.2 | [N/A] | Retour arriere non justifie |
| 4.3 | [N/A] | Reduction du MVP non necessaire |
| 4.4 | [x] | Lot UI de trois stories, risque CSS explicite |
| 5.1-5.5 | [x] | Proposition avant/apres, dependances et transmission documentees |
| 6.1-6.2 | [x] | Proposition relue, seize pages couvertes, pas de sixieme story IA |
| 6.3 | [x] | Dylan : « Oui, approuver et lancer la mise en œuvre » |
| 6.4 | [x] | Plan et suivi mis a jour apres approbation, sprint 9 conserve |
| 6.5 | [x] | Developpement des trois lots autorise ; evaluation humaine finale |

La preparation initiale n'avait modifie que cette proposition. Apres approbation,
la transmission au developpement est effective : documents et fiches du sprint
10 sont actualises, puis les trois lots seront livres en revue sans statut done.
