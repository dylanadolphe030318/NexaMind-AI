## Deferred from: code review of story 1-1 (2026-10-29)

- Les liens d'inscription et de connexion de `src/app/page.tsx` mènent à des routes absentes. Corriger lors des stories 1.2 et 1.3, qui implémentent ces parcours. Motif du report : les routes d'inscription et de connexion font partie des stories 1.2 et 1.3, pas de la story d'accueil.

## Deferred from: code review of story 1-2-créer-un-compte-membre (2026-10-29)

- Le lien « Se connecter » de `src/app/signup/page.tsx` mène à `/login`, route qui sera créée dans la story 1.3.
- Avant le déploiement, documenter dans `README.md` la configuration de **Authentication → URL Configuration** afin que le **Site URL** Supabase pointe vers l’URL de l’application et que les liens de confirmation d’e-mail ne renvoient pas vers localhost.

## Deferred from: code review des stories 1.1–1.2 (2026-10-29)

- Avant l’ouverture des inscriptions publiques, provisionner par une opération de confiance un profil responsable initial lié à l’espace de travail. La migration crée l’espace, mais son déclencheur attribue uniquement le rôle `membre`.

## Deferred from: code review de story 4.2 (2026-11-03)

- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Définir un budget et des quotas avant tout usage réel de l'API OpenAI.
  evidence: La story laisse explicitement ces limites à Dylan; aucun plafond opérationnel n'est configuré.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Vérifier le schéma de l'extension pgvector avant d'appliquer la migration en production.
  evidence: La migration référence `extensions.vector`; le schéma de l'extension déjà installée dans le projet Supabase cible n'a pas été vérifié.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Tester la migration d'embeddings sur une base contenant des passages pré-4.2.
  evidence: Aucun harnais local de migrations n'est disponible; le test d'intégration distant n'a pas été exécuté.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Définir le comportement si l'enregistrement de l'état « en échec » échoue lui-même.
  evidence: Une indisponibilité SQL pendant `mark_resource_failed` peut laisser la ressource en `processing`; la persistance est impossible tant que la base ne répond pas.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Définir le budget et le plafond d'usage OpenAI avant l'envoi de ressources réelles.
  evidence: La génération d'embeddings n'a pas de quota applicatif ; le propriétaire du projet doit définir la limite côté fournisseur avant un usage réel.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Vérifier la durée maximale des fonctions serveur du déploiement par rapport au délai de 30 secondes du fournisseur.
  evidence: Le plan de déploiement et sa limite d'exécution ne sont pas définis dans le dépôt.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Définir une procédure de récupération pour les ressources si Supabase est indisponible lors du marquage d'un échec.
  evidence: Le serveur journalise l'erreur, mais la ressource peut rester en `processing` si la base ne peut pas enregistrer `failed`.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Afficher à l'utilisateur l'échec d'indexation après la sauvegarde, avec l'état et la relance prévus en story 4.3.
  evidence: La story 4.2 persiste l'état `failed` et le journalise ; l'interface d'état et de relance appartient à la story 4.3.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Appliquer la migration d'embeddings et exécuter les tests d'intégration RLS sur Supabase.
  evidence: La migration 4.2 et les assertions d'intégration ne peuvent être vérifiées tant que Dylan ne l'a pas appliquée au projet Supabase.
- source_spec: `_bmad-output/implementation-artifacts/4-2-créer-et-enregistrer-les-embeddings.md`
  summary: Vérifier le traitement des passages historiques sans embeddings avec une migration sur une base de test.
  evidence: Aucun harnais local de migrations n'est disponible pour tester le backfill des passages pré-4.2.
- source_spec: `_bmad-output/implementation-artifacts/4-3-suivre-l-état-de-préparation-d-une-ressource.md`
  summary: Définir comment récupérer les ressources laissées en préparation après une interruption brutale du traitement.
  evidence: `begin_resource_reindexing` met la ressource en `processing` avant l'indexation; un processus interrompu peut ne jamais la marquer `failed`, et aucun mécanisme de récupération n'est prévu.
- source_spec: `_bmad-output/implementation-artifacts/4-3-suivre-l-état-de-préparation-d-une-ressource.md`
  summary: Vérifier les parcours visuels Story 4.3 et exécuter les tests Supabase sur un environnement de test.
  evidence: Les tests unitaires et le build ne valident pas l'affichage navigateur ni l'intégration RLS; la migration doit être appliquée en environnement de test avant exécution.
