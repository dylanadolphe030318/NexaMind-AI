---
story: s8-3
title: Distinguer les cartes avec un fond mauve pâle
sprint: 9
type: ux
status: done
baseline_commit: 56ab501746d370910bf5a72e2656c48c3c563afa
context:
  - ../SPEC.md
  - ../conventions.md
---

# Complément S8-3 — cartes mauve pâle

## Validation finale — 2026-11-12

Dylan confirme : « L'évaluation du sprint IA est satisfaisante : tout est correct »
et demande la cloture des stories. Complement accepte et termine.
La refonte globale a ete validee separement comme correction de trajectoire.
Les consignes de pause et de maintien en revue ci-dessous sont historiques.

## Direction de réalisation du 2026-11-11

Dylan autorise le développement de S8-3 après S8-2 sans attendre ses tests :
évaluation humaine regroupée à la fin, aucun statut `done`. Les indications
de préparation et pauses des compagnons sont historiques pour ce lot.
Réaliser seulement cette fiche ; ne pas commiter, pousser, migrer ni appeler
réellement l'IA. Préserver contenus, liens, droits, budgets et paramètres IA.
Lire les guides Next locaux avant de modifier le code. Exécuter tests ciblés
enregistrés dans le runner, TypeScript, lint et build. Utiliser le navigateur
pour couleurs calculées et responsive sur les surfaces accessibles, sans
identifiant exposé, et consigner précisément toute limite de session ;
ne pas prétendre avoir vérifié des écrans authentifiés sans y accéder.
Les tests manuels avec comptes membre/responsable et la campagne réelle sont
différés par Dylan, pas remplacés par des vérifications statiques.
Laisser fiche et suivi en revue ; le pilote effectue le commit de cette story.
Arrêter en cas de défaut bloquant ou erreur persistante.

Transféré dans les fiches actives du sprint 9 le 2026-11-11. L'identifiant S8-3,
les cinq critères et le périmètre validé sont conservés ; aucune copie active
ne reste dans le sprint 8. La préparation initiale n'avait lancé aucun développement.

## Ce que cela permet

Reconnaître les blocs d'information sur le fond blanc sans changer leur contenu.

## Critères d'acceptation

1. Étant donné la liste Ressources et les résultats par mots-clés ou par sens, quand ils s'affichent, alors leurs cartes ont un fond mauve pâle distinct de la page blanche.
2. Étant donné une réponse et ses sources, sur Assistant ou dans une conversation rouverte, quand elles sont affichées, alors les blocs correspondants partagent cette distinction.
3. Étant donné texte, liens, boutons et focus, quand ils sont sur le mauve, alors les contrastes WCAG 2.2 AA sont respectés : texte normal au moins 4,5:1, grand texte et composants concernés au moins 3:1.
4. Étant donné une erreur, un succès ou une absence de réponse, quand son message apparaît, alors sa couleur et son libellé restent distincts ; aucun contenu n'est distingué uniquement par la couleur.
5. Étant donné mobile ou zoom 200 %, quand les cartes sont consultées, alors aucune information ou action essentielle n'est perdue ni déborde horizontalement.

## Décisions de comportement

- Validé : liste ressources, résultats recherche, réponse et sources assistant ; fond global blanc.
- Proposition visuelle pour relecture : réutiliser `#f3edf8`, déjà présent dans le thème, et vérifier les contrastes réellement rendus.
- Appliquer des classes ciblées, pas une recoloration globale de `.category-entry` qui changerait des écrans non demandés.
- Couvrir aussi les réponses historiques de 4.11 ; ne pas changer boutons, textes, ordre de résultats ni comportement des formulaires.

## Carte du code et tâches

- [x] `src/app/globals.css` : style mauve pâle ciblé, retour à la ligne et largeur minimale des cartes.
- [x] `src/app/resources/page.tsx` et `src/app/resources/search/page.tsx` : appliquer le style aux cartes des ressources et résultats.
- [x] Réponses et sources de l’assistant mauve pâle, sur Assistant et dans les conversations rouvertes ; questions et confirmations inchangées.
- [x] Mettre à jour `DESIGN.md` pour consigner le traitement visuel.
- [x] Ajouter et enregistrer dans le runner un test de rendu des cartes, des sources, des liens et des états.
- [x] Vérifier dans le navigateur les couleurs calculées, le contraste, le focus clavier et un gabarit à 320 px et à largeur CSS équivalente à 200 %.
- [ ] Revoir les écrans authentifiés réels et exécuter les vérifications manuelles avec les comptes membre/responsable ; Dylan les a différées.

## Résultats de vérification — 2026-11-11

- Tests unitaires enregistrés : 137 réussis, aucun échec ni test ignoré.
- Lint et `npx tsc --noEmit` réussis.
- Le build a d'abord échoué deux fois sur `EPERM unlink` dans `.next/static`.
  Le pilote a inspecté le sous-dossier généré exact, marqué en lecture seule
  par OneDrive, puis supprimé seulement ce sous-dossier. Le build de production
  a ensuite réussi, sans arrêter le serveur préexistant ni modifier sa configuration.
- Sur la page publique `/login`, sans connexion ni identifiant exposé, un gabarit de cartes a été ajouté temporairement dans le navigateur pour lire les styles calculés. Fond `rgb(243, 237, 248)`, texte et liens `rgb(37, 32, 50)`, contraste mesuré `13,73:1`. Le focus clavier est visible, contour solide `rgb(37, 32, 50)`, contraste `13,73:1`.
- Le gabarit ne déborde pas à 320 px ni à 160 px de largeur CSS (simulation du reflow à 200 %) ; les contenus et liens restent présents. Les états d’erreur, succès et absence gardent leurs fonds distincts et leurs libellés.
- Les routes authentifiées Ressources, Recherche, Assistant et conversation n’étaient pas accessibles sans session ; leur contrôle visuel réel et la campagne humaine restent différés. Aucune IA n’a été appelée.

## Revue directe

Le rendu partagé couvre les nouvelles réponses et les réponses rouvertes ; les
questions, confirmations et états ne reçoivent pas les classes mauves. Les tests
vérifient contenus et liens, pas seulement la présence de classes.
La revue des couleurs secondaires a détecté un contraste insuffisant des
métadonnées : `#716B7C` sur `#F3EDF8` donne 4,46:1. Une couleur `#6E6878` ciblée
aux métadonnées de ces cartes corrige ce cas, avec seuil 4,5:1 testé explicitement.
Après cette correction, la suite enregistrée complète a été relancée :
137 tests réussis, aucun échec ni test ignoré ; TypeScript et lint ciblé réussis.

## Vérification

Scénario S9-J de [tests-ia.md](../../../../tests-ia.md). Dépend de S8-2 pour valider la distinction finale catégories/ressources.

Mesurer et consigner les ratios sur les couleurs effectivement calculées :
texte courant 4,5:1 minimum ; grand texte et composants/focus concernés 3:1.
Tester chaque surface sur ordinateur et à 320 pixels de largeur, clavier et
zoom 200 %. Conserver affichages vide/erreur/succès/abstention et sources
indisponibles, sans statut porté par la couleur seule.

Tests ciblés de rendu et de contenu/liens, lint, TypeScript et build ; pas
d'appel IA supplémentaire nécessaire pour comparer des styles sur données de test.
Un commit de livraison, puis évaluation visuelle de Dylan. L'epic IA ne peut
être clôturé qu'après acceptation des stories restantes, pas à la préparation.
