# Authentification et WebSocket — Guide pour développeurs

> Ce document explique **comment fonctionnent l'authentification et le temps réel** dans Reagis.
> Il est pensé pour quelqu'un qui découvre le projet.

---

## Vue d'ensemble

Reagis a **deux types d'utilisateurs** avec des parcours très différents :

| | Présentateur | Participant |
|---|---|---|
| **Compte** | Email + mot de passe | Aucun (anonyme) |
| **Identifiant** | `userId` (MongoDB) | `deviceId` (généré côté navigateur) |
| **Token JWT** | Signé avec `JWT_SECRET` | Signé avec `PARTICIPANT_JWT_SECRET` |
| **Durée du token** | 1 jour (`1d`) | 6 heures |
| **Accès** | REST API protégée + WebSocket | REST API publique + WebSocket |

Le choix d'avoir deux secrets JWT séparés est une mesure de sécurité : même si un token participant fuite, il ne peut pas être utilisé pour accéder aux routes présentateur, et inversement.

---

## 1. Authentification Présentateur

### Inscription et connexion

```
POST /api/auth/signup   → crée le compte (email, password, name)
POST /api/auth/login    → retourne un token JWT
```

À la connexion, le serveur :

1. Vérifie l'email et le mot de passe (haché avec **bcrypt**)
2. Génère un **JWT** contenant `{ userId, role: "presenter" }`
3. Renvoie le token au client

Le client stocke ce token dans `localStorage` sous la clé `reagis_token` (et l'utilisateur sous `reagis_user`).
Côté front, `RequireAuth` protège les routes présentateur et `authFetch` (`api/authStorage.ts`) purge la session et renvoie vers l'accueil sur une réponse 401.

### Utilisation du token

Pour chaque requête protégée, le client envoie le token dans le header HTTP :

```
Authorization: Bearer <token>
```

Le middleware `authenticateToken` (côté serveur) :
- Extrait le token du header
- Le vérifie avec `JWT_SECRET`
- Attache les infos décodées (`userId`, `role`) à `req.user`
- Renvoie **401** si le token est absent ou invalide

### Fichiers concernés

| Fichier | Rôle |
|---|---|
| `apps/back/src/routes/auth.routes.ts` | Routes signup/login |
| `apps/back/src/middleware/authenticateToken.ts` | Middleware de vérification JWT |
| `apps/back/src/models/User.ts` | Modèle Mongoose (email, password hashé, role) |
| `apps/web/src/api/authApi.ts` | Appels fetch côté client (signup / login) |
| `apps/web/src/api/authStorage.ts` | Lecture/écriture du token, `isTokenValid`, `authFetch` |
| `apps/web/src/components/RequireAuth.tsx` | Garde de routes React Router |

---

## 2. Authentification Participant

Les participants n'ont **pas de compte**. On les identifie par leur appareil.

### Le flux complet

```
Participant ouvre /session/RG-XXXX
        │
        ▼
Client génère un deviceId unique
(localStorage "reagis_device_id", persistant)
        │
        ▼
POST /api/sessions/code/RG-XXXX
body: { deviceId: "device_1724..." }
        │
        ▼
Serveur calcule : SHA256(deviceId + ":" + sessionId)
  → participantToken (hash déterministe)
        │
        ▼
Serveur signe un JWT contenant :
  { sessionId, participantToken }
  avec PARTICIPANT_JWT_SECRET (expire en 6h)
        │
        ▼
Client reçoit { token, session }
  → stocke le token (localStorage "reagis_participant_token")
  → ouvre le WebSocket (dispatch wsConnect)
```

### Pourquoi SHA256 ?

Le `participantToken` est un hash **déterministe** : même appareil + même session = même token, toujours. Cela permet :

- **Reconnexion** : si le participant rafraîchit la page, il récupère le même token
- **Anti-triche** : un appareil ne peut voter qu'une fois par question (le token sert de clé unique dans la base)
- **Isolation** : le hash inclut le `sessionId`, donc un même appareil a des tokens différents par session

### Fichiers concernés

| Fichier | Rôle |
|---|---|
| `apps/back/src/controllers/sessionController.ts` | Méthode `joinSessionByCode` — génère le token |
| `apps/back/src/middleware/authenticateParticipant.ts` | Middleware JWT participant |
| `apps/web/src/api/sessionApi.ts` | `joinSessionByCode()` côté client |

---

## 3. WebSocket (Socket.io)

Le WebSocket permet la **communication en temps réel** : votes, compteur de participants, changements de question, etc.

### Comment ça marche (en simple)

```
┌──────────┐         HTTP          ┌──────────┐
│  Client  │ ◄──── REST API ────►  │ Serveur  │
│  (React) │                       │ (Express) │
│          │ ◄── WebSocket ──────► │          │
│          │   (bidirectionnel)    │          │
└──────────┘                       └──────────┘
```

- **REST API** (HTTP) : requête → réponse. Le client demande, le serveur répond. C'est tout.
- **WebSocket** : connexion persistante. Le serveur peut **envoyer des données au client sans que celui-ci les demande** (ex : un nouveau vote arrive).

Socket.io est une librairie qui simplifie l'utilisation des WebSockets avec des fonctionnalités comme les **rooms** (groupes de connexions) et les **events** (messages nommés).

### Connexion côté client

```typescript
// apps/web/src/socket.ts
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';
export const socket = io(WS_URL, { autoConnect: false });
```

Le socket est créé avec `autoConnect: false` — il ne se connecte pas tout seul. C'est le code de la page qui décide **quand** se connecter (après avoir obtenu le token).

### Les rooms (salles)

Chaque session a sa propre **room** : `session:<sessionId>`

```
Room "session:abc123"
  ├── Participant A
  ├── Participant B
  ├── Participant C
  └── Présentateur
```

Quand un vote arrive, le serveur émet un événement **uniquement dans la room** de la session. Les autres sessions ne reçoivent rien.

### Événements WebSocket

Les noms d'événements sont définis dans le package partagé `@reagis/shared` (`packages/shared/wsEvents.ts`) pour garantir la cohérence entre le client et le serveur.

#### Client → Serveur

| Événement | Émis par | Payload | Rôle |
|---|---|---|---|
| `join_session` | Participant | `{ code, participantToken }` | Rejoindre une session |
| `presenter_join` | Présentateur | `{ sessionId, token }` | Rejoindre en tant que présentateur |
| `submit_vote` | Participant | `{ questionId, optionIndex }` | Voter |
| `send_reaction` | Participant | `{ emoji }` | Envoyer une réaction |

#### Serveur → Clients (broadcast dans la room)

| Événement | Payload | Rôle |
|---|---|---|
| `session_started` | `{ sessionId, status }` | La session a démarré |
| `session_paused` | `{ sessionId, status }` | La session est en pause (votes bloqués) |
| `session_resumed` | `{ sessionId, status }` | La session a repris |
| `session_ended` | `{ sessionId, status }` | La session est terminée |
| `vote_update` | `{ questionId, options: [{ label, votes }] }` | Résultats mis à jour après un vote |
| `participant_count` | `{ sessionId, count }` | Nombre de participants connectés (le présentateur n'est pas compté) |
| `question_changed` | `{ id, text, options, status, currentQuestionIndex?, totalQuestions? }` | Nouvelle question courante (start, next/previous, resume). Index et total seulement sur next/previous |
| `reaction_update` | `{ sessionId, reactionCount, emoji }` | Compteur de réactions mis à jour (+ emoji flottant à l'écran) |

#### Acks (réponses aux événements client)

| Événement | Ack en cas de succès | Erreurs possibles (`{ ok: false, error }`) |
|---|---|---|
| `join_session` | `{ ok: true, session: { id, name, code, status, currentQuestionIndex, totalQuestions, reaction, reactionCount }, question }` | `'code et participantToken requis'`, `'Session introuvable'`, `'Session terminée'` |
| `presenter_join` | `{ ok: true, participantCount }` | `'sessionId et token requis'`, `'Session introuvable'`, `'Non autorisé'`, `'Token invalide ou expiré'` |
| `submit_vote` | `{ ok: true }` | `'Rejoignez la session avant de voter'`, `'Session en pause'`, `'Question introuvable'`, `'Question fermée'`, `'Option invalide'`, `'Vous avez déjà voté sur cette question'` |
| `send_reaction` | — (pas d'ack) | — |

Un participant peut rejoindre une session `draft` (écran d'attente avec réactions), `active` ou `paused` ; seules les sessions `finished` sont refusées. Si la session est active ou en pause, l'ack contient la question courante.

### Cycle de vie d'une connexion participant

```
1. Page chargée → REST : joinSessionByCode(code, deviceId)
   ← Reçoit { token, session }

2. Socket.connect() vers localhost:4000

3. Émet "join_session" { code, participantToken }
   ← Reçoit ack { ok: true, session: {...} }
   → Serveur ajoute le socket à la room

4. Écoute les événements (via socketMiddleware → Redux) :
   - "session_started" / "session_paused" / "session_resumed" → change l'écran
   - "question_changed"  → affiche la nouvelle question
   - "vote_update"       → met à jour les résultats
   - "reaction_update"   → compteur + emoji flottant
   - "session_ended"     → affiche les résultats finaux

   En cas de reconnexion automatique de Socket.io, le middleware
   ré-émet "join_session" avec les mêmes identifiants.

5. Déconnexion (ferme l'onglet, navigation)
   → Serveur retire le socket de la room
   → Broadcast du nouveau participant_count
```

### Cycle de vie d'une connexion présentateur

```
1. Présentateur est déjà authentifié (JWT en localStorage)

2. Socket.connect() vers localhost:4000

3. Émet "presenter_join" { sessionId, token }
   → Serveur vérifie le JWT
   → Serveur vérifie que le userId correspond au presenter de la session
   ← Reçoit ack { ok: true, participantCount }

4. Écoute "vote_update", "participant_count", "question_changed",
   "reaction_update" et les changements de statut
   → Dashboard (SessionDetailPage) et vue projection (PresentationPage) en temps réel

   La connexion est ouverte dès que la session n'est pas terminée
   (y compris en draft, pour voir les participants qui attendent).
```

### Fichiers concernés

| Fichier | Rôle |
|---|---|
| `apps/back/src/server.ts` | Création du serveur Socket.io |
| `apps/back/src/sockets/index.ts` | Enregistrement des handlers |
| `apps/back/src/sockets/joinHandler.ts` | Handler `join_session` + déconnexion |
| `apps/back/src/sockets/voteHandler.ts` | Handler `submit_vote` + broadcast |
| `apps/back/src/sockets/presenterHandler.ts` | Handler `presenter_join` (vérifie le JWT) |
| `apps/back/src/sockets/reactionHandler.ts` | Handler `send_reaction` (`$inc` reactionCount + broadcast) |
| `apps/back/src/sockets/rooms.ts` | Helper `sessionRoom(id)` → `session:<id>` |
| `packages/shared/wsEvents.ts` | Noms des événements (source unique) |
| `apps/web/src/socket.ts` | Instance socket côté client |
| `apps/web/src/store/socketMiddleware.ts` | Middleware Redux ↔ Socket.io |

---

## 4. Unicité des votes

La protection contre le double vote est assurée par la **base de données**, pas par le code applicatif.

```
Collection "votes" — index unique partiel :
  { question: 1, participantToken: 1 }
```

Si un participant tente de voter deux fois sur la même question, MongoDB renvoie une erreur `11000` (duplicate key). Le handler `submit_vote` intercepte cette erreur et renvoie un message propre.

> ⚠️ **Limite actuelle (à corriger)** : le champ `participantToken` envoyé dans `join_session` est en réalité le **JWT participant** reçu de `POST /api/sessions/code/:code` (voir `ParticipantSessionPage` → `wsConnect(result.token, code)`), et `joinHandler` le stocke tel quel sans le vérifier. Or ce JWT change à chaque appel REST (champ `iat`), donc l'identité de vote côté serveur n'est **pas** le hash déterministe `SHA256(deviceId:sessionId)`. Conséquences : deux onglets ouverts sur le même appareil peuvent chacun voter (l'UI ne bloque que via `localStorage` `reagis_voted_questions`, lu au rendu), et un client modifié peut envoyer n'importe quelle chaîne. Correctif : vérifier le JWT avec `PARTICIPANT_JWT_SECRET` dans `joinHandler` et utiliser le `participantToken` qu'il contient.

En parallèle, le compteur de votes est mis à jour avec `$inc` (opération atomique MongoDB) directement sur le document Question :

```typescript
// Pas de race condition, même avec 100 votes simultanés
await Question.findByIdAndUpdate(
  question._id,
  { $inc: { [`options.${optionIndex}.votes`]: 1 } },
  { new: true }
);
```

---

## 5. Variables d'environnement

### Backend (`apps/back/.env`)

```env
PORT=4000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<secret-pour-les-presentateurs>
PARTICIPANT_JWT_SECRET=<secret-pour-les-participants>
CLIENT_URL=http://localhost:5173
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
```

Le préfixe `VITE_` est obligatoire pour que Vite expose la variable au code client.

---

## Résumé visuel

```
┌─────────────────────────────────────────────────────────┐
│                     PRÉSENTATEUR                        │
│                                                         │
│  Login ──► JWT (JWT_SECRET, 1d)                        │
│    │                                                    │
│    ├── REST : GET /my-sessions (header Authorization)  │
│    │                                                    │
│    └── WS : presenter_join (token vérifié serveur)     │
│           → rejoint room session:<id>                  │
│           ← reçoit vote_update, participant_count      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     PARTICIPANT                         │
│                                                         │
│  Join ──► SHA256(deviceId:sessionId)                   │
│       ──► JWT (PARTICIPANT_JWT_SECRET, 6h)             │
│    │                                                    │
│    └── WS : join_session (code + token)                │
│           → rejoint room session:<id>                  │
│           → submit_vote (questionId, optionIndex)      │
│           ← reçoit vote_update, question_changed       │
└─────────────────────────────────────────────────────────┘
```
