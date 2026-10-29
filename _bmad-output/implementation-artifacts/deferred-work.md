- source_spec: `_bmad-output/implementation-artifacts/1-1-voir-la-page-d-accueil-de-nexamind.md`
  summary: Implémenter les destinations des liens d'inscription et de connexion.
  evidence: La page expose `/signup` et `/login`, mais aucun fichier de route correspondant n'existe dans `src/app` ; la story 1.1 réserve ces parcours aux stories suivantes.
- source_spec: `_bmad-output/implementation-artifacts/1-1-voir-la-page-d-accueil-de-nexamind.md`
  summary: Clarifier que la connexion est autorisée sans session dans le contexte de l'Epic 1.
  evidence: Le contexte compilé indique que seule la création de compte est permise sans session, alors que la story 1.3 couvre la connexion ; corriger cette ambiguïté avant son implémentation.
- source_spec: `_bmad-output/implementation-artifacts/1-1-voir-la-page-d-accueil-de-nexamind.md`
  summary: Ajouter un test de régression automatisé pour le contenu et le responsive de la page d'accueil.
  evidence: Le dépôt ne fournit pas de script ni de cadre de test d'interface ; la page a été vérifiée manuellement à 375 px et 1280 px, mais un test navigateur durable nécessitera le choix et l'intégration d'un outil.
