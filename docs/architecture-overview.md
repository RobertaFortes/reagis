# Vue d'ensemble de l'architecture

> Document unique pour comprendre comment Reagis est structuré, comment les données circulent de bout en bout, et quel rôle joue chaque partie du monorepo.

---

## Monorepo — qui dépend de qui

```
reagis/
 ├── packages/shared/          ← noms d'événements WS + statuts de session
 │     wsEvents.ts                (source de vérité)
 │     sessionStatus.ts
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
         components/           Composants partagés (Button, VoteBar, RequireAuth, Modal, etc.)
         api/                  Couche fetch (sessionApi, questionApi, authApi, authStorage)
         store/                Redux (slices + socketMiddleware)
         socket.ts             Instance socket.io-client (autoConnect: false)
         styles/               CSS en kebab-case (global, ui, layout, une feuille par page/composant)
```

**Dépendances :**

```
apps/back  ──imports──►  packages/shared
apps/web   ──imports──►  packages/shared
```

Le package `shared` ne dépend de personne. Il définit les contrats (noms d'événements, statuts) que le back et le web doivent respecter.

**Déploiement :** le web est déployé sur Vercel (`vercel.json`, réécriture SPA vers `index.html`), l'API sur Render (`render.yaml`, build de `shared` puis du back).

---

## Deux utilisateurs, deux expériences

| | Présentateur | Participant |
|---|---|---|
| **Appareil** | Desktop (écran de projection) | Mobile (smartphone personnel) |
| **Auth** | Email + mot de passe → JWT (1d) | Anonyme → SHA256(deviceId:sessionId) → JWT (6h) |
| **Routes web** | `/home`, `/sessions/*` | `/join`, `/session/:code` |
| **Layout** | Sidebar + contenu (AppLayout) ; vue projection plein écran | Carte centrée, sans navigation |
| **Rôle** | Crée, lance, contrôle la session | Rejoint (code ou QR), vote, réagit |
| **WebSocket** | Reçoit (votes, compteurs, réactions) — les commandes passent en REST | Envoie (votes, réactions) + reçoit (mises à jour) |

---

## Carte des routes frontend

### Public (sans auth, sans sidebar)

| Route | Page | Description |
|---|---|---|
| `/` | `LandingPage` | Page d'accueil / vitrine du produit |
| `/login` | `LoginPage` | Connexion / inscription présentateur (`/login?signup=1` ouvre l'inscription) |

### Présentateur (auth requise via `RequireAuth`, avec sidebar via AppLayout sauf `/present`)

| Route | Page | Description |
|---|---|---|
| `/home` | `HomePage` | Tableau de bord |
| `/sessions` | `SessionPage` | Liste de toutes les sessions |
| `/sessions/new` | `CreateSessionPage` | Créer une session + ajouter des questions |
| `/sessions/:id` | `SessionDetailPage` | Voir / lancer / contrôler une session |
| `/sessions/:id/edit` | `EditSessionPage` | Modifier une session en brouillon |
| `/sessions/:id/present` | `PresentationPage` | Vue projection live (plein écran, sans sidebar) |

### Participant (sans auth, sans sidebar)

| Route | Page | Description |
|---|---|---|
| `/join` | `JoinPage` | Saisir un code de session ou scanner le QR code |
| `/session/:code` | `ParticipantSessionPage` | Attente → vote → résultats (contient `VotePage` en sous-composant) |

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

- **Draft** : le présentateur prépare (CRUD questions, modifier le nom et la réaction). Les participants peuvent déjà rejoindre (écran d'attente avec réactions) et le présentateur voit le compteur de participants.
- Suppression possible uniquement en **draft** ou **finished** (cascade questions + votes).
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
      │     (PATCH /sessions/:id/start)│                                     │
      │                               │                                     │
      │                               │  broadcast(SESSION_STARTED)         │
      │                               │  + QUESTION_CHANGED (1re question)  │
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
| **Auth présentateur** | JWT signé (JWT_SECRET, 1 jour), vérifié par middleware `authenticateToken` + contrôle « propriétaire de la session » (403) |
| **Auth participant** | JWT signé (PARTICIPANT_JWT_SECRET), token déterministe par device+session |
| **Anti-double vote** | Index unique MongoDB `{question, participantToken}` — la DB refuse le doublon |
| **Compteurs atomiques** | `$inc` MongoDB sur `Question.options[].votes` — pas de race condition |
| **Isolation des sessions** | Rooms Socket.io `session:<id>` — un participant ne reçoit que les événements de sa session |
| **Pas de traçage cross-session** | Le token participant change par session (SHA256 inclut le sessionId) |

**Limites connues** (voir `docs/api-routes.md` et `docs/auth-et-websocket.md`) : certaines routes de création/modification de questions et `POST /api/sessions` ne sont pas protégées ; CORS retombe sur `*` si `CLIENT_URL` n'est pas défini ; l'identité de vote WebSocket repose aujourd'hui sur le JWT participant non vérifié plutôt que sur le hash déterministe.
