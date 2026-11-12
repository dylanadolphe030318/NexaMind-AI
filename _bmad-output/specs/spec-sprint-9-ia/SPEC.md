---
id: SPEC-sprint-9-ia
companions:
  - conventions.md
  - ../../../tests-ia.md
  - ../../planning-artifacts/architecture/architecture-projet-ia-2026-10-28/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/EXPERIENCE.md
sources: []
---

# Sprint IA 9 — sources fiables et interface plus claire

## Cloture — 2026-11-12

Dylan valide globalement l'evaluation du sprint et demande sa cloture.
Les cinq fiches sont `done`, ainsi que l'epic IA ; aucun sprint IA suivant
n'est planifie. Les mentions de preparation et de travail futur ci-dessous
decrivent la specification initiale, pas l'etat actuel.
Le bilan humain, sans score chiffre invente, est consigne dans
[sprint-9-evaluation.md](../../implementation-artifacts/sprint-9-evaluation.md).

## Why

Le sprint termine les contrôles de fiabilité de l'assistant déjà opérationnel :
relier les faits aux preuves, exclure les données interdites et mesurer la qualité.
Deux améliorations visuelles déjà validées rendent les catégories et les cartes
plus faciles à distinguer. Cette préparation ne lance aucun développement.

## Capabilities

- **CAP-1 — 4.14**
  - **intent :** vérifier chaque affirmation de l'assistant grâce à sa source.
  - **success :** chaque fait présenté possède un renvoi identifiable vers une
    source qui le soutient et s'ouvre ; un fait sans preuve est retiré ou inconnu.
    S8-D donne explicitement le numéro 3.1 avec preuve actuelle, sinon abstention.
- **CAP-2 — 4.15**
  - **intent :** interroger l'assistant sans recevoir de données interdites.
  - **success :** une fixture réellement interdite reste absente du contexte
    envoyé au fournisseur, de la réponse et des références ; RLS est testée sous
    les sessions concernées, sans changer le partage du workspace.
- **CAP-3 — 4.16**
  - **intent :** évaluer l'assistant avec un protocole reproductible.
  - **success :** sur dix questions documentées, au moins huit réponses correctes
    citent une source attendue qui les appuie ; trois questions sans réponse
    entraînent trois abstentions. Les preuves Q1 et S8-D sont relevées séparément.
- **CAP-4 — S8-2**
  - **intent :** choisir les catégories dans deux menus déroulants clairs.
  - **success :** filtre Ressources et gestion Catégories fonctionnent au clavier
    et sur mobile, sans changer les permissions de création et de renommage.
- **CAP-5 — S8-3**
  - **intent :** distinguer les blocs d'information de la page blanche.
  - **success :** cartes demandées mauve pâle, contrastes AA mesurés, erreurs et
    succès distincts ; contenu et actions conservés sur mobile et à zoom 200 %.

## Constraints

- Cinq stories dans l'ordre 4.14, 4.15, 4.16, S8-2, S8-3 ; identifiants conservés.
- IA et embeddings côté serveur, OpenAI et pgvector Supabase existants ; session
  utilisateur et RLS, jamais de clé privilégiée pour interroger les ressources.
- Un espace partagé ; les ressources des autres membres y sont lisibles.
  Les historiques restent privés, même vis-à-vis du responsable.
- Les dix questions historiques restent inchangées. Le jeu qualité séparé,
  les préconditions et la preuve de non-divulgation figurent dans les compagnons.
- Pas de nouveau modèle, budget, seuil ou quota ; pas de reprise des corrections
  A et C déjà acceptées. Ne pas casser les sélections IA de la recherche.
- Préparation rapide sans nouvelle relecture préalable demandée par Dylan :
  `spec_checkpoint: false`, mais arrêt après chaque story pour son évaluation.

## Non-goals

- Développer, migrer, modifier les données ou lancer des appels IA maintenant.
- Ajouter un espace produit, des permissions privées par ressource, une interface
  d'évaluation, des ancres de passages ou de nouvelles stories.
- Réécrire les anciennes réponses ou certifier la vérité d'un fait par la seule
  présence d'un numéro de source ; fermer l'epic avant évaluation finale.

## Success signal

Après réalisation et évaluation, Dylan peut ouvrir la preuve de chaque fait,
constater l'absence de fuite, vérifier le seuil 8/10 et 3/3, puis utiliser les
deux sélecteurs et les cartes sans difficulté. Aujourd'hui, le résultat attendu
est uniquement cinq fiches `ready-for-dev` et leur protocole, sans story commencée.
