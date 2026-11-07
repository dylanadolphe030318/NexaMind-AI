# Proposition de changement de plan — 2026-11-07

**Projet :** NexaMind AI  
**Déclencheur :** constats de la rétrospective du sprint 8 et précisions de Dylan  
**État :** approuvée par Dylan le 2026-11-07 — transmise pour réorganisation du backlog

## 1. Résumé du problème

Trois points justifient une amélioration :

1. La recherche de ressources a retourné la ressource attendue pour **7 requêtes sur 10**, sous la cible de **8 sur 10**. Les questions Q1, Q3 et Q5 sont à conserver pour suivre les cas observés.
2. Pendant la démonstration, l'assistant était difficile à trouver sans connaître son adresse. Le PRD et l'UX prévoient déjà un accès depuis le tableau de bord ou la navigation.
3. Le test d'intégration RLS des conversations crée des conversations et peut créer une catégorie de test. Son nettoyage actuel supprime la ressource, mais pas toutes les données créées.

Pour l'assistant, Dylan a confirmé que les deux abstentions attendues ont été respectées et qu'aucune fuite n'a été observée. Ces résultats sont distincts du score de recherche de ressources.

## 2. Analyse des impacts

### Epics et stories

- **Epic 3 — Recherche :** ajouter la candidate Story 3.5 au backlog pour améliorer la recherche de ressources. L'Epic 3 est actuellement terminé ; son suivi devra être réouvert lorsque cette story sera planifiée et commencera.
- **Epic 1 — Accès :** ajouter la candidate Story 1.6 au backlog pour rendre l'accès à l'assistant visible depuis le tableau de bord. L'Epic 1 est actuellement terminé ; son suivi devra être réouvert lorsque cette story sera planifiée et commencera.
- **Epic 4 — IA :** conserver le sprint 9 sans changement. Il reste à cinq stories : 4.14, 4.15, 4.16, S8-2 et S8-3.

Les deux stories candidates restent **hors du sprint 9 et sans affectation à un futur sprint**. Le prochain sprint ne sera planifié qu'avec trois à cinq stories au total.

### PRD, architecture et UX

- **PRD :** aucune modification proposée. La cible de recherche de 8/10 (SM-3), la recherche par mots-clés (FR-6) et l'accès du tableau de bord aux fonctions principales (FR-2) sont déjà prévus.
- **Architecture :** aucune modification proposée. Le moteur de recherche conserve les droits RLS et l'accès à l'assistant reste soumis à l'authentification.
- **UX :** aucune modification de fond proposée. L'assistant est déjà prévu depuis le tableau de bord et la navigation. La story 1.6 rend cette intention visible dans le produit.
- **Tests :** ajouter une règle de nettoyage aux consignes de `tests-ia.md`.

### Impacts techniques et de calendrier

Aucune migration ni modification d'architecture n'est requise par cette proposition. Le travail de nettoyage des données appartient à la vérification des tests RLS ; il ne crée pas une story supplémentaire au sprint 9. Les deux stories de suivi n'auront un impact sur le calendrier qu'après leur affectation à un futur sprint.

## 3. Approche recommandée

**Ajustement direct du backlog et des consignes de test**, sans retour en arrière et sans réduction du MVP.

- **Effort estimé :** faible pour la navigation et le nettoyage des tests ; moyen pour la recherche, qui doit être mesurée sur le jeu de référence.
- **Risque :** faible à moyen. Le risque principal est de modifier le classement de façon à améliorer certaines questions tout en dégradant d'autres résultats ; les dix questions doivent donc être rejouées.
- **Calendrier :** aucun changement au sprint 9. Les deux candidates restent non planifiées.
- **Raison :** ces ajustements traitent les écarts constatés tout en conservant les résultats déjà validés de l'assistant et les contrôles d'accès.

## 4. Changements proposés en détail

### 4.1 Consignes de test RLS

**Fichier :** `tests-ia.md`  
**Section :** « Vérification du sprint 8 — conversations et recherche »

**Avant :** les consignes demandent d'exécuter les tests RLS avec des comptes de test, mais ne demandent pas explicitement de supprimer toutes les données créées par chaque test.

**Après — ajout proposé :**

> À la fin de chaque test d’intégration RLS, qu’il réussisse ou échoue, supprimer toutes les données créées par le test (conversations, messages, catégories et ressources temporaires). Vérifier que le nettoyage s’exécute aussi après une erreur et qu’il ne supprime aucune donnée réelle.

**Justification :** le test `tests/conversations-rls.test.mjs` supprime la ressource, mais peut laisser la conversation et une catégorie de test.

### 4.2 Candidate Story 3.5 — Epic 3

**Section :** nouvelles story et critères d'acceptation.

**Avant :** l'Epic 3 se termine à la Story 3.4 ; aucune story ne suit le résultat de 7/10 en recherche de ressources.

**Après — ajout proposé au backlog, sans sprint affecté :**

#### Story 3.5 — Améliorer le classement des recherches de ressources

En tant que membre, je veux retrouver les bonnes ressources avec mes mots-clés, afin de trouver plus facilement l’information utile.

**Critères d’acceptation :**

- Sur le jeu de 10 questions de référence, la ressource attendue apparaît dans les trois premiers résultats pour au moins 8 questions sur 10.
- Les questions 1, 3 et 5 sont conservées comme tests de régression avec leurs ressources attendues clairement identifiées.
- Les résultats restent limités aux ressources que le membre a le droit de consulter.

**Justification :** cette story cible la mesure SM-3 du PRD et permettra de vérifier que la recherche progresse sans relâcher les droits d'accès.

### 4.3 Candidate Story 1.6 — Epic 1

**Section :** nouvelles story et critères d'acceptation.

**Avant :** l'Epic 1 se termine à la Story 1.5 ; aucun critère de story ne vérifie que le tableau de bord affiche un accès visible à l'assistant.

**Après — ajout proposé au backlog, sans sprint affecté :**

#### Story 1.6 — Accéder facilement à l’assistant

En tant que membre connecté, je veux trouver un lien vers l’assistant depuis mon tableau de bord, afin de pouvoir l’ouvrir sans devoir deviner son adresse.

**Critères d’acceptation :**

- Le tableau de bord présente un lien clairement nommé vers l’assistant, qui ouvre la page `/assistant` existante.
- Le lien est utilisable au clavier et reste visible sur mobile.
- Les protections d’accès existantes restent en place : une personne non connectée n’accède pas à l’assistant.

**Justification :** cette story concrétise l'accès déjà prévu dans FR-2 et dans l'architecture UX ; elle n'ajoute pas de capacité nouvelle à l'assistant.

## 5. Transmission pour la mise en œuvre

**Portée : modérée — organisation du backlog nécessaire.**

- **Responsable produit / Dylan :** approuver ou modifier la présente proposition et décider plus tard quand planifier les deux stories de suivi.
- **Développeur :** après approbation, mettre à jour les consignes de test, ajouter les stories approuvées aux artefacts de planification et réaliser les stories uniquement lorsqu'elles sont affectées à un sprint.
- **Sprint 9 :** conserver ses cinq stories ; ne pas ajouter les deux stories de suivi à ce sprint.

**Critères de réussite :**

- Les tests RLS suppriment les données qu'ils créent après un succès comme après un échec, sans supprimer de données réelles ni contourner les permissions pendant les assertions.
- Le jeu de dix questions de recherche atteint au moins 8/10, avec Q1, Q3 et Q5 conservées comme tests de régression.
- Un membre trouve l'assistant depuis le tableau de bord sur ordinateur et mobile ; l'accès reste protégé.
- Les histoires de suivi ne sont affectées à un sprint qu'avec un total de trois à cinq stories.

## 6. État de la checklist de changement

- [x] Déclencheur et preuves identifiés : évaluation 7/10, observation de la démonstration et test RLS incomplet en nettoyage.
- [x] Impacts sur les Epics et les stories identifiés.
- [x] PRD, architecture et UX vérifiés ; aucune modification de ces documents n'est proposée.
- [x] Ajustement direct retenu ; aucun rollback ni révision de la portée MVP nécessaire.
- [x] Changements proposés individuellement et approuvés pour inclusion dans cette proposition.
- [x] Proposition complète approuvée par Dylan le 2026-11-07 pour transmission et réorganisation du backlog.

L'approbation finalise cette proposition et autorise son handoff. Les stories restent des candidates non affectées à un sprint ; le sprint 9 et les autres artefacts de planification ne sont pas modifiés dans cette étape. Aucun développement de story n'a commencé.

## Références

- `_bmad-output/planning-artifacts/prds/prd-projet-ia-2026-10-27/prd.md` — FR-2, FR-6 et SM-3.
- `_bmad-output/planning-artifacts/epics.md` — stories et plan des sprints.
- `_bmad-output/planning-artifacts/architecture/architecture-projet-ia-2026-10-28/ARCHITECTURE-SPINE.md` — recherche avec RLS et appels serveur.
- `_bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/EXPERIENCE.md` — accès prévu à l'assistant depuis le tableau de bord et la navigation.
- `_bmad-output/specs/spec-sprint-8-ia/SPEC.md` — sprint 9 à cinq stories.
- `tests-ia.md` — questions de référence et vérifications.
- `tests/conversations-rls.test.mjs` — nettoyage actuel de la ressource de test.
