# EUREKA Connect — Architecture de production

## 1. Espaces
### Collaborateur
- Connexion sécurisée
- Recherche plein texte
- Filtres Service / Site
- Fiche collaborateur
- Appel / email
- Téléchargement vCard

### Admin KEP
- Tableau de bord
- Import XLSX / CSV
- Ajouter / modifier / désactiver un collaborateur
- Contrôle des doublons
- Export
- Historique des changements

### Super Admin
- Gestion des administrateurs
- Paramètres de l'organisation
- Branding
- Journal d'audit
- Préparation multi-entreprises

## 2. Stack recommandée
- Front-end : Next.js / React, PWA
- Base : PostgreSQL via Supabase
- Auth : Supabase Auth ou SSO Microsoft Entra ID
- Stockage : photos collaborateurs
- Hébergement : Vercel ou infrastructure validée par KEP Congo
- HTTPS obligatoire

## 3. Sécurité
- Aucun annuaire réel exposé publiquement
- Row Level Security
- Rôles employee/admin/super_admin
- Désactivation plutôt que suppression définitive en production
- Journal d'audit
- Sauvegardes
- Validation de la politique interne de protection des données

## 4. Domaine
Le prototype peut être publié sur une URL temporaire sécurisée.
Le domaine définitif pourra être branché ensuite sans migration des données.
