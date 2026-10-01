# EUREKA Connect — Connexion et rôles

## Deux espaces
| | Utilisateur | Administrateur |
|---|---|---|
| Rechercher, filtrer, appeler, écrire | oui | oui |
| Télécharger le vcf d'un agent / « Ajouter » au téléphone | oui | oui |
| Télécharger le vcf global (tous les agents) | oui | oui |
| Ajouter / modifier / retirer un collaborateur (depuis l'accueil) | non | oui |
| Importer « Personnel KEP CONGO.xlsx », import/export CSV | non | oui |
| Créer des comptes utilisateurs et administrateurs | non | oui |
| Changer / retirer le logo, nom de l'entreprise | non | oui |
| Sauvegarde / restauration | non | oui |

L'écran de connexion s'affiche à chaque ouverture (session limitée à
l'onglet / l'application, 12 h maximum). Un compte administrateur peut aussi
se connecter via l'onglet « Utilisateur » pour voir l'annuaire comme un
collaborateur ; un compte utilisateur est refusé sur l'onglet « Administrateur ».

## Comptes de test (créés au premier lancement)
| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin.kep` | `KepAdmin@2026` |
| Utilisateur | `user.kep` | `KepUser@2026` |

**Avant toute utilisation réelle :** créez votre propre compte administrateur,
reconnectez-vous avec, puis supprimez les deux comptes de test (ou changez
leurs mots de passe via l'icône clé).

## Protection des mots de passe
- Mots de passe hachés PBKDF2-SHA256 (150 000 itérations, sel aléatoire par
  compte) ; ils ne sont jamais stockés ni exportés en clair.
- 5 essais ratés → connexion bloquée 60 secondes.
- Il reste toujours au moins un administrateur ; on ne peut pas supprimer
  son propre compte.

## Limite importante de ce prototype
Sans serveur, la vérification se fait **dans le navigateur**. C'est une vraie
barrière pour un usage courant, mais pas une sécurité forte : une personne
technique ayant accès à l'appareil peut contourner l'écran avec les outils
développeur, et les fichiers statiques (dont `data/employees.json`) restent
téléchargeables par quiconque connaît l'URL. De plus, les comptes vivent dans
la base locale de chaque appareil : un compte créé sur le poste de
l'administrateur n'existe sur un autre appareil qu'après « Restaurer une
sauvegarde ».

Pour des données réelles, il faut la version serveur prévue au Sprint 1 de
`ROADMAP.md` (Supabase Auth + Row Level Security, `supabase/schema.sql`) ou,
a minima, une protection par mot de passe au niveau de l'hébergeur.
