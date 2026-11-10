# Contrôles dans le navigateur — backlog standard

À exécuter après développement, pas pendant cette préparation. Ce lot n'est pas un sprint et ne remplace aucun contrôle du sprint IA.

**Objectif du lot :** ouvrir facilement l'assistant depuis le tableau de bord et retrouver les bons passages de ressources, sans exposer de contenu interdit.

**Ordre :** story 1.6, puis story 3.5. Les deux fiches sont prêtes pour une future demande de développement ; rien n'est développé par cette préparation.

**Reprise autorisée le 2026-11-10 :** vérifier uniquement Q1–Q8 sur le projet
actuel, après application de la nouvelle migration de présélection et livraison
du code. Noter le résultat partiel sur huit cas ; Q9/Q10 restent « non vérifiées ».
Cela ne valide pas le protocole complet ni la story. La liste hybride est
désormais filtrée et réordonnée côté serveur par le LLM parmi vingt candidats
accessibles au maximum ; cinq passages au maximum sont affichés, ou aucun.

| Repère | Manipulation | Résultat attendu |
|---|---|---|
| STD-1 — accès | Se connecter comme membre, ouvrir le tableau de bord et choisir « Assistant » ; recommencer comme responsable. | La page existante de l'assistant s'ouvre sans saisir l'URL et sans génération automatique. |
| STD-2 — clavier/mobile | Atteindre le lien avec Tab puis Entrée ; vérifier sur écran étroit. | Lien visible, focus perceptible, utilisation sans souris et sans débordement gênant. |
| STD-3 — session | Se déconnecter, ouvrir `/assistant` ; se reconnecter et essayer les autres liens et la déconnexion. | Connexion requise ; navigation existante inchangée. |
| STD-4 — ressources | Sur `/resources/search`, saisir Q1, Q3 puis Q5 exactement comme dans le fichier de test ; regarder uniquement « Passages trouvés par le sens » et ouvrir la ressource attendue. | Noter le rang du passage, vérifier que le document explique la réponse. Source attendue parmi les trois premiers passages affichés, sans regrouper les passages d'une même ressource. |
| STD-5 — comparaison | Rejouer les dix cas ; noter conformité, titre, rang ou absence et preuve. | Au moins 8 cas conformes selon la grille ci-dessous, avec droits vérifiés sans fuite. Comparaison avant/après sur les mêmes données ; résultats littéraux et phrase sélectionnée exclus du score de classement. |
| STD-6 — droits et erreurs | Vérifier recherche vide, erreurs/quota quand reproductibles et exclusion d'une ressource réellement inaccessible dans un jeu autorisé. | Message compréhensible, aucun titre ni extrait interdit. Les tests RLS complètent la démonstration ; un document absent ne prouve pas l'absence de fuite. |

## Documents attendus pour STD-4

- **Q1** : « Quelle technologie est prévue pour l'interface et quels services sont confiés à Supabase ? » → document Architecture 1.
- **Q3** : « Comment le PRD définit-il le RAG ? » → document Vérification avec une IA, glossaire du PRD.
- **Q5** : « Lors du test de la story 3.1, que s'est-il passé quand la recherche était vide ? » → document Retour de test sprint 3.

Les dix questions et les noms complets de leurs sources restent dans [tests-ia.md](../../../tests-ia.md), inchangé par cette préparation.

## Grille des dix cas — liste hybride uniquement

Utiliser exactement les dix questions du fichier de test, sans les reformuler.
Les ressources Q1–Q6 doivent être présentes, accessibles et préparées avant de
commencer. Ne pas juger la réponse de l'assistant sur cette page de recherche.

| Question | Ce qui donne un point |
|---|---|
| Q1 | Passage du document Architecture 1 dans les trois premiers, permettant de vérifier interface et services Supabase. |
| Q2 | Passage du PRD dans les trois premiers, permettant de vérifier titre, contenu et catégorie. |
| Q3 | Passage du glossaire du PRD dans les trois premiers, permettant de vérifier la définition du RAG. |
| Q4 | Passage du PRD dans les trois premiers, permettant de vérifier le comportement si l'information manque. |
| Q5 | Passage du Retour de test sprint 3 dans les trois premiers, permettant de vérifier le cas de recherche vide. |
| Q6 | Passage du Retour de test sprint 4 dans les trois premiers, permettant de vérifier le problème de répétition. |
| Q7 | Aucun passage pertinent affiché ; message d'absence de passage. Aucune réponse générée exigée. |
| Q8 | Même contrôle d'absence de passage pour l'autre question hors sujet. |
| Q9 | Aucun titre, extrait, lien ou contenu du document d'hypothèses réellement inaccessible, y compris dans la phrase sélectionnée. |
| Q10 | Même exclusion pour le document de correction supplémentaire réellement inaccessible. |

**Calcul :** un point par cas conforme, au moins 8 sur 10. C'est une note de
conformité globale, pas « huit ressources retrouvées ». Les cases non vérifiées
ne sont pas des succès. Une erreur de requête ne compte pas comme un résultat
vide correct.

**Sécurité obligatoire :** Q9 et Q10 doivent être vérifiées sans fuite.
Toute fuite bloque la validation, même avec 9/10. Ne pas confondre une ressource
absente et une ressource réellement interdite. Les membres du même workspace
peuvent lire les ressources des autres : changer de propriétaire ne crée pas
un cas interdit. Le développeur doit fournir un jeu autorisé et les preuves
techniques nécessaires ; ne pas créer un second espace dans le MVP ou modifier
les politiques pour fabriquer le test. Sans ce prérequis, noter « non vérifié »
et suspendre la validation, plutôt que déclarer les droits réussis.

Conserver pour chaque cas le résultat, le rang si applicable et une preuve sans
secret. Les tests automatisés complètent les contrôles du navigateur ; les 12 tests
sémantiques réussis après le correctif SQL ne constituent pas une note de qualité
sur ces dix questions.
