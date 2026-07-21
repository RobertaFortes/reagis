# Modélisation MongoDB — Réagis

4 collections : `User`, `Session`, `Question`, `Vote`.

## User

Authentification du présentateur uniquement pour le MVP.
Le champ `role` prépare l'évolution future (compte participant).

## Session

Machine à états (`draft` → `active` → `finished`), code d'accès unique,
réaction configurable par le présentateur.

## Question

Options embarquées (sous-documents) car toujours lues ensemble avec la question.
Compteur de votes dénormalisé, incrémenté avec `$inc` (opération atomique MongoDB) —
garantit l'exactitude même sous vote concurrent.

## Vote

Collection séparée (pas embarquée) car pourrait croître sans limite.
Index unique composé sur `{ question, participantToken }` et `{ question, user }` :
**la base de données elle-même** garantit un seul vote par participant par question,
sans race condition possible même sous forte charge concurrente.

Voir le code source dans `apps/back/src/models/` pour l'implémentation complète et commentée.

## Décision clé à présenter au jury

> "La base garantit l'unicité du vote via un index, pas l'application — donc même avec
> plusieurs requêtes simultanées sur la même question, MongoDB rejette les doublons
> avant qu'ils n'atteignent la logique métier."
