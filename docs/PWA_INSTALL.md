# EUREKA Connect V6 — Installation mobile

## Android
Lorsque l'application est servie en HTTPS, Chrome/Edge peut proposer « Installer ».
Le bouton Installer apparaît automatiquement lorsque le navigateur autorise l'installation PWA.

## iPhone / iPad
Safari ne déclenche pas le même bouton automatique.
EUREKA Connect affiche une aide :
1. toucher Partager ;
2. choisir « Ajouter à l’écran d’accueil » ;
3. confirmer.

## Navigation mobile
Barre inférieure :
- Accueil
- Annuaire
- Recherche
- Admin (administrateurs) / Quitter (utilisateurs)

## Mode hors ligne
Le service worker met en cache les principaux fichiers de l'application.
L'annuaire peut continuer à s'ouvrir avec les données déjà chargées, sous réserve des politiques du navigateur.

## Important
Les fonctions PWA complètes exigent un hébergement HTTPS.
Le simple double-clic sur index.html ne permet pas au service worker de fonctionner.
