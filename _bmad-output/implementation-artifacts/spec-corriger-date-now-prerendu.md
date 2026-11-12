---
title: Corriger la lecture de l'heure pendant le prerendu
type: bugfix
created: 2026-11-12
status: done
route: oneshot
---

<frozen-after-approval>

## Intent

Supprimer l'erreur Next.js `Date.now()` observee au chargement des pages
connectees. Attendre la requete utilisateur avant d'initialiser le client
Supabase serveur, dont l'authentification peut lire l'heure. Conserver les
sessions, les droits RLS, les pages et les traitements IA existants.
Ne pas desactiver Cache Components, modifier les dependances ou masquer l'erreur.

</frozen-after-approval>

## Implementation Notes

- Cause commune recherchee dans `src/lib/supabase/server.ts`, utilise par toutes
  les routes concernees. `cookies()` est deja attendu mais l'initialisation SDK
  et son authentification ne sont pas explicitement liees a une requete reelle.
- Le guide Next local `connection.md` recommande `await connection()` avant
  les operations non deterministes devant attendre une requete utilisateur.
  Ce choix convient au client de session ; aucun cache partage n'est ajoute.
- Empreinte prevue : helper serveur, test cible, enregistrement du test et
  cette fiche. Aucun effet irreversible ni question fonctionnelle ouverte.
- Verification : test du blocage avant initialisation, conservation de
  l'adaptateur cookies et des erreurs de configuration, TypeScript/lint/build,
  puis rechargement des routes connectees sans appel IA ni mutation.
- Les stories UI10 et IA9 restent en revue jusqu'a evaluation humaine.
- Correction : `await connection()` avant cookies et creation du SDK dans le
  helper partage. Les validations de configuration restent avant cette attente.
  Adaptateurs de lecture/ecriture cookies, session et politiques RLS inchanges.
- Deux tests nouveaux echouent avant la correction et passent apres : attente
  effective de la requete avant SDK, propagation d'une interruption sans SDK.
  Le premier teste aussi la conservation de l'adaptateur cookies.
- Verification ciblee : 6 tests reussis (helper et navigation), TypeScript,
  lint, build de production et `git diff --check` reussis.
- Navigateur authentifie : les 12 routes connectees (espace membre, categories,
  ressources/liste/recherche/historique/ajout/detail/modification/suppression,
  assistant/liste/detail) et les confirmations de suppression recherche et
  conversation ont ete rechargees sans nouvelle erreur console. Les huit
  navigations du second passage retournent HTTP 200 sans erreur JavaScript.
  Aucun formulaire soumis, appel IA ou changement des donnees.
- Visiteur sans cookies : GET dashboard redirige toujours vers login.
- Relecture directe du petit diff ; pas de revue multiagent. Aucune anomalie
  supplementaire identifiee. Aucun changement de fonctionnalite ni de cache
  partage ; Cache Components et Partial Prefetching restent actifs.
- 2026-11-12 : Dylan valide explicitement toute la refonte visuelle et ce
  correctif. Classement : complement technique de la correction de trajectoire
  CC-2026-11-11-UI hors sprint, pas une nouvelle story IA ni un nouveau sprint.
