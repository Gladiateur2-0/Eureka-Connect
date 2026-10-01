# EUREKA Connect — Système de design

Ce document explique les choix de la refonte visuelle, pour que toute
évolution future reste cohérente avec l'existant.

## Pourquoi ces choix

EUREKA Connect est un outil interne consulté plusieurs fois par jour par des
commerciaux, techniciens et responsables de KEP Congo —
souvent depuis un téléphone, entre deux rendez-vous. La priorité n'est donc
pas l'effet visuel mais la **rapidité de lecture** et la **clarté des
actions** : on doit pouvoir trouver un numéro et appeler en deux gestes.

Le bleu marine existant (identité de la marque) est conservé et affiné plutôt que
remplacé, pour ne pas repartir de zéro sur une marque déjà en place.

## Couleurs

| Rôle | Valeur | Usage |
|---|---|---|
| `--navy-950` | `#081C33` | Fond d'en-tête (dégradé, point le plus sombre) |
| `--navy-800` | `#0E355A` | Couleur de marque principale (boutons primaires, icône app) |
| `--accent-600` | `#1C6FD1` | Action/lien, focus, état actif — **seule** couleur d'accent interactive |
| `--ink-900` / `--ink-600` / `--ink-400` | `#10192B` / `#4A5568` / `#8993A4` | Texte principal / secondaire / discret |
| `--paper-0` / `--paper-50` | `#FFFFFF` / `#F4F6F9` | Surfaces (cartes) / fond de page |
| `--line-200` / `--line-300` | `#E3E7EE` / `#D3D9E3` | Bordures et séparateurs |
| `--danger-600` | `#C7362B` | Actions destructives (Réinitialiser, Supprimer) |
| `--success-600` | `#157A5C` | Réservé aux avatars (variété, pas une action) |

**Palette avatars** (6 teintes dérivées du nom, pour repérer visuellement une
longue liste sans devenir un arc-en-ciel) : navy, accent, vert, terre cuite,
violet ardoise, sarcelle.

## Typographie

- **Sora** (600/700) pour les titres — géométrique, technique, en phase avec
  un secteur automobile/mobilité, sans être froid.
- **Inter** (400–700) pour tout le reste — excellente lisibilité à petite
  taille, essentiel pour une liste dense consultée sur mobile.

## Icônes

Un seul jeu d'icônes SVG maison (trait 1.75px, angles arrondis, grille
24×24) remplace tous les emojis. Raison : un emoji s'affiche différemment
selon l'OS (Windows/iOS/Android rendent 📞 très différemment), ce qui nuit à
la cohérence visuelle ; un SVG maison rend identiquement partout, y compris
hors connexion.

Les icônes sont injectées via `data-icon="nom"` + `applyIcons()` (contenu
statique) ou directement via `icon('nom')` dans le HTML généré (cartes,
tableau admin).

## Principes d'interaction

- Un seul accent interactif (`--accent-600`) : le bleu de marque (navy)
  structure la page, le bleu accent signale « on peut cliquer ici ».
- Chaque élément interactif a un état hover, un état actif (léger
  enfoncement), et un anneau de focus visible au clavier.
- Les cartes collaborateurs ne « décollent » pas au survol (pas d'ombre
  animée) : seule leur bordure s'accentue légèrement. Le mouvement est
  réservé à ce qui répond réellement à une action (ouverture du panneau
  admin, retour d'un bouton pressé), jamais décoratif.
- `prefers-reduced-motion` est respecté : toutes les transitions sont
  neutralisées pour les personnes qui le demandent.
- Hiérarchie claire des boutons : un seul bouton plein (primaire) par
  carte/formulaire, les actions secondaires sont en contour, les actions
  destructrices sont en contour rouge — jamais visuellement confondues.

## Où retoucher quoi

Tous les tokens sont des variables CSS dans `:root` en haut de `styles.css`.
Changer une couleur de marque ne demande qu'une seule modification à cet
endroit ; le reste de la feuille de style s'appuie exclusivement sur ces
variables (aucune couleur codée en dur ailleurs, hors avatars).
