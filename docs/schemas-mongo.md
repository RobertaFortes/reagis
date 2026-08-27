# Modélisation MongoDB — Réagis

4 collections : `User`, `Session`, `Question`, `Vote`.
Code source : `apps/back/src/models/`.

---

## User

Authentification du présentateur uniquement pour le MVP.
Le champ `role` prépare l'évolution future (compte participant).

| Champ | Type | Requis | Contraintes | Default |
|-------|------|--------|-------------|---------|
| `email` | String | oui | unique, lowercase, trim | — |
| `password` | String | oui | hash bcrypt | — |
| `name` | String | oui | trim | — |
| `role` | String | non | enum: `presenter`, `participant` | `participant` |
| `createdAt` | Date | auto | timestamps | — |
| `updatedAt` | Date | auto | timestamps | — |

> Note : le signup force toujours `role: 'presenter'`, quel que soit le default du schema.

---

## Session

Machine à états (`draft` → `active` → `finished`), code d'accès unique,
réaction configurable par le présentateur.

| Champ | Type | Requis | Contraintes | Default |
|-------|------|--------|-------------|---------|
| `name` | String | oui | trim | — |
| `code` | String | oui | unique, uppercase | — |
| `presenter` | ObjectId | oui | ref: User | — |
| `status` | String | non | enum: `draft`, `active`, `finished` | `draft` |
| `reaction` | String | non | enum: `👍`, `❤️`, `🔥`, `👏` | `👍` |
| `reactionCount` | Number | non | — | `0` |
| `currentQuestionIndex` | Number | non | — | `0` |
| `startedAt` | Date | non | défini par `startSession` | — |
| `endedAt` | Date | non | défini par `endSession` | — |
| `createdAt` | Date | auto | timestamps | — |
| `updatedAt` | Date | auto | timestamps | — |

### Machine à états

```
draft ──[start]──► active ──[end]──► finished
```

Les transitions sont contrôlées par le backend (409 si état invalide, 403 si pas propriétaire).

---

## Question

Options embarquées (sous-documents) car toujours lues ensemble avec la question.
Compteur de votes dénormalisé, incrémenté avec `$inc` (opération atomique MongoDB).

### Sous-document : Option

| Champ | Type | Requis | Default |
|-------|------|--------|---------|
| `label` | String | oui | — |
| `votes` | Number | non | `0` |

### Document principal

| Champ | Type | Requis | Contraintes | Default |
|-------|------|--------|-------------|---------|
| `session` | ObjectId | oui | ref: Session | — |
| `text` | String | oui | trim | — |
| `order` | Number | oui | position dans la session (1-based) | — |
| `options` | [Option] | non | sous-documents embarqués | `[]` |
| `status` | String | non | enum: `pending`, `active`, `closed` | `pending` |
| `createdAt` | Date | auto | timestamps | — |
| `updatedAt` | Date | auto | timestamps | — |

### Index

- **Compound** : `{ session: 1, order: 1 }` — accélère les requêtes par session triées par position.

---

## Vote

Collection séparée (pas embarquée) car pourrait croître sans limite.
L'unicité du vote est garantie par des index partiels au niveau base de données.

| Champ | Type | Requis | Contraintes | Default |
|-------|------|--------|-------------|---------|
| `question` | ObjectId | oui | ref: Question | — |
| `participantToken` | String | non | identité anonyme (MVP) | — |
| `user` | ObjectId | non | ref: User (évolution future) | — |
| `optionIndex` | Number | oui | index de l'option choisie | — |
| `createdAt` | Date | auto | timestamps | — |
| `updatedAt` | Date | auto | timestamps | — |

### Validation

- **Pre-validate hook** : au moins un des deux champs `participantToken` ou `user` doit être présent.

### Index uniques partiels

```
{ question: 1, participantToken: 1 }   where participantToken $exists: true
{ question: 1, user: 1 }               where user $exists: true
```

Ces index garantissent **un seul vote par identité par question**, même sous requêtes concurrentes.
L'erreur MongoDB `11000` (duplicate key) est capturée par le contrôleur et renvoyée en HTTP 409.

---

## Décision clé à présenter au jury

> "La base garantit l'unicité du vote via un index, pas l'application — donc même avec
> plusieurs requêtes simultanées sur la même question, MongoDB rejette les doublons
> avant qu'ils n'atteignent la logique métier."

---

## Relations

```
User 1──────N Session 1──────N Question 1──────N Vote
                                    │
                                    └── options[] (sous-documents embarqués)
```
