---
id: SPEC-backlog-standard
companions:
  - stories/1-6-acceder-facilement-a-l-assistant.md
  - stories/3-5-ameliorer-le-classement-des-recherches-de-ressources.md
  - verification-navigateur.md
  - ../../planning-artifacts/architecture/architecture-projet-ia-2026-10-28/ARCHITECTURE-SPINE.md
sources: []
---

# Backlog standard — accès et recherche de ressources

## Why

Le membre doit pouvoir trouver l'assistant sans saisir son adresse et retrouver plus facilement les ressources utiles. Les sprints standard existants sont terminés ; Dylan choisit de préparer les deux stories restantes hors sprint, dans l'ordre 1.6 puis 3.5.

## Capabilities

- **CAP-1**
  - **intent:** Ouvrir l'assistant existant depuis le tableau de bord.
  - **success:** Un lien nommé « Assistant » fonctionne au clavier et sur mobile, sans modifier la protection de la route.
- **CAP-2**
  - **intent:** Retrouver les bonnes ressources accessibles avec une recherche.
  - **success:** Au moins 8 des 10 cas existants sont conformes à leur type dans la liste « Passages trouvés par le sens » : Q1–Q6, source attendue dans les trois premiers passages ; Q7/Q8, aucun passage pertinent ; Q9/Q10, aucune divulgation de ressource interdite. Toute fuite bloque la validation, indépendamment de la note. Q1, Q3 et Q5 font aussi l'objet de tests de régression.

## Constraints

- Préparation seulement ; relecture humaine avant développement et évaluation avant statut terminé pour chaque story.
- Aucun sprint affecté ; aucune dérogation à la limite de 3 à 5 stories par sprint.
- Conserver les dix questions existantes, selon le choix explicite de Dylan. La note compte des cas conformes, pas des ressources retrouvées. La recherche ne doit pas générer une réponse d'assistant pour mesurer les cas sans réponse.
- Évaluer uniquement les passages hybrides, dans leur ordre affiché, sans fusion avec les résultats littéraux ni déduplication pour calculer le top 3. La phrase sélectionnée n'est pas une preuve de classement.
- Q9/Q10 exigent un jeu autorisé avec ressource réellement inaccessible ; faute de prérequis, noter « non vérifié » et ne pas valider la story. Ne pas créer un second espace dans le MVP ni confondre partage du workspace et confidentialité par propriétaire.
- Réutiliser les routes et l'architecture existantes. Tout appel IA déjà nécessaire à la recherche reste serveur, avec session membre et RLS, sans clé navigateur ni `service_role`.
- Ne modifier ni le fournisseur IA, ni les embeddings, ni le stockage pgvector, ni les comportements de l'assistant et de ses conversations.

## Non-goals

- Préparer ou développer l'epic 4 ou le sprint IA 9, ajouter des stories pour remplir un sprint, modifier les questions de test ou la recherche littérale. Aucun développement pendant cette préparation.

## Success signal

Le membre ouvre l'assistant depuis son tableau de bord, puis vérifie la recherche avec au moins 8 cas conformes sur 10 et aucune fuite. Les deux fiches sont prêtes à être développées sur demande, dans l'ordre 1.6 puis 3.5, hors sprint. Aucune question de périmètre ne reste ouverte ; les données et preuves d'évaluation devront être réunies avant validation finale.
