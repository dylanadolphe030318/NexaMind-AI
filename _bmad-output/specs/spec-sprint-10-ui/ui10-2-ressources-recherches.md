---
title: Harmoniser les ressources, categories et recherches
story: ui10-2
type: feature
created: 2026-11-11
status: done
route: dispatch
baseline_commit: 4f19a335fd8cf7f3417e3eeb25c7b0e80eab444b
context:
  - "{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/DESIGN.md"
---

<frozen-after-approval>

## Intent

Appliquer le socle UI10-1 aux neuf pages ressources, categories et recherches.
Direction globale approuvee par Dylan dans CC-2026-11-11-UI ; aucun prototype
limite a une page. Garder les fonctions et donnees existantes.

## Boundaries & Constraints

Fond blanc, cartes mauves `#F3EDF8`, texte sombre, violet profond, champs blancs,
rayons et ombres discrets selon DESIGN. Conserver les couleurs des etats et les
confirmations destructives distinctes des actions principales.
Ne modifier ni services, actions, SQL, classements, quotas, donnees ou permissions.
Conserver selecteurs natifs, filtre GET, option inconnue et labels.
Lire les guides Next locaux. Pas de package, secret, nouvel appel IA, migration,
commit, push ou done par l'agent. Le pilote commitera chaque lot apres controles.

## I/O & Edge-Case Matrix

| Etat | Attendu |
|---|---|
| Liste/resultat/detail | Titre, categorie/date, extrait/texte et liens conserves |
| Filtre/rechargement | Valeur conservee, Toutes les categories retire le filtre |
| Membre / responsable | Memes actions permises, une seule zone de renommage |
| Erreur / vide / indexation | Libelles et etats distincts, pas de succes simule |
| Confirmation / annulation | Element nomme, rien supprime sans confirmation |
| Clavier / 320 px / 200 % | Actions et textes accessibles sans debordement |

</frozen-after-approval>

## Code Map

- `src/app/resources/page.tsx`, `new/page.tsx`, `[id]/page.tsx`,
  `[id]/edit/page.tsx`, `[id]/delete/page.tsx` : presenter liste, detail, formulaires
  et suppression avec le socle approuve, sans toucher a la lecture serveur.
- `src/app/categories/page.tsx`, `src/features/resources/category-list.tsx`,
  `category-forms.tsx`, `resource-forms.tsx` : categories et formulaires existants.
- `src/app/resources/search/page.tsx`, `searches/page.tsx`,
  `searches/[id]/delete/page.tsx` : resultats, historique et suppression.
- `src/app/globals.css` : reutiliser les tokens/classes UI10-1 ; ajouter seulement
  les variantes de presentation indispensables, pas de surcharges dupliquees.
- `tests/category-selectors.test.mjs`, `tests/s8-3-pale-cards.test.mjs` :
  preservent le filtre, les roles et les rendus avec ressources fictives.

## Tasks & Acceptance

- [x] Appliquer les styles a chacune des neuf routes et a leurs etats disponibles.
- [x] Garder selections, liens, badges, formulaires et confirmations.
- [x] Ajouter/adapter les tests de rendu des ecrans touches, pas seulement CSS.
- Etant donne une ressource autorisee, quand elle est ouverte ou geree,
  alors ses informations et actions restent disponibles dans le nouveau style.
- Etant donne une liste vide, un refus ou une erreur, quand elle est affichee,
  alors elle n'est pas presentee comme une liste chargee ou un succes.

## Verification

Tests rendus/categories/cartes et tests de validation des ressources ;
TypeScript et lint cibles. Pas de mutations distantes ni appel IA reel.
Le pilote verifie navigateur, revue et commit.

## Validation humaine — 2026-11-12

Dylan valide toute la refonte visuelle et le correctif `Date.now()`.
Ce lot est termine au titre de la correction de trajectoire CC-2026-11-11-UI,
hors sprint. Le repere historique UI10-2 et le dossier restent inchanges.
Cette acceptation ne vaut pas execution des controles non observes ni validation IA9.

## Implementation Notes

Le pilote a charge le workflow BMAD et fera la revue ; executer cette fiche
directement sans autre skill ni sous-agent. Mettre la fiche en revue et rendre
les controles effectues, sans lancer une nouvelle campagne de revue.

## Review Triage Log

Revue directe du pilote : classes ciblees sur historique/categories, controles
de focus et confirmations destructives, sans changement des services ni actions.
La nouvelle suite est enregistree explicitement dans `test:unit`, sans import
cache depuis une autre suite. Tests de rendu des neuf routes et des etats ;
controle authentifie au navigateur toujours differe faute de session autorisee.
Verification directe finale : 23 tests ressources, categories, cartes et
validation reussis, aucun ignore ; TypeScript, lint cible et diff-check reussis.
