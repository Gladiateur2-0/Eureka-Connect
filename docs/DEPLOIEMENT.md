# EUREKA Connect — préparation au déploiement

## Prototype actuel
- Annuaire responsive
- Recherche et filtres
- Appel / email
- vCard dynamique
- Connexion obligatoire (utilisateur / administrateur)
- Back-office local : ajout, modification, suppression, comptes d'accès
- Import / export CSV
- Persistance locale navigateur
- Manifest PWA

## Pour mise en production
1. Hébergement HTTPS sur URL temporaire.
2. Base PostgreSQL/Supabase.
3. Authentification SSO ou email professionnel.
4. Rôles : Utilisateur, Administrateur.
5. Import XLSX/CSV côté serveur.
6. Journal d'audit et sauvegardes.
7. Politique de confidentialité et validation des données affichées.
8. Connexion du domaine définitif lorsqu'il sera disponible.

Le prototype ne doit pas être exposé publiquement avec des données collaborateurs réelles sans contrôle d'accès.
