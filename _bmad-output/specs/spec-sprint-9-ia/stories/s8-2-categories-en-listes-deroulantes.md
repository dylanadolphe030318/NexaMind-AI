---
story: s8-2
title: Présenter les catégories en listes déroulantes
sprint: 9
type: ux
status: ready-for-dev
context:
  - ../SPEC.md
  - ../conventions.md
---

# Complément S8-2 — catégories déroulantes

Transféré dans les fiches actives du sprint 9 le 2026-11-11. L'identifiant S8-2,
les cinq critères et le périmètre validé sont conservés ; aucune copie active
ne reste dans le sprint 8. Préparation seulement, aucun développement.

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

- `src/app/resources/page.tsx` : remplacer le groupe de liens par le filtre déroulant en conservant le paramètre `category`.
- `src/features/resources/category-list.tsx` et `category-forms.tsx` : sélection unique et renommage réservé au responsable.
- `src/app/globals.css` : réutiliser les champs et focus existants ; ne pas recolorer toutes les cartes ici.
- Tests du filtre, états et droits ; vérifier création/renommage existants en intégration et au clavier.
- Mettre à jour le pattern « Liste de catégories » de `EXPERIENCE.md` lors du développement pour refléter la présentation validée.
- `src/app/categories/page.tsx` : conserver les états serveur et le contrôle du
  rôle actuel ; la liste ne doit pas faire croire qu'un membre peut renommer.
- `tests/supabase-rls.test.mjs` : conserver création/renommage responsable et refus
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
