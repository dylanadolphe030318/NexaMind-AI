---
story: 1-6-accéder-facilement-à-l-assistant
title: Accéder facilement à l'assistant
epic: 1
status: ready-for-dev
context:
  - ../SPEC.md
---

# Story 1.6 — accéder facilement à l'assistant

## Ce que cela permet

Ouvrir l'assistant depuis le tableau de bord, sans connaître son adresse. Il s'agit d'une navigation standard vers une fonction existante, pas d'un développement du moteur IA.

## Critères d'acceptation

1. Étant donné un membre connecté sur le tableau de bord, quand il choisit le lien clairement nommé « Assistant », alors la page `/assistant` existante s'ouvre.
2. Étant donné un responsable connecté, quand il utilise le même lien, alors il ouvre le même assistant sans privilège supplémentaire.
3. Étant donné une navigation au clavier ou sur mobile, quand le tableau de bord est affiché, alors le lien reste visible, lisible, atteignable et activable ; le focus est perceptible.
4. Étant donné une personne déconnectée, quand elle ouvre directement `/assistant`, alors la protection existante l'envoie à la connexion sans exposer de contenu privé.
5. Étant donné les autres liens et la déconnexion, quand le membre les utilise après cet ajout, alors leur comportement reste inchangé.

## Décisions de comportement

- Réutiliser un `Link` Next.js présenté comme les accès existants ; libellé « Assistant » sans nouvelle page intermédiaire.
- Ajouter un accès sur le tableau de bord uniquement ; ne pas créer un menu global, une page IA ou une nouvelle autorisation.
- Naviguer n'envoie aucune question, ne calcule aucun embedding et ne lance aucune génération.
- En cas d'échec de chargement, conserver les comportements d'erreur existants ; ne pas afficher de succès fictif.

## Carte du code et tâches

- `src/app/dashboard/page.tsx` : ajouter le lien parmi les accès existants sans modifier lecture du rôle ni déconnexion.
- `src/app/assistant/page.tsx`, `src/proxy.ts` et `src/lib/supabase/server.ts` : vérifier les protections existantes, sans les dupliquer ; confirmer les chemins réels avant édition.
- `src/app/globals.css` : réutiliser les styles des liens du tableau de bord ; ne modifier que si un défaut de visibilité ou de focus est démontré.
- Lire les guides Next.js pertinents dans `node_modules/next/dist/docs/` avant toute modification.
- Tests : vérifier le lien rendu et sa destination, le parcours clavier/mobile, la protection hors session et les liens existants. Utiliser les outils du projet ; aucune nouvelle dépendance prévue.

## Textes d'écran

« Assistant ». Conserver les titres et messages de la page cible.

## Vérification

Voir [contrôles STD-1 à STD-3](../verification-navigateur.md). Les tests de navigation ne nécessitent aucune question IA.

## Périmètre et statut

Fiche préparée le 2026-11-10, hors sprint. Aucune migration attendue. Aucune modification du modèle LLM, des embeddings ou des conversations. Préparation uniquement ; accord de développement distinct et évaluation de Dylan nécessaires avant `done`.
