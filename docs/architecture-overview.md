# Vue d'ensemble de l'architecture

> Document unique pour comprendre comment Reagis est structuré, comment les données circulent de bout en bout, et quel rôle joue chaque partie du monorepo.

---

## Monorepo — qui dépend de qui

```
reagis/
 ├── packages/shared/          ← types TS + noms d'événements WS
 │     wsEvents.ts                (source de vérité)
 │     types.ts
 │
 ├── apps/back/                ← Express + Mongoose + Socket.io
 │     src/
 │       models/               Schémas Mongoose (User, Session, Question, Vote)
 │       controllers/          Logique métier par entité
 │       routes/               Routes REST Express
 │       sockets/              Handlers WebSocket (join, vote, reaction, presenter)
 │       middleware/            Auth JWT (présentateur + participant)
 │
 └── apps/web/                 ← React + Redux Toolkit + Vite
       src/
         pages/presenter/      Pages du présentateur (desktop)
         pages/participant/    Pages du participant (mobile-first)
         components/           Composants partagés (Button, VoteBar, etc.)
         api/                  Couche fetch (sessionApi, questionApi, authApi)
         store/                Redux (slices + socketMiddleware)
         styles/               CSS (global, ui, layout)
```

**Dépendances :**

```
apps/back  ──imports──►  packages/shared
apps/web   ──imports──►  packages/shared
```

Le package `shared` ne dépend de personne. Il définit les contrats (noms d'événements, types) que le back et le web doivent respecter.

---

## Deux utilisateurs, deux expériences

| | Présentateur | Participant |
|---|---|---|
| **Appareil** | Desktop (écran de projection) | Mobile (smartphone personnel) |
| **Auth** | Email + mot de passe → JWT (7j) | Anonyme → SHA256(deviceId:sessionId) → JWT (6h) |
| **Routes web** | `/sessions/*` | `/join`, `/session/:code` |
| **Layout** | Sidebar + contenu (AppLayout) | Carte centrée, sans navigation |
| **Rôle** | Crée, lance, contrôle la session | Rejoint, vote, réagit |
| **WebSocket** | Reçoit (votes, compteurs) | Envoie (votes, réactions) + reçoit (mises à jour) |

---

## Carte des routes frontend

### Présentateur (auth requise, avec sidebar)

| Route | Page | Description |
|---|---|---|
| `/` | `LoginPage` | Connexion / inscription |
| `/home` | `HomePage` | Tableau de bord |
| `/sessions` | `SessionPage` | Liste de toutes les sessions |
| `/sessions/new` | `CreateSessionPage` | Créer une session + ajouter des questions |
| `/sessions/:id` | `SessionDetailPage` | Voir / lancer / contrôler une session |
| `/sessions/:id/edit` | `EditSessionPage` | Modifier une session en brouillon |

### Participant (sans auth, sans sidebar)

| Route | Page | Description |
|---|---|---|
| `/join` | `JoinPage` | Saisir un code de session |
| `/session/:code` | `ParticipantSessionPage` | Attente → vote → résultats |

---

## Machine à états d'une session

```
  ┌───────┐  ▶ DÉMARRER  ┌────────┐  ⏸ PAUSE   ┌────────┐
  │ DRAFT │ ───────────► │ ACTIVE │ ──────────► │ PAUSED │
  └───────┘              └────────┘             └────────┘
                              │  ◄──────────────    │
                              │   ▶ REPRENDRE       │
                              │                     │
                              │  ■ TERMINER         │  ■ TERMINER
                              ▼                     ▼
                          ┌──────────┐          ┌──────────┐
                          │ FINISHED │          │ FINISHED │
                          └──────────┘          └──────────┘
```

- **Draft** : le présentateur prépare (CRUD questions, modifier le nom). Pas de WebSocket.
- **Active** : les participants votent en temps réel. WebSocket connecté pour tous. Le présentateur navigue librement entre les questions.
- **Paused** : votes bloqués côté serveur. Le WebSocket reste connecté. Le présentateur peut reprendre ou terminer.
- **Finished** : tout est fermé. Les données sont conservées pour consultation.

---

## Flux de bout en bout : un vote

```
 Participant (mobile)              Serveur (Express + Socket.io)         Présentateur (desktop)
        │                                     │                                  │
        │  1. Clique sur une option           │                                  │
        │                                     │                                  │
        │  2. dispatch(wsSubmitVote)           │                                  │
        │  ─────────────────────────────────►  │                                  │
        │     socket.emit(SUBMIT_VOTE)        │                                  │
        │                                     │                                  │
        │                          3. Crée un document Vote                      │
        │                             $inc sur Question.options[].votes           │
        │                                     │                                  │
        │                          4. broadcast(VOTE_UPDATE) à la room           │
        │  ◄─────────────────────────────────  │  ─────────────────────────────►  │
        │                                     │                                  │
        │  5. Middleware : dispatch(           │    5. Middleware : dispatch(      │
        │     updateVotes())                  │       updateVotes())             │
        │                                     │                                  │
        │  6. VotePage re-render              │    6. VoteBar re-render           │
        │     (compteurs mis à jour)          │       (barres mises à jour)      │
```

**Points clés :**
- Le `$inc` MongoDB est atomique → pas de race condition même sous charge
- L'unicité du vote est garantie par un index unique en base (pas par le code applicatif)
- Le broadcast touche tous les sockets de la room : présentateur ET participants

---

## Flux de bout en bout : une réaction

```
 Participant                      Serveur                              Présentateur
      │                               │                                     │
      │  dispatch(wsSendReaction)      │                                     │
      │  ───────────────────────────►  │                                     │
      │    emit(SEND_REACTION)        │                                     │
      │                               │                                     │
      │                    $inc reactionCount sur Session                    │
      │                               │                                     │
      │                    broadcast(REACTION_UPDATE)                        │
      │  ◄───────────────────────────  │  ────────────────────────────────►  │
      │                               │                                     │
      │  dispatch(updateReactionCount) │  dispatch(updateReactionCount)      │
```

---

## Flux de bout en bout : rejoindre une session

```
 Participant                      Serveur                              Présentateur
      │                               │                                     │
      │  1. GET /join → saisit code   │                                     │
      │                               │                                     │
      │  2. POST /sessions/code/:code │                                     │
      │  ───────────────────────────►  │                                     │
      │                               │                                     │
      │     Génère participantToken    │                                     │
      │     = SHA256(deviceId:sessionId)                                     │
      │     Signe un JWT participant   │                                     │
      │                               │                                     │
      │  ◄─ { token, session }        │                                     │
      │                               │                                     │
      │  3. dispatch(wsConnect)        │                                     │
      │     emit(JOIN_SESSION)         │                                     │
      │  ───────────────────────────►  │                                     │
      │                               │                                     │
      │     socket.join(session:id)    │                                     │
      │     ack({ ok, session })       │                                     │
      │                               │                                     │
      │  ◄───────────────────────────  │  broadcast(PARTICIPANT_COUNT) ───►  │
      │                               │                                     │
      │  4. Session en attente (draft) │                                     │
      │     → écran réaction           │                                     │
      │                               │                                     │
      │  5. Le présentateur démarre    │                                     │
      │                               │  broadcast(SESSION_STARTED)         │
      │  ◄───────────────────────────  │                                     │
      │                               │                                     │
      │  6. session.status = 'active'  │                                     │
      │     → affiche VotePage         │                                     │
```

---

## Communication : REST vs WebSocket

| | REST (HTTP) | WebSocket (Socket.io) |
|---|---|---|
| **Quand** | Chargement initial, CRUD, auth | Données temps réel |
| **Direction** | Client → Serveur → Réponse | Bidirectionnel |
| **Exemples** | Créer session, login, lister questions | Voter, recevoir votes, compteurs |
| **State** | `useState` (données locales) | Redux (données partagées) |

**Règle simple :** si la donnée change en temps réel et que plusieurs composants la lisent → WebSocket + Redux. Sinon → REST + `useState`.

---

## Sécurité — résumé

| Mécanisme | Détail |
|---|---|
| **Auth présentateur** | JWT signé (JWT_SECRET), vérifié par middleware `authenticateToken` |
| **Auth participant** | JWT signé (PARTICIPANT_JWT_SECRET), token déterministe par device+session |
| **Anti-double vote** | Index unique MongoDB `{question, participantToken}` — la DB refuse le doublon |
| **Compteurs atomiques** | `$inc` MongoDB sur `Question.options[].votes` — pas de race condition |
| **Isolation des sessions** | Rooms Socket.io `session:<id>` — un participant ne reçoit que les événements de sa session |
| **Pas de traçage cross-session** | Le token participant change par session (SHA256 inclut le sessionId) |
