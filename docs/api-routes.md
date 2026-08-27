# Référence API — Réagis

> Contrats REST de l'API backend (`apps/back`).
> Base URL : `http://localhost:4000` (développement).

---

## Enveloppes de réponse

L'API utilise **deux formats d'erreur distincts** selon le groupe de routes :

| Groupe | Succès | Erreur |
|--------|--------|--------|
| Auth (`/api/auth/*`) | `{ result: true, token?, user }` | `{ result: false, error: string }` |
| Toutes les autres | Document(s) JSON directement | `{ message: string }` |

---

## Authentification

Deux types de JWT coexistent :

| Type | Header | Secret | Expiration | Contenu du payload |
|------|--------|--------|------------|-------------------|
| Presenter | `Authorization: Bearer <token>` | `JWT_SECRET` | 1h | `{ userId, role }` |
| Participant | `Authorization: Bearer <token>` | `PARTICIPANT_JWT_SECRET` | 6h | `{ sessionId, participantToken }` |

---

## Auth

### POST `/api/auth/signup`

Créer un compte présentateur.

| | Détail |
|---|---|
| Auth | Aucune |
| Body | `{ email: string, password: string, name: string }` |
| Succès 201 | `{ result: true, user: { id, email, name, role } }` |
| Erreur 400 | `{ result: false, error: 'Tous les champs sont requis' }` |
| Erreur 409 | `{ result: false, error: 'Cet email est déjà utilisé' }` |

> Note : le rôle est toujours `'presenter'` (hardcodé).

### POST `/api/auth/login`

Authentifier un présentateur et obtenir un JWT.

| | Détail |
|---|---|
| Auth | Aucune |
| Body | `{ email: string, password: string }` |
| Succès 200 | `{ result: true, token: string, user: { id, email, name, role } }` |
| Erreur 400 | `{ result: false, error: 'Email et mot de passe requis' }` |
| Erreur 401 | `{ result: false, error: 'Identifiants invalides' }` |

---

## Sessions

### POST `/api/sessions`

Créer une nouvelle session de sondage.

| | Détail |
|---|---|
| Auth | ⚠️ Aucune (devrait être protégée) |
| Body | `{ name: string, code: string, presenter: string (ObjectId), reaction?: '👍'\|'❤️'\|'🔥'\|'👏' }` |
| Succès 201 | Document `Session` complet |
| Erreur 400 | `{ message: 'name, code et presenter sont obligatoires' }` |
| Erreur 409 | `{ message: 'Ce code de session existe déjà' }` |

> Note : le champ `presenter` est envoyé par le client. Idéalement, il devrait être extrait du JWT.

### GET `/api/sessions/my-sessions`

Lister les sessions du présentateur authentifié.

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | Aucun — l'identité vient du token |
| Succès 200 | `Session[]` |

### GET `/api/sessions/:id`

Récupérer une session par son ID MongoDB.

| | Détail |
|---|---|
| Auth | Aucune |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` |
| Erreur 404 | `{ message: 'Session introuvable' }` |

> Note : pas de validation `ObjectId.isValid()` sur ce endpoint.

### PATCH `/api/sessions/:id/start`

Démarrer une session (draft → active).

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`status: 'active'`, `startedAt` défini) |
| Erreur 403 | `{ message: 'Non autorisé' }` — pas le propriétaire |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session en brouillon peut être démarrée' }` |

### PATCH `/api/sessions/:id/end`

Terminer une session (active → finished).

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`status: 'finished'`, `endedAt` défini) |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session active peut être terminée' }` |

### POST `/api/sessions/code/:code`

Rejoindre une session en tant que participant anonyme.

| | Détail |
|---|---|
| Auth | Aucune |
| Params | `code` — code de session (insensible à la casse, converti en majuscules) |
| Body | `{ deviceId: string }` |
| Succès 200 | `{ token: string, session: Session }` |
| Erreur 400 | `{ message: 'deviceId requis' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |

> Le `participantToken` est déterministe : `SHA256(deviceId + ":" + sessionId)`. Même device + même session = même identité.

---

## Questions

### GET `/api/questions/session/:sessionId`

Lister les questions d'une session, triées par `order` croissant.

| | Détail |
|---|---|
| Auth | Aucune |
| Params | `sessionId` — ObjectId |
| Succès 200 | `Question[]` trié par `order` ASC |
| Erreur 400 | `{ message: 'Identifiant de session invalide' }` |

### POST `/api/questions`

Créer une question liée à une session.

| | Détail |
|---|---|
| Auth | ⚠️ Aucune (devrait être protégée) |
| Body | `{ session: string (ObjectId), text: string, order: number, options?: Array<{ label: string }> }` |
| Succès 201 | Document `Question` |
| Erreur 400 | `{ message: 'Identifiant de session invalide' }` ou `{ message: 'Le texte et l'ordre de la question sont obligatoires' }` |

### DELETE `/api/questions/:id`

Supprimer une question.

| | Détail |
|---|---|
| Auth | ⚠️ Aucune (devrait être protégée) |
| Params | `id` — ObjectId |
| Succès 200 | `{ message: 'Question supprimée avec succès', question: Question }` |
| Erreur 400 | `{ message: 'Identifiant de question invalide' }` |
| Erreur 404 | `{ message: 'Question introuvable' }` |

### PATCH `/api/questions/reorder/:sessionId`

Réordonner les questions d'une session.

| | Détail |
|---|---|
| Auth | ⚠️ Aucune (devrait être protégée) |
| Params | `sessionId` — ObjectId |
| Body | `{ questionIds: string[] }` — tableau ordonné d'ObjectIds |
| Succès 200 | `Question[]` dans le nouvel ordre |
| Erreur 400 | Messages de validation variés |

> Les positions `order` sont recalculées en 1-based (index + 1) via `bulkWrite`.

---

## Votes

### POST `/api/votes/vote`

Soumettre un vote sur une question.

| | Détail |
|---|---|
| Auth | JWT participant |
| Body | `{ questionId: string (ObjectId), optionIndex: number }` |
| Succès 201 | Document `Vote` |
| Erreur 400 | `{ message: 'questionId et optionIndex sont requis' }` |
| Erreur 403 | `{ message: 'Question hors session' }` — la question n'appartient pas à la session du participant |
| Erreur 409 | `{ message: 'Vous avez déjà voté pour cette question' }` — index unique MongoDB (code 11000) |

> Note : le path `/api/votes/vote` est redondant — `/api/votes` serait suffisant.

---

## Machine à états — Session

```
draft ──[PATCH /:id/start]──► active ──[PATCH /:id/end]──► finished
```

Les transitions sont protégées côté backend :
- `start` : uniquement depuis `draft` (sinon 409)
- `end` : uniquement depuis `active` (sinon 409)
- Seul le présentateur propriétaire peut déclencher une transition (sinon 403)

---

## Routes non appelées par le frontend

| Route backend | Statut côté front |
|---|---|
| `PATCH /api/questions/reorder/:sessionId` | Aucun appel — fonctionnalité de drag-and-drop non implémentée |
| `POST /api/votes/vote` | Non utilisé en REST — les votes passent par WebSocket |
