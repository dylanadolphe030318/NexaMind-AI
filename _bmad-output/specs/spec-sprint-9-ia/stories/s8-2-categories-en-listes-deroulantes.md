---
story: s8-2
title: Présenter les catégories en listes déroulantes
sprint: 9
type: ux
status: done
baseline_commit: f8e0788fb7e7cc15cafa1d4ea53a852e90689052
context:
  - ../SPEC.md
  - ../conventions.md
---

# Complément S8-2 — catégories déroulantes

## Validation finale — 2026-11-12

Dylan confirme : « L'évaluation du sprint IA est satisfaisante : tout est correct »
et demande la cloture des stories. Complement accepte et termine.
Les consignes de pause et de maintien en revue ci-dessous sont historiques.

## Direction de réalisation du 2026-11-11

Dylan autorise maintenant le développement de S8-2 après la préparation 4.16,
sans attendre ses tests manuels ; évaluation regroupée à la fin du sprint 9.
Cette direction remplace les pauses de préparation, pas les critères.
Réaliser seulement cette fiche ; le pilote poursuivra S8-3. Ne pas commiter,
pousser, migrer ni appeler réellement l'IA. Préserver droits, session et contrats IA.
Exécuter tests automatiques pertinents, TypeScript, lint et build. Lire les
guides Next locaux avant de modifier le code. Tester le comportement et les
liens rendus, pas uniquement la présence de classes ; utiliser le navigateur
si disponible pour les interactions, sans nouveau compte ni secret exposé.
Consigner honnêtement les contrôles visuels/interactions qui restent à faire.
Laisser fiche et suivi en revue, jamais `done` ; arrêter sur erreur persistante.
Le pilote fait un commit par story. Aucun changement de couleur avant S8-3.

Transféré dans les fiches actives du sprint 9 le 2026-11-11. L'identifiant S8-2,
les cinq critères et le périmètre validé sont conservés ; aucune copie active
ne reste dans le sprint 8. À cette étape de préparation, aucun développement
n'avait encore été effectué.

## Ce que cela permet

Distinguer le choix d'une catégorie de la liste des ressources et garder une gestion claire des catégories.

## Critères d'acceptation

1. Étant donné la page Ressources, quand le membre choisit une catégorie dans un menu libellé, alors les ressources sont filtrées comme auparavant ; « Toutes les catégories » retire le filtre.
2. Étant donné un filtre actif ou un rechargement, quand la page s'affiche, alors le choix sélectionné correspond au filtre ; l'état sans résultat reste explicite.
3. Étant donné la page Catégories, quand une catégorie est choisie, alors son nom est clair et le responsable peut ouvrir une seule zone de renommage pour celle-ci ; la création reste disponible.
4. Étant donné un membre sans droit de gestion, quand il consulte les écrans autorisés, alors aucune action responsable n'est ajoutée ; une tentative directe d'écriture reste refusée par RLS.
5. Étant donné clavier, mobile ou liste vide/erreur, quand les sélecteurs sont utilisés, alors labels, focus, choix et états restent accessibles sans confusion ni succès simulé.

## Décisions de comportement

- Validé : les deux pages, sans changer les noms ni le classement en base.
- Proposé pour relecture : sélecteur HTML natif ; formulaire GET avec bouton « Filtrer » sur Ressources, sélection locale avec bouton « Renommer » pour le responsable sur Catégories.
- Changer de catégorie ferme l'édition précédente sans enregistrer automatiquement ; conserver Enregistrer/Annuler explicites.
- Ne pas modifier les sélecteurs déjà existants des formulaires d'ajout/modification de ressource, hors nécessité directement liée.

## Carte du code et tâches

- [x] `src/app/resources/page.tsx` : remplacer le groupe de liens par le filtre déroulant en conservant le paramètre `category`.
- [x] `src/features/resources/category-list.tsx` et `category-forms.tsx` : sélection unique et renommage réservé au responsable.
- [x] `src/app/globals.css` : réutiliser les champs et focus existants ; ne pas recolorer toutes les cartes ici.
- [x] Tests automatisés du filtre, états et droits ; création/renommage existants en intégration.
- [ ] Vérification humaine au clavier, sur mobile et avec les deux rôles.
- [x] Mettre à jour le pattern « Liste de catégories » de `EXPERIENCE.md` lors du développement pour refléter la présentation validée.
- [x] `src/app/categories/page.tsx` : conserver les états serveur et le contrôle du
  rôle actuel ; la liste ne doit pas faire croire qu'un membre peut renommer.
- [x] `tests/supabase-rls.test.mjs` : conserver création/renommage responsable et refus
  membre. Ajouter un test exécutable du filtre et de la sélection, pas seulement
  une vérification des noms de classes. Si nouveau fichier de test, l'enregistrer
  dans le runner existant.

## Vérification

Scénario S9-I de [tests-ia.md](../../../../tests-ia.md), avec membre et responsable. Aucun changement de schéma nécessaire prévu.

- Vérifier valeur après rechargement, catégorie absente/inconnue, liste vide,
  erreur de chargement, annulation et changement de sélection pendant renommage.
- Clavier : label associé, Tab, flèches, validation et focus après annulation ;
  mobile : aucune perte d'action ni débordement horizontal.
- Ordre planifié après 4.16 ; pas de nouvelle dépendance IA. Exécuter tests
  ciblés, TypeScript, lint et build, plus intégration des écritures existantes.
- Un commit de livraison puis arrêt pour l'évaluation de Dylan ; ne pas marquer
  la story terminée avant cette évaluation.

## Vérification de réalisation

Tests unitaires, TypeScript, lint, build de production et `tests/supabase-rls.test.mjs` exécutés avec succès le 2026-11-11. Aucun appel IA ni migration exécuté.

Le rendu SSR et les transitions de sélection/annulation sont testés automatiquement. Le navigateur local n'avait pas de session authentifiée ; les contrôles manuels clavier, responsive/zoom et visuels avec les rôles membre/responsable restent à faire par Dylan.

Fiche et suivi restent en revue jusqu'à son évaluation ; aucun commit ni push n'a été effectué.

## Review Triage Log

- `patch` — `src/features/resources/resource-category-filter.tsx:25` : l'option
  de filtre pour une catégorie inconnue était désactivée et
  les formulaires HTML omettent les options désactivées. Retrait de `disabled`
  et test SSR du maintien de la valeur sélectionnée après rechargement.
- `patch` — revue directe du pilote : une erreur de chargement des catégories
  était assimilée à une liste vide. Le sélecteur affiche désormais une erreur
  explicite et un lien de réessai, sans faux état vide ; scénario de rendu ajouté.
  Le filtre est typé par sa méthode `eq`, sans conversion forcée, et un ancien
  succès de renommage est effacé au début d'une nouvelle édition.
  Les cinq tests ciblés, TypeScript et lint ont été relancés avec succès.
