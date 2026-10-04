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
| Presenter | `Authorization: Bearer <token>` | `JWT_SECRET` | 1d | `{ userId, role }` |
| Participant | `Authorization: Bearer <token>` | `PARTICIPANT_JWT_SECRET` | 6h | `{ sessionId, participantToken }` |

Erreurs communes des routes protégées (format `{ message }`) :

| Code | Presenter (`authenticateToken`) | Participant (`authenticateParticipant`) |
|---|---|---|
| 401 | `'Token manquant'` / `'Token invalide ou expiré'` | `'Token participant manquant'` / `'Token participant invalide ou expiré'` |

---

## Auth

### POST `/api/auth/signup`

Créer un compte présentateur.

| | Détail |
|---|---|
| Auth | Aucune |
| Body | `{ email: string, password: string, name: string }` |
| Succès 201 | `{ result: true, user: { id, email, name, role } }` |
| Erreur 400 | `{ result: false, error: 'Email, password et name sont obligatoires' }` |
| Erreur 409 | `{ result: false, error: 'Cet email est déjà utilisé' }` |

> Note : le rôle est toujours `'presenter'` (hardcodé).

### POST `/api/auth/login`

Authentifier un présentateur et obtenir un JWT.

| | Détail |
|---|---|
| Auth | Aucune |
| Body | `{ email: string, password: string }` |
| Succès 200 | `{ result: true, token: string, user: { id, email, name, role } }` |
| Erreur 400 | `{ result: false, error: 'Email et password sont obligatoires' }` |
| Erreur 401 | `{ result: false, error: 'Email ou mot de passe incorrect' }` |

> Le JWT présentateur expire au bout de **1 jour** (`expiresIn: '1d'`).

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
| Succès 200 | `Session[]` — champs `name code status createdAt updatedAt startedAt endedAt` |

### GET `/api/sessions/:id`

Récupérer une session par son ID MongoDB.

| | Détail |
|---|---|
| Auth | Aucune |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` |
| Erreur 404 | `{ message: 'Session introuvable' }` |

> Note : pas de validation `ObjectId.isValid()` sur ce endpoint (un id mal formé renvoie 500).

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

### PATCH `/api/sessions/:id`

Modifier une session en brouillon (nom, reaction).

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Body | `{ name?: string, reaction?: '👍'\|'❤️'\|'🔥'\|'👏' }` |
| Succès 200 | Document `Session` mis à jour |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session en brouillon peut être modifiée' }` |

### DELETE `/api/sessions/:id`

Supprimer une session **et** ses questions et votes (transaction MongoDB : tout ou rien).

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | `{ message: 'Session supprimée avec succès' }` |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session en état brouillon ou terminé peut être supprimée' }` |

### PATCH `/api/sessions/:id/next-question`

Avancer à la question suivante.

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`currentQuestionIndex` incrémenté) |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Dernière question atteinte' }` ou `{ message: 'La session doit être active' }` |

> La question cible passe à `active` si elle était `pending` (première visite). Les questions déjà visitées restent `active` — le participant qui n'a pas voté peut encore voter (protégé par l'index unique MongoDB).

### PATCH `/api/sessions/:id/previous-question`

Revenir à la question précédente.

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`currentQuestionIndex` décrémenté) |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Première question atteinte' }` ou `{ message: 'La session doit être active' }` |

### PATCH `/api/sessions/:id/pause`

Mettre une session en pause (active → paused). Les votes sont bloqués côté serveur.

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`status: 'paused'`) |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session active peut être mise en pause' }` |

### PATCH `/api/sessions/:id/resume`

Reprendre une session en pause (paused → active).

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`status: 'active'`) |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session en pause peut être reprise' }` |

> Après `SESSION_RESUMED`, le serveur renvoie aussi `QUESTION_CHANGED` avec la question courante pour resynchroniser les participants.

### PATCH `/api/sessions/:id/end`

Terminer une session (active ou paused → finished).

| | Détail |
|---|---|
| Auth | JWT presenter |
| Params | `id` — ObjectId |
| Succès 200 | Document `Session` mis à jour (`status: 'finished'`, `endedAt` défini) |
| Erreur 403 | `{ message: 'Non autorisé' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |
| Erreur 409 | `{ message: 'Seule une session active ou en pause peut être terminée' }` |

### POST `/api/sessions/code/:code`

Rejoindre une session en tant que participant anonyme.

| | Détail |
|---|---|
| Auth | Aucune |
| Params | `code` — code de session (insensible à la casse, converti en majuscules) |
| Body | `{ deviceId: string }` |
| Succès 200 | `{ token: string, session: Session }` — `token` = JWT participant (6h) |
| Erreur 400 | `{ message: 'deviceId requis' }` |
| Erreur 404 | `{ message: 'Session introuvable' }` |

> Le statut de la session n'est pas vérifié ici ; c'est l'événement WS `join_session` qui refuse les sessions `finished`.

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
| Note | Le statut de la session n'est pas vérifié (une question peut être ajoutée à une session active) |
| Succès 201 | Document `Question` |
| Erreur 400 | `{ message: 'Identifiant de session invalide' }` ou `{ message: 'Le texte et l'ordre de la question sont obligatoires' }` |

### PATCH `/api/questions/:id`

Modifier une question (texte et/ou options). Uniquement si la session est en brouillon.

| | Détail |
|---|---|
| Auth | ⚠️ Aucune (devrait être protégée) |
| Params | `id` — ObjectId |
| Body | `{ text?: string, options?: Array<{ label: string }> }` |
| Succès 200 | Document `Question` mis à jour |
| Erreur 400 | `{ message: 'Identifiant de question invalide' }` |
| Erreur 404 | `{ message: 'Question introuvable' }` |
| Erreur 409 | `{ message: 'Seule une question d'une session en brouillon peut être modifiée' }` |

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
| Erreur 400 | `'Identifiant de session invalide'`, `'questions doit être un tableau'`, `'Un ou plusieurs identifiants de question sont invalides'`, `'Une ou plusieurs questions n'existent pas ou n'appartiennent pas à cette session'` |

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
draft ──[start]──► active ◄──[resume]── paused
                     │                    ▲
                     ├──[pause]───────────┘
                     │
                     ├──[end]──► finished
                     │
                   paused ──[end]──► finished
```

Les transitions sont protégées côté backend :
- `start` : uniquement depuis `draft` (sinon 409)
- `pause` : uniquement depuis `active` (sinon 409)
- `resume` : uniquement depuis `paused` (sinon 409)
- `end` : depuis `active` ou `paused` (sinon 409)
- `next-question` / `previous-question` : uniquement depuis `active` (sinon 409)
- Seul le présentateur propriétaire peut déclencher une transition (sinon 403)

---

## Routes non appelées par le frontend

| Route backend | Statut côté front |
|---|---|
| `PATCH /api/questions/reorder/:sessionId` | Aucun appel — fonctionnalité de drag-and-drop non implémentée |
| `POST /api/votes/vote` | Non utilisé en REST — les votes passent par WebSocket (`submit_vote`) ; `apps/web/src/api/voteApi.ts` est vide |

## Route technique

| Route | Réponse |
|---|---|
| `GET /health` | `{ status: 'ok' }` — sonde de disponibilité (Render) |

## Événements WebSocket liés aux transitions

| Transition | Événement broadcast | Données |
|---|---|---|
| `start` | `SESSION_STARTED` puis `QUESTION_CHANGED` (1re question) | `{ sessionId, status: 'active' }` / `{ id, text, options, status }` |
| `pause` | `SESSION_PAUSED` | `{ sessionId, status: 'paused' }` |
| `resume` | `SESSION_RESUMED` puis `QUESTION_CHANGED` (question courante) | `{ sessionId, status: 'active' }` / `{ id, text, options, status }` |
| `end` | `SESSION_ENDED` | `{ sessionId, status: 'finished' }` |
| `next-question` / `previous-question` | `QUESTION_CHANGED` | `{ id, text, options, status, currentQuestionIndex, totalQuestions }` |
