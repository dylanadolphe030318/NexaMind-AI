---
story: 4-10-consulter-la-liste-de-ses-conversations
title: Consulter la liste de ses conversations
epic: 4
sprint: 8
status: done
baseline_commit: 36d8694559c65f4a48afaf177fa8ae0ccd590fb2
context:
  - ../SPEC.md
---

# Story 4.10 — consulter ses conversations

## Ce que cela permet

Enregistrer les nouvelles questions et retrouver ses propres échanges après avoir quitté la page.

## Critères d'acceptation

1. Étant donné une nouvelle question valide sur Assistant, quand elle est acceptée, alors une conversation appartenant au membre et sa question sont enregistrées ; la réponse et ses références de sources sont enregistrées ensemble après génération.
2. Étant donné une génération en échec, quand le membre revient à l'historique, alors la question conservée et son état sont visibles ; aucune réponse inventée n'est sauvegardée.
3. Étant donné plusieurs conversations actives, quand la liste s'affiche, alors elle indique un titre issu de la première question et une date, de la plus récente à la plus ancienne.
4. Étant donné un membre ou un responsable, quand il consulte la liste ou Supabase directement avec sa session, alors il ne reçoit que ses propres conversations.
5. Étant donné une conversation sans nouvelle question depuis 30 jours, quand elle est recherchée, alors RLS la masque ; la simple consultation ne renouvelle pas le délai.
6. Étant donné un historique vide ou une erreur de chargement/enregistrement, quand l'écran s'affiche, alors ces états sont distingués et l'erreur propose de réessayer sans annoncer un succès.

## Décisions de comportement

- Validé : une première question crée une conversation ; aucun import des anciens échanges non enregistrés. Date de dernière nouvelle question et expiration calculées en base.
- Proposé pour relecture : `/assistant/conversations`, lien « Mes conversations » depuis Assistant ; titre = première question, extrait d'affichage de 80 caractères, sans fonction de renommage.
- Une question a un UUID stable réutilisé par « Réessayer » ; contraintes uniques empêchent question/réponse en double et finalisation concurrente. Le serveur contrôle propriétaire, expiration et état avant tout appel au fournisseur.
- Le résultat généré n'est présenté comme enregistré qu'après confirmation SQL ; si la sauvegarde échoue, message explicite et aucun succès simulé. Aucune répétition automatique de l'appel IA.
- Créer dès cette story `conversations`, `messages`, `message_sources` et leurs liens/protections : nécessaire pour enregistrer ce que 4.11 relira. Sources stockées comme références de ressource/passage/révision, sans copie des extraits ; les références de passage retiré sont détachées, sans supprimer la réponse.
- Proposé pour relecture : purge quotidienne avec Supabase Cron par une opération système séparée. Si Cron manque, fournir les étapes à Dylan et arrêter ; RLS doit déjà masquer les expirés.
- Les questions vides/trop longues, les soumissions non authentifiées ou refusées avant acceptation ne créent pas une conversation vide.

## Carte du code et tâches

- Nouvelle migration dans `supabase/migrations/` : UUID, propriétaire, dates, expiration, relations en cascade, statuts, unicité de requête/réponse, références nullable et fonctions atomiques avec droits explicites.
- RLS des trois tables : appartenance à la conversation active du demandeur ; aucun accès supplémentaire au responsable. Dates et propriété ne sont pas librement falsifiables par un membre.
- `src/features/assistant/assistant-actions.ts`, `assistant-state.ts`, `assistant.ts` et nouveau service serveur de conversations : sauvegarde initiale, génération existante et finalisation atomique.
- `src/app/assistant/page.tsx` et nouvelle liste : lien de navigation, titre/date, chargement, vide et erreur.
- Nouveaux tests unitaires et `tests/conversations-rls.test.mjs` : deux membres et responsable, accès directs, expiration et doublons ; enregistrer le test dans le runner existant.
- `README.md` : ordre des migrations, activation Cron et vérification ; application de la migration par Dylan seulement.

## Textes d'écran

« Mes conversations », « Aucune conversation enregistrée. », « Les conversations n'ont pas pu être chargées. Réessayez. », « L'échange n'a pas pu être enregistré. Réessayez. »

## Vérification

Scénarios S8-B, S8-F et S8-G de [tests-ia.md](../../../../tests-ia.md), tests de sauvegarde atomique et de privilèges sous RLS. Relecture de fiche et évaluation par Dylan avant `done`.

## Hors périmètre

Réouverture détaillée (4.11), question de suivi (4.12), suppression utilisateur (4.13), export/partage. Dépend de S8-1 et de l'assistant existant.

## Autorisation de développement

Après présentation des choix de la fiche, Dylan a réitéré sa demande de développer dans l'ordre le 2026-11-06. L'autorisation de préparation seulement est levée pour 4.10 ; S8-1 reste en revue. Implémenter cette fiche et ses choix proposés, sans commencer 4.11 ni marquer `done`. Ne pas commiter depuis l'agent d'implémentation ; le commit suit la revue. N'appliquer aucune migration à Supabase. Si l'intégration est bloquée par la nouvelle migration absente, fournir le nom exact et arrêter les tests dépendants, sans répétition inutile. Lire les guides Next.js pertinents dans `node_modules/next/dist/docs/` avant toute modification Next.js.

## État du développement — vérification finale

- Enregistrement initial, états de génération/sauvegarde, reprise par UUID et liste privée implémentés.
- Migration `20261106120000_create_conversations.sql` appliquée avec succès selon la confirmation de Dylan le 2026-11-06. Les fonctions de recherche y ajoutent les identifiants/révisions de passage sans modifier le classement.
- 66/66 tests unitaires, TypeScript et ESLint réussis après revue. Build de production réussi lors de l'implémentation.
- Tests d'intégration complets : **38/38 réussis, aucun ignoré**, après application et correction des fixtures. 66/66 tests unitaires, TypeScript et ESLint réussis à la reprise.
- Cron confirmé actif par Dylan : `purge-expired-conversations`, `0 3 * * *`.
- Expiration réelle et purge : script autonome `tests/conversations-expiration.sql` exécuté avec succès par Dylan dans SQL Editor le 2026-11-06 ; masquage des trois tables, suppression en cascade et préservation de l'actif vérifiés sur fixtures annulées. Parcours authentifié encore à évaluer.
- Pas de développement de 4.11, pas de statut `done`, pas de commit 4.10 avant la validation d'intégration. S8-1 reste en revue et est déjà commitée.

## Review Triage Log

| Constat | Verdict | Preuve et traitement |
|---|---|---|
| Question vide contenant tabulation/retour acceptée par SQL | medium | `btrim` seul ne retirait pas ces caractères. Normalisation SQL des espaces périphériques, contrainte non-blanche et test RPC ajoutés. |
| Statut NULL provoquant une violation NOT NULL | low | Garde SQL explicite ajoutée et test de retour `false` ; aucune modification d'état acceptée. |
| Catégorie absente sur base de test neuve | medium | Recherche dans le workspace de test, création par le responsable si nécessaire ; test indépendant de l'ordre des autres runners. |
| UUID de retry non vérifié dans l'action | medium | Transition testable utilisée par l'action, test échec/puis retry et contrôle de réutilisation du même UUID ajoutés. |
| Provenance du passage non vérifiée au RPC | medium | Assertions `chunk_id` et `revision` sur les résultats réels des deux RPC ajoutées ; exécution dépend de la migration. |
| Précontrôle des tables avec client anonyme non autorisé | medium | Précontrôle désormais avec session du membre de test ; aucune permission anonyme accordée. |
| Fixture de conversation avec embedding nul perturbant la recherche parallèle | medium | Le cosinus d'un vecteur nul est indéfini et perturbait la fenêtre hybride. Fixture remplacée par un vecteur unitaire sur un axe distinct ; tests ciblés puis suite complète réussis en parallèle. |
| Passage attendu parmi plus de cinq ex aequo dans le test de partage | medium | Vérification du membre B déplacée avant l'ajout du lot de limite ; aucun ordre arbitraire entre ex aequo n'est exigé. |

La migration est transactionnelle : erreur = annulation des changements de ce script. L'application et la planification Cron sont réservées à Dylan.

### Review Findings — revue du sprint demandée le 2026-11-06

Périmètre : S8-1 et 4.10, depuis `d9ed4c71e325f7fa80c860497638089a1d628dcf`, changements locaux et nouveaux fichiers inclus. Revue de sécurité puis quatre lectures BMAD terminées. Aucune vulnérabilité exploitable confirmée sur les clés, les passages sous RLS, les instructions de sources/abstention et les limites IA. Deux défauts fonctionnels de 4.10 sont retenus ; aucun défaut confirmé dans S8-1.

- [x] [Review][Patch][R1][medium] Une question modifiée après un échec réutilisait l'UUID de l'ancienne question. Corrigé après validation de Dylan : le brouillon du formulaire reçoit un nouvel UUID lors de l'édition, avant l'envoi ; une vraie relance du même texte, espaces périphériques compris, conserve l'UUID initial. Revenir au texte initial restaure aussi son identifiant. Le sous-formulaire n'est plus remonté lors du seul passage en attente, pour conserver l'identifiant déjà envoyé. Tests de transition et de sauvegarde après échec ajoutés, garde SQL de conflit conservée. Validation : 13/13 tests conversations, TypeScript et ESLint ciblé réussis. Parcours navigateur authentifié non exécuté : page de connexion affichée lors de la vérification locale.
- [x] [Review][Patch][R2][medium] Une demande déjà traitée avec `no-context` ou `unknown` devenait une erreur à la nouvelle soumission du même UUID. Corrigé après validation de Dylan : ces états sont traités comme `complete`, sans génération, finalisation ni changement de l'état enregistré, et le formulaire reçoit ensuite un nouvel UUID. Test unitaire observé en échec avant correction puis réussi ; test d'intégration ajouté avec les vrais RPC Supabase pour les deux états. Il vérifie une seule question conservée, aucun appel IA et renouvellement de l'identifiant. Validation finale des corrections : 68/68 tests unitaires, 39/39 tests d'intégration sans test ignoré, TypeScript, ESLint et build de production réussis. Aucune nouvelle migration.

Décision : aucune correction de code ni aucun commit pendant la revue. Attendre la validation de Dylan ; un commit distinct par correction autorisée. La story n'est pas terminée et le parcours manuel reste en attente.

Après la revue, Dylan a choisi « Corriger les deux problèmes ». L'implémentation initiale de 4.10 a été enregistrée dans `7d6e34cc1cc0571469c607d9efd4172d87c39bb8` pour isoler ensuite chaque correction dans son propre commit. Les cases de revue cochent les corrections, pas l'acceptation finale de la story.

Les deux corrections autorisées sont désormais appliquées et testées. La story reste `in-review`, pas `done` ; la vérification manuelle de l'application et l'évaluation de S8-1 sont toujours attendues. Aucune story suivante n'a été commencée.

Preuve complémentaire reçue avant cette revue : Dylan a exécuté avec succès le script autonome `tests/conversations-expiration.sql` dans SQL Editor (« Success. No rows returned, sans erreur »). L'expiration RLS et la purge ont donc été vérifiées manuellement sur des fixtures annulées ; ce script n'est pas intégré au runner Node.

#### Rejected

- Blind hunter, statut de première question : `false` pour ce périmètre ; chaque conversation créée par 4.10 ne comporte qu'une question. L'ajout d'autres questions relève de 4.12.
- Blind hunter, liste entièrement chargée : `low`, non retenu ; aucune dégradation mesurée ni historique problématique démontré, et une pagination d'interface ajouterait une surface hors correction directe.
- Blind hunter, réponse déjà enregistrée non relisible : `false` comme écart de 4.10 ; la réouverture détaillée est explicitement réservée à 4.11.
- Blind hunter, catégorie de fixture non supprimée : `low`, non retenu ; cas d'une base sans catégorie, sans incidence sur l'isolation ou la génération. Un nettoyage doit aussi gérer les autres suites parallèles pouvant utiliser cette catégorie ; pas une correction directe isolée.
- Blind hunter, conversations de fixture persistantes : `low`, non retenu ; comportement documenté, comptes de test uniquement et purge après expiration. Ne pas ajouter de voie privilégiée de suppression hors périmètre.
- Blind hunter, expiration non évaluée : `false` pour le défaut annoncé de validation ; le script SQL a été exécuté avec succès par Dylan avant la revue. Son absence du runner est traitée séparément ci-dessous.
- Blind hunter, parcours manuel en attente : `false` comme défaut de code ; évaluation volontairement suspendue par Dylan pour faire cette revue.
- Blind hunter, dix questions S8-1 non consignées : `false` comme défaut de code ; évaluation utilisateur encore requise et aucune clôture annoncée.
- Blind hunter, Cron existant mal configuré : `false` pour l'installation vérifiée ; Dylan a confirmé la tâche active avec `0 3 * * *`.
- Verification gap, expiration non automatisée : `low`, non retenu ; le scénario comportemental existe et a été exécuté. Son automatisation demanderait un canal SQL privilégié absent du runner membre ; pas de fuite démontrée.
- Verification gap, purge non automatisée : `low`, non retenu ; le script exécuté vérifie déjà suppression en cascade et préservation de l'actif. Même besoin de canal privilégié, sans défaut de purge démontré.

Bilan : deux groupes `patch`, aucun `decision-needed`, aucun `defer`, onze constats écartés. Trois constats retenus au total : R1 constaté directement, et deux signalements identiques regroupés en R2 (blind hunter et edge-case hunter).

### Acceptation finale — 2026-11-07

Dylan confirme que les scénarios dédiés de la liste des conversations sont validés. La story passe à `done`. L'évaluation globale IA (7/10 réponses correctes, deux abstentions respectées, aucune fuite) reste une amélioration à poursuivre au niveau de l'epic.
