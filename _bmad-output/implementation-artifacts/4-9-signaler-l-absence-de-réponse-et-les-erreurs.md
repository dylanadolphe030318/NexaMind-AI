---
story: 4-9-signaler-l-absence-de-réponse-et-les-erreurs
title: Signaler l'absence de réponse et les erreurs
epic: 4
sprint: 7
status: done
---

# Story 4.9 : Signaler l'absence de réponse et les erreurs

## Récit utilisateur

En tant que membre, je veux être averti si les ressources ne permettent pas de répondre ou si la génération échoue, afin de ne pas confondre une erreur ou une supposition avec une réponse fiable.

## Critères d'acceptation

1. Étant donné qu'aucun passage suffisant n'est retrouvé, quand l'assistant répond, alors il dit qu'il ne trouve pas l'information dans les ressources disponibles et ne présente pas une supposition comme certaine.
2. Étant donné que l'assistant prépare sa réponse, quand je consulte l'écran, alors un état d'attente est affiché.
3. Étant donné que la génération échoue, quand je consulte l'écran, alors un message compréhensible permet de réessayer sans perdre la question.

## Limites de la story

États de la page « Assistant » : attente, absence de réponse, échec. Dépend des stories 4.7 et 4.8. Pas d'enregistrement des questions ni d'historique (4.10 et suivantes), pas de relance automatique.

## Décisions de comportement (à valider par Dylan avant le développement)

- [ ] Aucun passage au-dessus du seuil (cas des questions hors sujet 7 et 8) : le LLM n'est pas appelé du tout (pas de coût, pas de risque d'invention) et l'écran affiche le message d'absence de réponse, sans section « Sources ».
- [ ] Passages trouvés mais insuffisants (cas des questions 9 et 10) : le modèle répond « Je ne sais pas » (indicateur « information manquante ») ; l'écran affiche le même message d'absence de réponse et aucune source.
- [ ] Réponse sans source valide ou réponse non conforme au format attendu : traitée comme « information manquante », jamais affichée comme une réponse.
- [ ] La réponse « Je ne sais pas » ne révèle ni le titre ni l'existence d'une ressource non autorisée (elle ne reçoit aucun passage inaccessible, voir story 4.6).
- [ ] État d'attente : texte « L'assistant prépare sa réponse… », bouton désactivé pendant la génération, sans animation distrayante.
- [ ] Échec (OpenAI indisponible, délai dépassé, réponse invalide, clé absente) : message simple sans détail technique ; la question reste dans le champ ; un bouton « Réessayer » relance une génération sur demande uniquement.
- [ ] Limite atteinte (20 questions par minute, story 4.4) : message distinct « Trop de questions en peu de temps. Réessayez dans une minute. »
- [ ] Erreurs journalisées côté serveur sans la clé ni le texte de la question.

## Textes d'écran

- Absence de réponse : « Je ne trouve pas cette information dans les ressources disponibles. Reformulez votre question ou réessayez plus tard. »
- Attente : « L'assistant prépare sa réponse… »
- Échec : « La réponse n'a pas pu être produite. Réessayez dans un instant. » ; bouton « Réessayer »

## Notes pour le développement

- Architecture : AD-5 (sans contexte suffisant l'assistant ne devine pas, sans relance automatique), AD-1.
- Étendre le résultat de la story 4.7 avec les statuts `no-context`, `unknown`, `rate-limited` et `error` ; la page affiche un message par statut. L'état d'attente passe par `useFormStatus`/`useActionState` côté composant client, sans exposer de clé ni appeler OpenAI depuis le navigateur.
- Tests unitaires : aucun appel au modèle si aucun passage ; « information manquante » donne le message d'absence de réponse sans source ; erreur réseau, délai dépassé et réponse invalide donnent le statut échec ; aucun texte de question ni clé dans les journaux.
- Vérifier par recherche dans le code qu'aucun usage de `service_role` n'est ajouté.
- Règle de fin de story : accents et ton vérifiés dans le navigateur.

## Vérifications dans le navigateur (à faire par Dylan)

- [ ] Questions 7 et 8 de `tests-ia.md` : message d'absence de réponse, aucune source.
- [ ] Questions 9 et 10 : « Je ne sais pas » en substance, aucune source, aucun titre de ressource inaccessible.
- [ ] Pendant la génération, « L'assistant prépare sa réponse… » est visible.
- [ ] Avec une clé OpenAI volontairement incorrecte dans `.env.local`, le message d'échec apparaît, la question reste saisie et « Réessayer » fonctionne (remettre la bonne clé ensuite).
- [ ] Les accents s'affichent correctement.
