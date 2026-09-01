# Gestion d'état

> Comment Reagis organise les données côté frontend : qui stocke quoi, quand utiliser Redux vs `useState`, et comment le WebSocket se connecte au store.

---

## Règle générale

| Type de donnée | Où | Pourquoi |
|---|---|---|
| Données temps réel (votes, participants, statut) | **Redux** | Plusieurs composants les lisent ; mises à jour via WebSocket |
| Formulaires et états UI locaux | **`useState`** | N'existe que dans le composant ; jetable |
| Token et données utilisateur | **`localStorage`** | Persiste entre les reloads ; pas besoin de réactivité |

---

## Structure du Redux store

```
store
 ├── session        → données de la session en cours (nom, statut, compteurs)
 ├── question       → question en cours + options avec votes
 ├── votes          → IDs des questions déjà votées par le participant
 └── ui             → état de la connexion WebSocket + erreurs
```

### `sessionSlice`

Stocke les données de la session. **Utilisé par les deux côtés** (présentateur et participant).

| Champ | Type | Description |
|---|---|---|
| `id` | `string \| null` | ID de la session |
| `name` | `string` | Nom de la session |
| `code` | `string` | Code d'accès (RG-XXXX) |
| `status` | `string` | `draft`, `active`, `paused` ou `finished` |
| `currentQuestionIndex` | `number` | Index de la question en cours |
| `reaction` | `string \| null` | Emoji configuré pour les réactions |
| `reactionCount` | `number` | Total de réactions reçues |
| `participantCount` | `number` | Participants connectés dans la room |

**Actions :**

| Action | Qui la déclenche | Effet |
|---|---|---|
| `setSession` | Middleware (après join WS) | Remplit tous les champs |
| `updateParticipantCount` | Middleware (événement `PARTICIPANT_COUNT`) | Met à jour le compteur |
| `updateReactionCount` | Middleware (événement `REACTION_UPDATE`) | Met à jour les réactions |
| `sessionStarted` | Middleware (événement `SESSION_STARTED`) | `status = 'active'` |
| `sessionPaused` | Middleware (événement `SESSION_PAUSED`) | `status = 'paused'` |
| `sessionResumed` | Middleware (événement `SESSION_RESUMED`) | `status = 'active'` |
| `sessionEnded` | Middleware (événement `SESSION_ENDED`) | `status = 'finished'` |
| `clearSession` | Composant (au démontage) | Reset à l'état initial |

---

### `questionSlice`

Stocke la question actuelle et les votes par option.

| Champ | Type | Description |
|---|---|---|
| `id` | `string \| null` | ID de la question |
| `text` | `string` | Énoncé |
| `options` | `{ label, votes }[]` | Options avec compteur de votes |
| `status` | `string` | `pending`, `active` ou `closed` |

**Actions :**

| Action | Qui la déclenche | Effet |
|---|---|---|
| `setQuestion` | Middleware (événement `QUESTION_CHANGED`) ou présentateur (seed initial) | Définit la question en cours |
| `updateVotes` | Middleware (événement `VOTE_UPDATE`) | Met à jour les compteurs des options |
| `clearQuestion` | Composant | Reset |

---

### `votesSlice`

**Exclusif au participant.** Garde en mémoire quelles questions ont déjà été votées pour empêcher le re-vote côté UI.

| Champ | Type | Description |
|---|---|---|
| `votedQuestions` | `string[]` | IDs des questions votées |

> La protection réelle contre les doublons est l'index unique dans MongoDB. Ce slice est uniquement pour l'UX.

---

### `uiSlice`

État de la connexion WebSocket.

| Champ | Type | Description |
|---|---|---|
| `connected` | `boolean` | Socket connecté ? |
| `error` | `string \| null` | Dernier message d'erreur |

---

## Socket middleware — le cœur du temps réel

Le `socketMiddleware` est le point central de communication WebSocket. Aucun composant n'importe le socket directement. Tout passe par Redux.

### Principe

```
Composant                     Middleware                    Serveur
    │                             │                            │
    │  dispatch(wsSubmitVote())   │                            │
    │ ─────────────────────────►  │                            │
    │                             │  socket.emit(SUBMIT_VOTE)  │
    │                             │ ─────────────────────────►  │
    │                             │                            │
    │                             │   event: VOTE_UPDATE       │
    │                             │ ◄─────────────────────────  │
    │                             │                            │
    │  dispatch(updateVotes())    │                            │
    │ ◄─────────────────────────  │                            │
    │                             │                            │
    │  useAppSelector → re-render │                            │
```

### Actions interceptées (n'atteignent jamais les reducers)

| Action | Rôle | Événement émis |
|---|---|---|
| `ws/connect` | Le participant rejoint la session | `JOIN_SESSION` |
| `ws/presenterConnect` | Le présentateur surveille la session | `PRESENTER_JOIN` |
| `ws/disconnect` | Déconnecte le socket | — |
| `ws/submitVote` | Le participant vote | `SUBMIT_VOTE` |
| `ws/sendReaction` | Le participant réagit (emoji) | `SEND_REACTION` |

### Listeners (serveur → Redux)

| Événement WS | Action dispatched | Slice concerné |
|---|---|---|
| `VOTE_UPDATE` | `updateVotes()` | `question` |
| `QUESTION_CHANGED` | `setQuestion()` | `question` |
| `PARTICIPANT_COUNT` | `updateParticipantCount()` | `session` |
| `REACTION_UPDATE` | `updateReactionCount()` | `session` |
| `SESSION_STARTED` | `sessionStarted()` | `session` |
| `SESSION_PAUSED` | `sessionPaused()` | `session` |
| `SESSION_RESUMED` | `sessionResumed()` | `session` |
| `SESSION_ENDED` | `sessionEnded()` | `session` |
| `connect` | `setConnected(true)` | `ui` |
| `disconnect` | `setConnected(false)` | `ui` |
| `connect_error` | `setError(msg)` | `ui` |

### Détail important

Les listeners sont enregistrés **une seule fois** (`listenersBound`), au premier `ws/connect` ou `ws/presenterConnect`. Le socket est créé avec `autoConnect: false` — la connexion ne s'ouvre que lorsque le middleware la déclenche.

---

## Qui utilise quoi — par page

### Participant

| Page | Redux | useState |
|---|---|---|
| `ParticipantSessionPage` | `session` (lecture), `wsConnect`, `wsSendReaction` | `state` (loading/ready), `isBouncing` (animation) |
| `VotePage` | `question` (lecture), `wsSubmitVote` | `selectedOption`, `submitting` |

### Présentateur

| Page | Redux | useState |
|---|---|---|
| `SessionDetailPage` | `question.options`, `question.id`, `session.participantCount`, `wsPresenterConnect`, `setQuestion` | `session`, `questions`, `loading`, `error` |
| `CreateSessionPage` | — | Tout en local (formulaire de création) |
| `EditSessionPage` | — | Tout en local (formulaire d'édition) |
| `SessionPage` | — | `sessions`, `loading`, `search` |
| `LoginPage` | — | `email`, `password`, `error` |
| `HomePage` | — | `sessions`, `loading` |

> **Règle** : les pages de formulaires et de listes utilisent `useState`. Redux n'intervient que là où il y a des données temps réel via WebSocket.

---

## Flux complet : le participant vote

```
 1. ParticipantSessionPage se monte
 2. REST : joinSessionByCode(code, deviceId) → reçoit token + session
 3. dispatch(wsConnect(token, code))
 4. Middleware : socket.connect() + emit(JOIN_SESSION)
 5. Serveur : join room, ack avec les données de la session
 6. Middleware : dispatch(setSession(session))
 7. Composant : session.status === 'active' → rend <VotePage />
 8. VotePage lit state.question via useAppSelector
 9. Le participant sélectionne une option, clique « Voter »
10. dispatch(wsSubmitVote(questionId, optionIndex))
11. Middleware : socket.emit(SUBMIT_VOTE)
12. Serveur : crée Vote, $inc sur l'option, broadcast VOTE_UPDATE
13. Middleware : socket.on(VOTE_UPDATE) → dispatch(updateVotes())
14. VotePage se re-rend avec les nouveaux compteurs
```

---

## Flux complet : le présentateur voit les votes en direct

```
1. SessionDetailPage se monte
2. REST : getSessionById + getQuestionsBySession → state local
3. dispatch(setQuestion()) → seed Redux avec les données REST
4. Si status === 'active' : dispatch(wsPresenterConnect(sessionId))
5. Middleware : socket.connect() + emit(PRESENTER_JOIN)
6. Listeners actifs : VOTE_UPDATE, PARTICIPANT_COUNT, etc.
7. À chaque vote reçu : dispatch(updateVotes())
8. VoteBar se re-rend avec les données Redux (liveOptions)
9. Si liveOptions non disponible : fallback sur les données REST
```
