# Import Excel — EUREKA Connect (KEP Congo)

Le fichier de référence est **`downloads/Personnel KEP CONGO.xlsx`** (onglet
« Personnel », colonnes : Matricule, Nom, Prénom, Fonction, Service, Site,
Email, Téléphone, Société). Sites attendus : **PNR**, **BZV** ou **Bondji**
(« Pointe-Noire » et « Brazzaville » sont aussi reconnus et convertis).
L'import est réservé aux **administrateurs** : Administration → Importer Excel.

Le fichier livré contient les **10 agents de KEP** issus des cartes de
visite (`Carte_de_visite_KEP_V3.5.pub`). Ces mêmes agents sont chargés
automatiquement dans l'annuaire (`data/employees.json`). Pour ajouter ou
modifier des agents, complétez ce fichier (matricules en jaune à renseigner)
puis réimportez-le : les agents existants sont mis à jour, les nouveaux ajoutés.
Colonnes informatives non importées : Téléphone bureau, Autres numéros, Adresse
(le bureau et l'adresse sont toutefois inclus dans les fiches vcf).

Colonnes reconnues automatiquement (l'ordre des colonnes n'a pas d'importance) :
- **Matricule** / Matricule RH / N° Matricule / Numéro matricule / Mat / Code agent
  — et, à défaut, toute colonne dont le titre contient « matricule »
- Société / Societe / Entreprise
- Lieux / Lieu / Site
- Nom
- Prénom / Prenom
- Service / Département
- Poste / Fonction
- Email
- Numéro / Numero / Téléphone

## Comment un agent importé est rattaché à l'annuaire

Chaque ligne est comparée aux fiches déjà présentes, dans cet ordre :
1. même **matricule** ;
2. sinon même **email** ;
3. sinon même **nom + prénom**.

- Fiche trouvée : elle est **complétée/mise à jour** (envoyer un Excel avec les
  matricules remplit donc le matricule des agents déjà présents, sans doublon).
  Une cellule vide **n'efface jamais** une information déjà saisie.
- Aucune fiche trouvée : un **nouvel agent** est ajouté.
- Deux personnes de matricules différents ne sont jamais fusionnées.

Avant validation, un résumé indique : fiches mises à jour, agents ajoutés, et
**pour combien d'agents le matricule a été reconnu** (si ce nombre est 0 alors
que votre fichier en contient, l'intitulé de la colonne n'est pas reconnu).

## Agent qui quitte l'entreprise

Un bouton corbeille figure sur chaque fiche (et dans le tableau
d'administration). ⚠️ Si l'agent figure encore dans un ancien fichier Excel,
un nouvel import le recréera : pensez à le retirer aussi du fichier source.

Les données restent enregistrées localement dans ce navigateur (voir
`DATABASE.md`). En production, l'import sera envoyé à la base sécurisée et
soumis aux droits Admin.
