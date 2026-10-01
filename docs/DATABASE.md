# EUREKA Connect — Base de données locale (prototype)

Ce document décrit le fonctionnement du prototype actuel. Il est
complémentaire à `ARCHITECTURE.md` et `schema.sql`, qui décrivent la base
**Supabase/PostgreSQL partagée** prévue pour la mise en production — les deux
ne sont pas la même chose.

## Le principe : la base locale est la source de vérité

Depuis cette version, l'annuaire ne recharge plus le fichier
`data/employees.json` à chaque visite. Au tout premier lancement sur un
appareil, ce fichier sert uniquement à **amorcer** une base locale
(IndexedDB, une vraie base de données intégrée au navigateur — pas un simple
fichier). Ensuite, cette base devient la seule source consultée :

```
Premier lancement :  data/employees.json → copié dans IndexedDB
Lancements suivants : IndexedDB lu directement, employees.json ignoré
```

Toutes les actions — ajout manuel, modification, suppression, import
Excel/CSV, upload de photo — écrivent directement dans cette base.

## Pourquoi IndexedDB et pas `localStorage`

L'ancienne version stockait tout dans `localStorage`, limité à environ 5 à
10 Mo au total et pas conçu pour de gros volumes (photos incluses).
IndexedDB n'a pas cette limite pratique et est fait pour ça. Les photos
collaborateur (redimensionnées côté client avant stockage, ~320 px / JPEG)
y trouvent naturellement leur place.

## Import Excel/CSV : fusion, pas remplacement

Avant, importer un fichier remplaçait **toute** la base — au risque
d'écraser des modifications manuelles ou des photos. Désormais, chaque ligne
importée est comparée à la base existante :

1. **Par matricule** si la colonne est renseignée (clé la plus fiable) ;
2. sinon **par email** ;
3. si aucun des deux n'existe dans la ligne importée, elle est **toujours
   ajoutée comme nouvelle fiche** (aucune correspondance possible).

Une correspondance trouvée = la fiche existante est **mise à jour** (la
photo déjà présente est conservée, un import Excel/CSV n'en transportant
jamais). Aucune correspondance = **nouvelle fiche ajoutée**. Avant
d'appliquer quoi que ce soit, un résumé s'affiche : *« X mis à jour, Y
ajoutés »*.

**Conséquence pratique :** on peut réimporter un extrait RH partiel (juste
les nouveaux arrivants, par exemple) sans jamais risquer d'effacer le reste
de l'annuaire.

## Sauvegarde et restauration manuelles

La base est **propre à un seul navigateur, sur un seul appareil**. Ce n'est
pas un partage automatique entre les téléphones de plusieurs employés — pour
ça, il faut la vraie base partagée décrite dans `ARCHITECTURE.md` (Sprint 1
de la roadmap).

En attendant, deux boutons dans l'admin permettent de faire vivre cette base
de façon autonome :

- **Sauvegarder la base** : télécharge un fichier `.json` contenant tous les
  collaborateurs (matricule, photo, coordonnées) et le branding client. À
  conserver précieusement — c'est la seule copie en dehors du navigateur.
- **Restaurer une sauvegarde** : recharge ce fichier, par exemple après un
  changement de téléphone, une réinstallation du navigateur, ou pour donner
  la même base de départ à un autre poste.

**Recommandation :** faites une sauvegarde après chaque session
d'administration importante (gros import, plusieurs ajouts manuels), et
conservez le fichier hors du navigateur (email à vous-même, clé USB, dossier
partagé interne).

## Ce que ça ne remplace pas

Ce modèle local évite de dépendre d'un ré-import Excel à chaque mise à jour
et permet une vraie saisie manuelle persistante — mais reste un prototype
mono-appareil. Pour que l'admin RH mette à jour l'annuaire une fois et que
**tous** les employés le voient automatiquement, la base partagée
(`ARCHITECTURE.md`, `schema.sql`, Sprint 1 de `ROADMAP.md`) reste
l'étape suivante nécessaire.
