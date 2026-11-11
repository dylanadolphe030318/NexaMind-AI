---
title: Harmoniser l'assistant et verifier l'ensemble
story: ui10-3
type: feature
created: 2026-11-11
status: ready-for-dev
route: dispatch
context:
  - "{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/DESIGN.md"
---

<frozen-after-approval>

## Intent

Completer la refonte approuvee CC-2026-11-11-UI sur assistant et conversations,
puis verifier les seize pages. Garder une distinction entre questions, reponses
et sources ; conserver strictement les associations fait/source.

## Boundaries & Constraints

Reutiliser le socle UI10-1 et UI10-2 : fond blanc, reponses et sources mauves,
liens soulignes, violet profond, champs clairs. Ne pas changer le moteur IA,
prompts, schemas, parsing, services, recherche, droits, budgets et quotas.
Pas de nouvelle fonction, dependance ou migration. Lire les guides Next locaux.
Pas de compte cree, donnees modifiees, appel IA reel ou secret expose pour
valider la presentation. Pas de commit, push ni done par l'agent.
Les preuves IA9 et RLS differees ne sont pas remplacees par cette refonte.

## I/O & Edge-Case Matrix

| Etat | Attendu |
|---|---|
| Reponse nouvelle / rouverte | Memes faits, numeros, preuves et liens |
| Question historique | Presentation distincte, pas une carte de reponse |
| Abstention / erreur / quota | Messages et actions inchanges, pas de nouvel appel |
| Source indisponible | Signal explicite sans ancien titre/extrait |
| Historique vide/chargement/erreur | Etats visibles et differents |
| Suppression / annulation | Confirmation existante, pas de mutation ajoutee |
| 320/375/1280 px, clavier, 200 % | Contenu et controles essentiels utilisables |

</frozen-after-approval>

## Code Map

- `src/app/assistant/page.tsx`, `conversations/page.tsx`,
  `conversations/[id]/page.tsx`, `conversations/loading.tsx` : pages serveur,
  chargement et confirmation integree a conserver.
- `src/features/assistant/assistant-form.tsx`, `assistant-answer.tsx` :
  interactions existantes et rendu partage, sans modifier core/services.
- `src/app/globals.css` : reutiliser cartes et tokens des deux premiers lots.
- `tests/assistant.test.mjs`, `assistant-conversations.test.mjs`,
  `s8-3-pale-cards.test.mjs` : rendu, plusieurs passages, indisponibles, idempotence.
- `tests/resource-selection-client.test.mjs` : contrats de selection a conserver.

## Tasks & Acceptance

- [ ] Harmoniser les trois pages et le chargement, confirmations comprises.
- [ ] Tester le rendu des sources et les etats, sans changer les contrats IA.
- [ ] Executer tests unitaires enregistres, TS/lint et build de production.
- [ ] Documenter les verifications reelles par route et les limites de session.
- Etant donne une reponse, quand elle est rouverte, alors les liens et contenus
  sont conserves avec le nouveau style.
- Etant donne les seize pages, quand elles sont verifiees sur les formats
  prevus, alors aucun contenu essentiel ne deborde ou n'est masque.
  Une route non accessible faute de session reste explicitement non verifiee.

## Verification

Tests assistant/conversations/cartes/selection, TypeScript, lint, puis build.
Verifications navigateur sur vraies routes seulement, pas de gabarit injecte
presente comme test authentifie. Pas d'appel IA reel. Le pilote effectue revue,
controle transversal final et commit ; evaluation humaine garde les stories en revue.

## Implementation Notes

## Review Triage Log
