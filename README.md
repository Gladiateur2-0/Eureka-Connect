# EUREKA Connect — KEP Congo

Annuaire digital intelligent de **KEP Congo** : prototype statique
(HTML/CSS/JS, sans back-end) avec connexion obligatoire, deux rôles
(utilisateur / administrateur) et base locale au navigateur (IndexedDB).

## Démarrer
1. Hébergez le dossier en HTTPS (ou testez en local : `python3 -m http.server`
   puis http://localhost:8000). Le hachage des mots de passe et le mode PWA
   nécessitent HTTPS ou localhost.
2. Connectez-vous avec un compte de test (voir `docs/AUTHENTIFICATION.md`) :
   - Administrateur : `admin.kep` / `KepAdmin@2026`
   - Utilisateur : `user.kep` / `KepUser@2026`
3. Créez vos vrais comptes dans Administration → Comptes d'accès, puis
   supprimez les comptes de test.

## Ce qui change dans cette version
- **Écran de connexion** à l'ouverture, onglets Utilisateur / Administrateur.
- **Administrateur** : ajoute (bouton « Nouveau collaborateur » sur l'accueil),
  modifie et retire des collaborateurs, importe le fichier Excel
  **Personnel KEP CONGO**, crée des comptes utilisateurs et administrateurs.
- **Sur chaque fiche (tous les comptes)** : « Télécharger le vcf » (fichier
  .vcf de l'agent) puis « Ajouter » (ouvre la fiche dans l'app Contacts du
  téléphone pour l'enregistrer).
- **En bas de l'annuaire (tous les comptes)** : « Télécharger le vcf » global,
  un seul fichier .vcf avec tous les agents enregistrés.
- **Logo (administrateur uniquement)** : Administration → « Logo et nom de
  l'entreprise » → Télécharger un nouveau logo / Retirer le logo ; ou clic
  direct sur le cadre du logo en haut à gauche.
- Écran de connexion avec le logo EUREKA Connect (`icons/logo-connexion.png`).
- Client **KEP Congo** partout (plus aucune référence CFAO), badge « MVP » retiré.
- En-tête : logo client agrandi (84 px) à gauche, « EUREKA Connect /
  Annuaire digital intelligent » juste à côté.
- **Agents réels de KEP** (10 fiches issues des cartes de visite) chargés
  d'office ; les anciens agents fictifs sont retirés automatiquement des
  appareils déjà utilisés, sans toucher aux ajouts manuels.

## Structure
```
eureka-connect/
├── index.html, app.js, styles.css, sw.js, manifest.json
├── icons/                          Icônes PWA
├── data/employees.json             10 agents KEP (cartes de visite)
├── downloads/Personnel KEP CONGO.xlsx   les mêmes 10 agents (modèle d'import)
├── supabase/schema.sql             Schéma de la future version serveur
└── docs/                           AUTHENTIFICATION, IMPORT_EXCEL, DATABASE, …
```

## À savoir
La base (collaborateurs **et comptes**) est propre à chaque navigateur. Pour
équiper un autre appareil : Administration → Sauvegarder la base, puis
Restaurer une sauvegarde sur l'autre appareil. Les limites de sécurité de ce
fonctionnement sans serveur sont détaillées dans `docs/AUTHENTIFICATION.md`.
