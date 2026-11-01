---
date: 2026-11-01
scope: minor
status: approved
---

# Proposition de changement de sprint — Rôle visible et à jour

## 1. Résumé du problème
Rétrospective du sprint 3 :
- Rien sur le site n'indique si l'on est « membre » ou « responsable » ; il faut aller voir dans Supabase.
- Pendant la démo, il a fallu se déconnecter pour que le compte « suive » son nouveau rôle.

## 2. Analyse d'impact
- Code existant : le rôle est relu dans `profiles` à chaque page (`src/features/resources/categories.ts`, `actions.ts`, `resources.ts`) ; il n'est pas copié dans la session. Le tableau de bord (`src/app/dashboard/page.tsx`) ne l'affiche pas. La cause exacte du besoin de déconnexion n'est donc pas prouvée : le manque d'affichage rend le changement invisible. Le critère 2 de la story 1.5 sert à le vérifier.
- Base de données : aucune migration (la lecture de son propre profil est déjà autorisée par RLS).
- Aucune nouvelle fonction hors rôle : pas de gestion des rôles, pas de changement de rôle depuis l'application.

## 3. Documents mis à jour
- `epics.md` : story 1.5 ajoutée à l'epic 1 ; FR2 précisé ; sprint 4 = 1.5, 3.2, 3.3, 3.4.
- PRD : critères de FR-2 (rôle affiché) et FR-9 (changement de rôle pris en compte sans déconnexion).
- Architecture : AD-3 précisé (le rôle est relu côté serveur à chaque page, jamais copié dans la session ; affichage informatif, RLS reste juge).
- Expérience : l'écran « Tableau de bord » indique l'identité et le rôle.
- Suivi de sprint : `1-5-voir-son-rôle-dans-l-espace-membre` ajoutée.

## 4. Approche recommandée
Ajout d'une petite story (1.5) plutôt que de rouvrir la story 1.4 déjà terminée et testée. Elle passe en premier dans le sprint 4.

## 5. Passation
Périmètre mineur : mise en œuvre directe par le développeur, un commit. Critère de réussite : le rôle s'affiche et change au rechargement après une promotion par SQL, sans déconnexion.
