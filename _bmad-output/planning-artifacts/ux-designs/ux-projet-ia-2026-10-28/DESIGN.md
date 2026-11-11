---
name: NexaMind AI
description: Identité visuelle chaleureuse et lisible pour un copilote de connaissances partagé.
status: final
updated: 2026-10-28
sources:
  - ../../prds/prd-projet-ia-2026-10-27/prd.md
colors:
  primary: '#5B21B6'
  primary-foreground: '#FFFFFF'
  primary-hover: '#3B0764'
  accent: '#B83E6E'
  accent-foreground: '#FFFFFF'
  accent-soft: '#FCEBF2'
  background: '#FFFFFF'
  surface: '#FFFFFF'
  surface-soft: '#F3EDF8'
  text-primary: '#252032'
  text-secondary: '#6E6878'
  border: '#E8DDE9'
  focus: '#252032'
  error: '#B42318'
  success: '#24734B'
typography:
  display:
    fontFamily: 'system-ui, sans-serif'
    fontSize: 32px
    fontWeight: '650'
    lineHeight: '1.2'
  heading:
    fontFamily: 'system-ui, sans-serif'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: 'system-ui, sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.55'
  label:
    fontFamily: 'system-ui, sans-serif'
    fontSize: 14px
    fontWeight: '550'
    lineHeight: '1.4'
rounded:
  sm: 12px
  md: 14px
  lg: 20px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  gutter-mobile: 16px
  gutter-desktop: 24px
components:
  button-primary:
    background: 'linear-gradient(135deg, #5B21B6, #6D28D9)'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  button-secondary:
    background: '{colors.surface}'
    foreground: '{colors.primary}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  input:
    background: '{colors.surface}'
    foreground: '{colors.text-primary}'
    border: '{colors.border}'
    focus: '{colors.focus}'
    radius: '{rounded.sm}'
  resource-card:
    background: '#F3EDF8'
    foreground: '{colors.text-primary}'
    border: '{colors.border}'
    radius: '{rounded.lg}'
  source-link:
    foreground: '{colors.primary}'
    underline: true
---

# NexaMind AI — Identité visuelle

## Brand & Style

NexaMind AI doit évoquer une équipe accueillante et bien organisée : un endroit où l’on retrouve ses connaissances sans effort. Le violet porte les actions et repères principaux ; le rose apporte une touche chaleureuse, sans concurrencer le contenu. La lecture des ressources et des réponses reste prioritaire sur la décoration.

Le produit utilise une interface claire, avec des surfaces légèrement teintées, des composants simples et des transitions discrètes. Le présent document définit la direction visuelle retenue.

## Colors

- **Violet principal** (`{colors.primary}`) : actions principales, navigation active et liens vers les ressources. Garder un contraste élevé avec `{colors.primary-foreground}`.
- **Rose** (`{colors.accent}`) : accents ponctuels de marque et repères secondaires ; ne pas l’utiliser comme texte courant sur les fonds pâles ni seul pour signaler une erreur, une permission ou un état.
- **Rose doux** (`{colors.accent-soft}`) : fond léger pour une mise en évidence non critique, avec texte `{colors.text-primary}`.
- **Fond et surface** (`{colors.background}`, `{colors.surface}`, `{colors.surface-soft}`) : séparer les zones de travail sans ajouter de décoration inutile.
- **Texte** (`{colors.text-primary}`, `{colors.text-secondary}`) et **bordure** (`{colors.border}`) : préserver la lisibilité des contenus longs et des métadonnées.
- **États** (`{colors.error}`, `{colors.success}`) : accompagner la couleur d’un libellé et d’une explication ; ne jamais communiquer le sens par la couleur seule.

Les seuils WCAG 2.2 AA visés sont les suivants : contraste d’au moins 4,5:1 pour le texte courant, 3:1 pour les grands textes et 3:1 pour les contours visibles des contrôles et du focus. Les combinaisons prévues sont `{colors.text-primary}` sur `{colors.background}` ou `{colors.surface}`, `{colors.text-secondary}` sur ces mêmes fonds, `{colors.primary-foreground}` sur `{colors.primary}`, et `{colors.focus}` autour d’un contrôle sur `{colors.background}`. Le rose `{colors.accent}` est décoratif ou utilisé avec `{colors.accent-foreground}` sur un fond rose uni ; il ne remplace pas un libellé.

## Typography

Utiliser une police sans empattement système afin de privilégier la lisibilité et d’éviter une dépendance à une police externe. Les niveaux `display`, `heading`, `body` et `label` servent respectivement aux titres de page, titres de section, contenus et libellés. Le texte des ressources et des réponses doit pouvoir s’agrandir sans perte de contenu.

## Layout & Spacing

Utiliser l’échelle d’espacement en multiples de 4 px définie dans les tokens. Sur grand écran, conserver une zone de lecture confortable et une navigation persistante ; sur mobile, empiler les contenus en une colonne et préserver des marges tactiles.

## Elevation & Depth

Privilégier les fonds et bordures légères à une accumulation d’ombres. Depuis
CC-2026-11-11-UI, les cartes peuvent avoir une ombre discrète ; la bordure et le
fond suffisent toujours à les distinguer. Les ressources et sources restent
visuellement dominantes.

## Shapes

Les champs et boutons ont des angles légèrement arrondis ; les cartes et dialogues sont un peu plus arrondis. Les pastilles entièrement arrondies sont réservées aux petits libellés d’état, jamais aux longs paragraphes.

## Components

- **Navigation principale** — libellés lisibles, surface `{colors.surface}`, destination active indiquée par le violet et un signal non chromatique.
- **Bouton principal** — dégradé violet `#5B21B6` vers `#6D28D9`, texte `{colors.primary-foreground}`, rayon `{rounded.md}` ; le libellé d’action reste visible. Survol violet profond ; contraste vérifié sur toute la plage.
- **Bouton secondaire** — fond `{colors.surface}`, texte `{colors.primary}`, bordure `{colors.border}` et rayon `{rounded.md}`.
- **Formulaire de ressource** — champs sur `{colors.surface}`, texte `{colors.text-primary}`, bordures `{colors.border}` et focus `{colors.focus}` ; l’erreur utilise `{colors.error}` et un message textuel.
- **Sélecteur de catégorie** — apparence de champ, avec la catégorie choisie affichée en texte ; les catégories ne sont pas distinguées par couleur seule.
- **Carte de ressource** — dans la liste Ressources et les résultats de recherche, surface mauve pâle `#F3EDF8`, bordure `{colors.border}` et rayon `{rounded.md}` ; affiche titre, catégorie et date.
- **Ligne de ressource** — variante compacte de la carte, mêmes couleurs et informations essentielles, adaptée à une liste dense.
- **Résultat de recherche** — reprend la ligne de ressource, avec un extrait lisible et un lien d’ouverture en violet souligné.
- **Réponse de l’assistant** — surface `{colors.surface-soft}` ou `{colors.surface}`, texte `{colors.text-primary}` ; les sources sont séparées visuellement et restent lisibles.
- **Lien de source** — violet `{colors.primary}`, souligné, avec texte qui identifie la ressource.
- **Dialogue de confirmation** — surface `{colors.surface}`, texte `{colors.text-primary}`, bouton de confirmation et action d’annulation distincts ; l’action destructive n’est pas signalée par la couleur seule.
- **Indicateur d’état** — libellé lisible et texte `{colors.text-primary}` ou `{colors.text-secondary}` ; une couleur d’état ne porte jamais seule le sens.
- **Contour de focus** — contour visible `{colors.focus}` autour du contrôle actif, distinct de la bordure au repos.

### Cartes de ressources et de réponses — sprint 9

Les cartes de la liste Ressources et des résultats de recherche, ainsi que les
blocs de réponse et de sources de l’assistant (y compris les conversations
rouvertes), utilisent le mauve pâle `#F3EDF8` sur le fond blanc. Cette règle
reste ciblée à ces cartes et ne recolore ni les questions historiques, ni les
confirmations, ni les messages de succès, d’erreur ou d’absence de réponse.
Le texte courant reste en `#252032` ; les liens et le focus restent identifiables
par leur texte, soulignement ou contour visible, et les états conservent leur
libellé.

Les métadonnées des cartes mauves utilisent `#6E6878` : la couleur secondaire
globale `#716B7C` n'atteint pas 4,5:1 sur ce fond. Cette correction est limitée
aux métadonnées de ces cartes.

## Do's and Don'ts

| À faire | À éviter |
|---|---|
| Garder violet profond et rose secondaire au service de la lecture | Mettre des dégradés derrière les contenus longs ou copier des écrans bancaires |
| Afficher les catégories avec leur nom textuel | Distinguer les catégories uniquement par une couleur |
| Rendre les sources de réponse visibles et identifiables | Présenter une réponse IA sans moyen clair d’ouvrir sa source |
| Employer les couleurs d’état avec un libellé explicite | Signaler une erreur ou une réussite par la couleur seule |
| Laisser l’espace visuel aux ressources et aux réponses | Ajouter des éléments décoratifs ou des animations sans rôle fonctionnel |

Le glossaire partagé est conservé dans la section **Shared Glossary** d’[EXPERIENCE.md](./EXPERIENCE.md), pour garder une seule définition de référence.

## Extension globale approuvée — sprint UI 10

[CC-2026-11-11-UI](../../sprint-change-proposal-2026-11-11-refonte-visuelle.md)
applique cette identité à toutes les pages : accueil, accès, tableau de bord,
ressources, catégories, recherches et assistant avec leurs historiques,
formulaires, confirmations et états. Fond global blanc, cartes d'information
mauve pâle, champs blancs, formes plus arrondies et espaces aérés. Les dégradés
sont limités au logo et aux actions principales. Les confirmations destructives
gardent un traitement distinct ; erreur, succès et absence ne sont pas recolorés
en cartes de réponse. Police système et seuils AA conservés.
