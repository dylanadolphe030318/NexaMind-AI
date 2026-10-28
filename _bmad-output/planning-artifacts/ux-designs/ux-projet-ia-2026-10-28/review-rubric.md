# Spine Pair Review — projet-IA

## Overall verdict
**Verdict global : adequate.** Les deux documents forment une base lisible et cohérente, leurs sources et références de tokens se résolvent, et les parcours du MVP sont représentés. Avant d’en faire un contrat fiable pour les consommateurs en aval, il faut compléter la couverture visuelle et comportementale des composants, rendre traçables les UJ du PRD, et préciser les états et chemins d’échec manquants.

## 1. Flow coverage — adequate
Les quatre UJ du PRD (§3) sont représentés par les flows 1 à 4 ; le flow 5 couvre la gestion des catégories. Chaque flow a un protagoniste, des étapes numérotées et un climax. Le flow 1 couvre l’absence de résultats et les State Patterns documentent certains échecs, mais les chemins d’échec ne sont pas suivis dans les flows là où ils comptent pour l’utilisateur.
### Findings
- **[medium]** Les flows 2 à 5 ne décrivent pas de chemin d’échec ou de récupération là où il est applicable : échec/reprise d’indexation (flow 2), échec de génération et nouvelle tentative (flow 3), erreur à l’ouverture de l’historique (flow 4) et échec d’une opération de catégorie (flow 5). Les états correspondants ne remplacent pas le parcours de récupération dans les flows. (EXPERIENCE.md, Key Flows 2–5 ; State Patterns). *Fix:* Ajouter les branches de récupération applicables, en indiquant le retour à l’état du flow et l’action disponible.*

## 2. Token completeness — adequate
Les tokens du frontmatter de DESIGN.md sont conformes aux types du spec ; toutes les valeurs couleur sont hexadécimales. Toutes les références `{...}` du prose et des tokens de composants se résolvent. Un thème sombre n’est pas requis par les sources ; aucun couple clair/sombre n’est donc manquant. Les couleurs en usage sont lisibles, mais les objectifs de contraste ne sont pas explicités pour les combinaisons porteuses.
### Findings
- **[medium]** Le document demande un contraste élevé sans fixer de cible mesurable pour les combinaisons texte/fond, bouton/texte et focus/surface ; EXPERIENCE.md mentionne WCAG 2.2 AA de façon générale, sans lier les paires de tokens concernées. (DESIGN.md, Colors ; EXPERIENCE.md, Accessibility Floor). *Fix:* Énoncer les seuils de contraste à respecter pour les combinaisons porteuses et les associer aux tokens concernés.*

## 3. Component coverage — thin
Les comportements majeurs sont décrits dans EXPERIENCE.md, mais les deux spines ne forment pas encore un catalogue composant par composant : plusieurs éléments de l’expérience n’ont pas de spécification visuelle et plusieurs composants visuels n’ont pas de règle comportementale correspondante.
### Findings
- **[high]** Il manque une ligne visuelle dans DESIGN.md.Components pour la navigation, le formulaire de ressource, le sélecteur de catégorie, le résultat de recherche, la réponse de l’assistant et les confirmations de suppression. Inversement, les boutons principal/secondaire, l’input, la carte de ressource et le lien de source n’ont pas de lignes comportementales correspondantes dans EXPERIENCE.md.Component Patterns. « Carte / ligne de ressource » ne clarifie pas non plus si la ligne est la même variante visuelle que `resource-card`. (DESIGN.md, Components ; EXPERIENCE.md, Component Patterns). *Fix:* Employer des noms canoniques identiques dans les deux tables, ajouter les spécifications manquantes et couvrir explicitement les variantes carte/ligne.*

## 4. State coverage — thin
Les états de chargement, vide, validation, indexation, réponse insuffisante, génération et suppression sont couverts pour plusieurs surfaces. L’absence d’état hors ligne est cohérente avec l’exclusion du fonctionnement hors ligne dans le PRD. En revanche, la couverture n’est pas systématique pour les surfaces de l’IA, de l’authentification, des détails et des catégories ; le focus clavier et les accès refusés méritent une règle explicite.
### Findings
- **[medium]** Des états utiles manquent ou restent trop génériques : erreur d’authentification/validation au compte, chargement/erreur/ressource introuvable au détail, chargement/erreur à la recherche et aux catégories, et état de focus clavier visible sur les contrôles interactifs. L’état d’accès refusé n’est pas défini pour une route ou une action interdite, alors que le PRD FR-9 impose des permissions par rôle. (EXPERIENCE.md, Information Architecture, State Patterns, Accessibility Floor ; PRD §5.1 FR-1 et §5.5 FR-9). *Fix:* Ajouter les états applicables par surface, préciser le comportement d’accès refusé et documenter le focus clavier, ou indiquer pourquoi un état n’est pas nécessaire.*

## 5. Visual reference coverage — strong
L’inventaire du workspace ne contient aucun fichier dans `mockups/` ou `wireframes/`, et le dossier `imports/` est vide. Il n’y a donc ni référence visuelle orpheline ni référence de composition à lier ; EXPERIENCE.md renvoie correctement à DESIGN.md pour les règles visuelles.

## 6. Bloat & overspecification — adequate
Les sections sont orientées vers des décisions utilisables par les équipes aval ; aucun détail pixelisé ne double les tokens et aucun récit décoratif ne détourne de la spécification. Certains faits de rôle et de périmètre reprennent le PRD, ce qui aide à contextualiser les comportements. La liste finale des hypothèses reprend toutefois plusieurs hypothèses déjà formulées dans les sections précédentes.
### Findings
- **[low]** « Hypothèses UX à confirmer » récapitule des hypothèses déjà présentes dans Foundation, Responsive & Platform, Accessibility Floor et DESIGN.md. (EXPERIENCE.md, Hypothèses UX à confirmer). *Fix:* Garder cette liste comme index de décisions ouvertes en supprimant les répétitions, ou la retirer si elle n’est pas destinée au suivi.*

## 7. Inheritance discipline — thin
Les `sources` des deux frontmatters pointent vers le même PRD et le chemin relatif se résout. Les termes des UJ et le glossaire ne sont cependant pas repris de façon suffisamment traçable et identique entre les sources et les spines.
### Findings
- **[medium]** Les titres des Key Flows paraphrasent les UJ du PRD et n’en reprennent ni les identifiants `UJ-1` à `UJ-4` ni les intitulés verbatim ; les flows ne donnent pas non plus d’identifiants FR pour les exigences qu’ils couvrent. (PRD §3 ; EXPERIENCE.md, Key Flows). *Fix:* Annoter les flows avec les identifiants et noms exacts des UJ/FR sources, sans remplacer les titres narratifs.*
- **[medium]** Le PRD §4 définit un glossaire (espace de travail, ressource, catégorie, index/base vectoriels, recherche sémantique, RAG, source, membre, responsable), mais aucun glossaire correspondant n’apparaît dans DESIGN.md ou EXPERIENCE.md. La terminologie n’est donc pas vérifiable comme identique à travers les trois documents. (PRD §4 ; DESIGN.md ; EXPERIENCE.md). *Fix:* Ajouter un glossaire partagé, identique dans les deux spines et aligné mot pour mot sur les définitions du PRD, ou retirer de la portée les termes non utilisés par les spines.*

## 8. Shape fit — strong
DESIGN.md suit l’ordre canonique des sections, de Brand & Style à Do's and Don'ts. EXPERIENCE.md contient tous les défauts requis : Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor et Key Flows. Responsive & Platform est présent pour le produit desktop/mobile ; Inspiration n’est pas déclenché par les sources ou le memlog. Aucune section inventée ne nuit au contrat.

## Mechanical notes
- Les sources frontmatter de DESIGN.md et EXPERIENCE.md résolvent vers `_bmad-output/planning-artifacts/prds/prd-projet-ia-2026-10-27/prd.md`.
- Les tokens référencés dans DESIGN.md se résolvent ; aucun token d’EXPERIENCE.md n’est présenté comme référence de token.
- Le lien `./DESIGN.md` dans EXPERIENCE.md résout. Aucun diagramme Mermaid à valider.
- Incohérence de nommage à aligner : `resource-card` / « Carte de ressource » dans DESIGN.md et « Carte / ligne de ressource » dans EXPERIENCE.md ; les composants communs ne sont pas tous nommés dans les deux spines.
- Le workspace ne contient ni `mockups/` ni `wireframes/` ; `imports/` est vide.

## État des corrections

Les constats ci-dessus ont été traités dans les documents UX :

- Ajout de chemins de reprise dans les parcours concernés ; les détails non confirmés sont marqués `[ASSUMPTION]`.
- Ajout de seuils de contraste mesurables et de combinaisons de tokens dans `DESIGN.md`.
- Alignement des noms et des descriptions visuelles/comportementales des composants dans les deux documents.
- Ajout des états d’authentification, de détail, de recherche, de catégorie, d’accès et de focus clavier dans `EXPERIENCE.md`.
- Condensation de la liste des hypothèses en index, sans répéter toutes les explications.
- Ajout des identifiants UJ/FR et des intitulés exacts du PRD aux parcours.
- Conservation du glossaire du PRD dans `EXPERIENCE.md` et ajout d’un lien vers cette source de référence dans `DESIGN.md`.

Aucune nouvelle fonctionnalité produit n’a été ajoutée. Les comportements d’interface qui ne sont pas confirmés par le PRD restent marqués `[ASSUMPTION]`.
