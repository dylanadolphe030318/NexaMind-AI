---
date: 2026-10-30
scope: minor
status: approved
---

# Proposition de changement de sprint — Liste des ressources

## 1. Résumé du problème
Pendant la démo du sprint 2, la ligne « Catégorie : … · Mise à jour le … » de la liste des ressources s'affiche en texte brut, sans mise en forme.

## 2. Analyse d'impact
- Epics et stories : aucun impact (`epics.md` et la story 2.5 inchangés).
- PRD, architecture, base de données : aucun impact.
- Design et expérience : aucun changement. `DESIGN.md` décrit déjà la « Carte de ressource » (surface, bordure, rayon, titre + catégorie + date) ; le code livré en story 2.2 s'en écartait.
- Code : `src/app/resources/page.tsx` et `src/app/globals.css` uniquement.

## 3. Approche recommandée
Ajustement direct : aligner la liste sur la carte de ressource déjà décrite. Pas de nouvelle fonctionnalité.

## 4. Changement détaillé
- Avant : titre puis une ligne de texte « Catégorie : X · Mise à jour le … ».
- Après : chaque ressource est une carte ; titre en lien ; catégorie dans une pastille avec son nom écrit (jamais la couleur seule) ; date de mise à jour en texte secondaire.

## 5. Passation
Périmètre mineur : mise en œuvre directe par le développeur, un seul commit. Critère de réussite : la liste affiche des cartes lisibles, navigables au clavier, sans changement de comportement.
