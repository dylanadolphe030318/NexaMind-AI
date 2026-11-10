---
title: Stabiliser le test de connexion sur le réseau local
type: bugfix
created: 2026-11-10
status: in-review
route: oneshot
---

<frozen-after-approval>

## Intent

Diagnostiquer et corriger le problème de connexion mobile signalé sur Android
Chrome, sans changer l'authentification ni conserver les mots de passe dans le
stockage du navigateur. Corriger le blocage démontré des connexions de
développement pour l'adresse Wi-Fi actuelle, avec une autorisation exacte et
sans joker. Vérifier la connexion de développement et la conservation des champs
avec des valeurs fictives, sans annoncer que le téléphone réel a été testé.
Expliquer le HTTPS local avec un certificat couvrant l'adresse IP et reconnu
sur Android, sans tunnel public, installation automatique d'autorité de
certification, modification Supabase ou désactivation des vérifications TLS.
Laisser les modifications documentaires préexistantes intactes.

</frozen-after-approval>

## Implementation Notes

- Journal Next.js : requête `/_next/hmr` bloquée pour `192.168.1.180`.
  Reproduit dans le navigateur intégré : échec du handshake WebSocket.
- Formulaire sans logique d'effacement pendant la saisie ; essai fictif à
  390 pixels conserve les deux valeurs pendant six secondes malgré le blocage.
  La causalité complète du symptôme Android reste à confirmer.
- Guides installés lus : `allowedDevOrigins`, CLI HTTPS et Fast Refresh.
  `mkcert` non disponible ; fournir une procédure, ne pas installer.
- Modification minimale : autoriser uniquement l'hôte local dans
  `next.config.ts`, ajouter un test ciblé et documenter le redémarrage,
  le certificat Android et la protection des clés dans `README.md`.
- Correctif appliqué et relecture directe : autorisation exacte, aucun joker
  ni changement de formulaire, de cookie, de session ou de droit. Procédure
  HTTPS fondée sur le guide CLI Next.js installé et la documentation officielle
  mkcert ; elle distingue certificat public et clés privées, installation de
  confiance et retrait après test. Rien n'est installé ou exposé automatiquement.
- Vérification : quatre tests de `dashboard-assistant-navigation.test.mjs`
  réussis, `tsc --noEmit`, ESLint ciblé et `git diff --check` sans erreur.
- Navigateur sur l'adresse réseau après rechargement de configuration :
  cinq trames WebSocket reçues, aucune erreur de socket ; adresse et mot de
  passe fictifs conservés trente secondes, changement de focus et de hauteur
  de fenêtre inclus. Aucun identifiant réel envoyé.
- Restent à vérifier : saisie et clavier Android réels, installation volontaire
  des certificats et parcours HTTPS sur téléphone. Aucun diagnostic définitif
  d'effacement des champs ni validation de story n'est annoncé. Pas de modification
  des stories standard ou IA. Aucun paquet installé.
