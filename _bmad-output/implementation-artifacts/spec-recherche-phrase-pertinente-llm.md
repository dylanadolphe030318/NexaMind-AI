---
title: 'Afficher une phrase pertinente dans la recherche de ressources'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-projet-ia-2026-10-28/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-projet-ia-2026-10-28/EXPERIENCE.md'
  - '{project-root}/_bmad-output/specs/spec-sprint-8-ia/stories/s8-1-fiabiliser-la-recherche.md'
  - '{project-root}/tests-ia.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La recherche retrouve parfois la bonne ressource, mais l'extrait fixe de 200 caractères coupe l'information utile. Pour les questions de test 2, 5 et 6, la phrase attendue se trouve dans les passages autorisés, sans être visible dans l'extrait court.

**Approach:** Après la recherche sémantique existante, envoyer au LLM côté serveur la question et au plus cinq passages déjà retournés sous la session et RLS. Le LLM choisit une seule phrase complète, verbatim dans le passage le plus pertinent ; vérifier côté serveur qu'elle appartient au passage et qu'elle ne dépasse pas 300 caractères. Faire au plus un appel par recherche, sous le quota actuel de 20 recherches par minute par membre. Afficher la phrase, sa ressource et un lien, en conservant les résultats et leur classement. Si aucune citation exacte ne peut être validée ou si le fournisseur échoue, garder les résultats et signaler explicitement l'indisponibilité de la phrase.

Question et passages restent des données, jamais des instructions ; aucun secret ni passage hors RLS ne part au navigateur ou au fournisseur. Ne pas modifier le seuil, les embeddings, les RPC, le nombre ou l'ordre des résultats, le parcours Assistant, ni la façon dont son LLM rédige les réponses. La question 3, dont le passage pertinent est sous le seuil et n'est pas retourné, reste à traiter séparément. Aucun schéma de base ou capacité d'extraction générale n'est ajouté.

</frozen-after-approval>

## Implementation Notes

Contexte vérifié avant implémentation : `searchResourcePassages` utilise le client Supabase de la session ; le RPC hybride retourne au maximum cinq passages après RLS et classement. Le cas Q2 contient le passage exact en quatrième position, donc le LLM doit comparer tous les passages reçus, et non seulement le premier. `buildPassageExcerpt` coupe à 200 caractères, alors que les passages indexés font environ 800 caractères. La définition RAG de Q3 a été retrouvée dans la base avec une similarité mesurée à 0,394 sous le seuil 0,4 ; une étape de sélection après recherche ne peut pas la récupérer.

Afficher près du formulaire un avis visible avant l'envoi : « Pour choisir une phrase pertinente, votre question et jusqu'à cinq passages trouvés sont envoyés à OpenAI. » Présenter la phrase choisie dans un bloc distinct avant la liste, avec le titre de sa ressource et son lien. Une erreur de sélection ne doit ni cacher les résultats ni simuler une phrase réussie.

Vérifier le rendu et les limites par tests unitaires avec un fournisseur simulé ; ne pas appeler OpenAI pendant les tests. Compléter `tests-ia.md` pour documenter l'effet attendu sur les questions 2, 5 et 6, et rappeler que la question 3 reste exclue.

Implémentation : le service serveur réutilise `generateChatReply` et le schéma JSON strict existant. Le cœur borne les candidats à cinq, accepte seulement une phrase complète provenant exactement du passage indiqué (espaces de mise en forme normalisés), avec une source unique et 300 caractères maximum. La sélection est isolée dans une frontière Suspense : les résultats et leur classement restent affichés pendant l'appel LLM. L'avis avant recherche précise que titres et textes complets sont envoyés. Les erreurs fournisseur et réponses invalides restent visibles sans question ni passage dans les journaux.

La validation a relevé et corrigé la segmentation d'une phrase terminée par une ponctuation suivie d'un guillemet fermant. Une vérification UI automatisée de rendu n'a pas été ajoutée : le dépôt ne fournit pas de banc de rendu de composants serveur ; le scénario reste documenté pour contrôle manuel.

## Review Triage Log

- `medium` — L'appel LLM retardait l'affichage des résultats jusqu'au délai maximal de 30 secondes ; la sélection est maintenant dans une frontière Suspense avec un état de chargement, séparée de la liste des résultats.
- `medium` — L'avis initial parlait d'« extraits » alors que les passages complets partent au fournisseur ; le texte indique maintenant clairement que titres et textes sont transmis.
- `medium` — Une phrase suivie d'un guillemet fermant pouvait être refusée à tort ; la segmentation gère les guillemets et un test couvre ce cas.
- `medium` — Les réponses invalides du modèle étaient visibles mais non journalisées ; elles déclenchent maintenant le même journal générique, sans question ni passage.
- `low` (rejeté) — Le test d'interface inspecte le source TSX plutôt que le rendu HTML. Le dépôt ne fournit pas de banc de rendu des composants serveur, et le comportement est documenté pour le test manuel ; ajouter cette infrastructure à cette correction ciblée serait disproportionné.
