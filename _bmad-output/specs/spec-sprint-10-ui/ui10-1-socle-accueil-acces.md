---
title: Harmoniser le socle, l'accueil et l'acces
story: ui10-1
type: feature
created: 2026-11-11
status: in-review
route: dispatch
baseline_commit: 0c35f351f09e175282eb82b398cb038893123fb9
context:
  - "{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/DESIGN.md"
---

<frozen-after-approval>

## Intent

Dylan approuve CC-2026-11-11-UI et sa realisation immediate sur toutes les pages,
en trois lots sans prototype intermediaire. Ce premier lot installe une identite
originale inspiree du violet profond et des formes arrondies de la reference.
Accueil, inscription, connexion et tableau de bord utilisent le nouveau socle.

## Boundaries & Constraints

- Fond global blanc, cartes d'information `#F3EDF8`, champs blancs ; violet
  `#5B21B6`, profond `#3B0764`, degrade d'action vers `#6D28D9`. Texte `#252032`,
  secondaire `#6E6878`. Rayons champs 12, boutons 14 et cartes 20 px.
- Hierarchie claire, surfaces aerees, ombres discretes. Ne pas copier le kit,
  ajouter d'illustration generee ou de fonctions bancaires.
- Garder textes et parcours, liens existants, permissions, validations,
  etats annonces, deconnexion et role lu serveur. Pas de nouvelle destination.
- Tous les services IA, secrets, RLS et mutations sont intouches. Pas de nouveau
  package, migration, acces distant, appel fournisseur ou donnees de test creees.
- Lire les guides Next locaux avant code. Ne pas ajouter `use client` pour du
  style. Pas de push, commit ni cloture par l'agent ; le pilote gere les commits.
- Les trois lots doivent finir en revue, jamais done sans evaluation humaine.

## I/O & Edge-Case Matrix

| Etat | Attendu |
|---|---|
| Accueil, login, signup | Meme identite, liens et champs conserves |
| Tableau de bord connecte | Identite, role et liens existants lisibles |
| Visiteur sur dashboard | Redirection existante conservee |
| Erreur/envoi en cours | Message, labels et boutons visibles |
| 320 px ou zoom 200 % | Contenu et actions sans debordement horizontal |
| Clavier / mouvement reduit | Focus sombre visible, animations reduites |

</frozen-after-approval>

## Code Map

- `src/app/globals.css` : tokens, `.button`, `.landing`, `.auth-page`,
  `.auth-card`, champs, etats et responsive existants. Modifier les regles en
  place, pas ajouter une seconde feuille de surcharges contradictoires.
- `src/app/page.tsx`, `login/page.tsx`, `signup/page.tsx` : marque dupliquee,
  pages serveur ; reutiliser un composant de marque si cela simplifie vraiment.
- `src/app/dashboard/page.tsx` : carte d'acces reutilisee pour l'espace membre.
  Differencier visuellement l'espace de travail, garder session et role.
- `tests/dashboard-assistant-navigation.test.mjs` : tests du lien exact et focus.
- `tests/s8-3-pale-cards.test.mjs` : tests des couleurs/cartes existants a conserver.
- `src/app/login/login-form.tsx`, `signup/signup-form.tsx` : ne pas changer actions.

## Tasks & Acceptance

- [x] Modifier le socle CSS avec des tokens coherents et contrats AA.
- [x] Harmoniser les quatre pages et la marque sans changer leur comportement.
- [x] Ajouter des tests de rendu/contrastes enregistrables dans le runner existant.
- Etant donne les quatre pages, quand elles sont affichees, alors fond blanc,
  hierarchie violette et actions lisibles suivent DESIGN.
- Etant donne les erreurs, le clavier et mobile, quand les composants sont
  utilises, alors aucun controle essentiel n'est masque.

## Verification

Tests unitaires pertinents, `npx tsc --noEmit`, lint des fichiers modifies.
Inspecter les vraies pages dans le navigateur si disponible, sans saisir
d'identifiants ni appeler l'IA. Rapporter honnetement les routes inaccessibles.
Le pilote fera la revue et les controles finaux avant commit.

## Implementation Notes

- Tokens de couleur, contrastes, rayons, surfaces et styles de focus mis a jour
  dans `src/app/globals.css`; l'espace membre est differencie sans toucher a
  l'authentification ni au role serveur.
- Ajout de tests de rendu, formulaires, responsive et contrastes dans le runner
  `test:unit`.
- Verifications executees: suite `npm run test:unit`, `npx tsc --noEmit`,
  ESLint des fichiers TypeScript/test modifies et `git diff --check`.
- Controle navigateur local des routes accueil, connexion et inscription:
  aucune largeur debordante a 320 px ou 1280 px; focus clavier sombre et
  mouvement reduit verifies. La route tableau de bord n'a pas ete ouverte dans
  le navigateur faute de session de test; son rendu connecte est teste avec une
  session simulee et sa redirection visiteur est testee sans acces distant.

## Review Triage Log

- Revue du pilote : le message d'echec de deconnexion utilisait une classe sans
  style. Il reutilise maintenant `auth-message auth-message-error`, avec test
  de rendu. Controle direct : 14 tests UI/navigation/cartes et TypeScript passent.
  Le navigateur confirme le rendu reel de connexion ; l'acces au dashboard sur
  127.0.0.1 redirige vers login, aucune session autorisee n'etant ouverte.

- **low → patch — Blind hunter :** le suivi de sprint restait `in-progress`
  alors que cette fiche passait en revue ; `sprint-status.yaml` indique maintenant
  `review`, conformément au cycle prévu.
- **maybe-false → defer (moyen, non vérifié) — Blind hunter :** la route dashboard
  n'a pas été vérifiée dans un navigateur avec session réelle ; une session
  simulée valide le rendu, mais l'accès authentifié membre/responsable reste à
  contrôler par le pilote avec une session autorisée.
- **false — Blind hunter :** la matrice de cette fiche demande 320 px ou un zoom
  de 200 % ; le contrôle navigateur à 320 px satisfait cette alternative.
- **low, rejeté — Blind hunter :** les assertions responsive seules ne simulent
  pas un moteur de mise en page, mais la vérification navigateur a mesuré les
  routes publiques à 320 et 1280 px ; ajouter un moteur de test CSS nécessiterait
  une dépendance interdite par la fiche.
- **medium → patch — Blind hunter :** les contrastes étaient calculés sur des
  couleurs littérales ; le test lit désormais les valeurs des tokens CSS et les
  compare aux ratios AA.
- **false — Blind hunter :** les extrémités du dégradé et le survol sont vérifiés ;
  les trois canaux augmentent vers son extrémité la plus claire, qui borne le
  contraste minimal avec le blanc.
- **false — Blind hunter :** la fiche n'impose pas 16 px à chaque libellé ; DESIGN
  fixe le corps à 16 px et les labels à 14 px, sans modifier cette hiérarchie.
- **low → patch — Blind hunter :** les tests vérifient maintenant l'association
  de chaque label aux champs réels par `for`/`id`.
- **medium → patch — Blind hunter :** la surface mauve des cartes d'accès n'était
  pas protégée contre une régression ; le test vérifie maintenant le fond de
  `.auth-card`.
- **medium → patch — Verification-gap :** remplacer le fond mauve de `.auth-card`
  par du blanc ne faisait pas échouer les tests ; l'assertion de sélecteur ajoutée
  échoue désormais sur ce changement.
