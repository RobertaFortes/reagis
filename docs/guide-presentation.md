# Guide de présentation — Réagis

> **Objectif** : t'aider à présenter Réagis de façon claire, structurée et confiante.
> Langage simple (A2/B1), avec les termes techniques expliqués.
> Utilise ce document pour la démo en classe ET pour préparer la soutenance devant le jury.

---

## 🎯 Pitch d'ouverture (30 secondes)

> « Réagis est une plateforme de sondage en temps réel.
> Le présentateur crée des questions, les participants votent avec leur téléphone, et les résultats s'affichent en direct.
> Pas besoin de télécharger une application — tout fonctionne dans le navigateur. »

---

## 📋 Plan de la démo

### Étape 1 — Montrer l'interface présentateur (desktop)

1. Se connecter sur `/` (LoginPage)
2. Aller sur `/home` → montrer le dashboard
3. Montrer la session déjà créée (les questions, les options)
4. **Expliquer** : « Le présentateur a une sidebar pour naviguer. C'est une interface desktop. »

### Étape 2 — Inviter la classe à rejoindre

1. Ouvrir la page de présentation (`/sessions/:id/present`)
2. Montrer le **QR code** et le **code de session** (format `RG-XXXX`)
3. Dire à la classe : « Scannez le QR code ou allez sur [URL] et tapez le code. »
4. Montrer le **compteur de participants** qui monte en direct

### Étape 3 — Lancer la session

1. Cliquer sur « Démarrer »
2. **Montrer aux participants** : leur écran change automatiquement (la question apparaît)
3. **Expliquer** : « Le serveur envoie un événement WebSocket à tous les téléphones connectés. Personne n'a besoin de rafraîchir la page. »

### Étape 4 — Voter en direct

1. Les participants votent sur leur téléphone
2. **Montrer l'écran du présentateur** : les barres de vote bougent en temps réel
3. **Expliquer** : « Chaque vote passe par WebSocket, pas par un rechargement de page. Le serveur met à jour le compteur et envoie le résultat à tout le monde. »

### Étape 5 — Naviguer entre les questions

1. Cliquer sur « Suivant » → la question change sur tous les écrans
2. Revenir en arrière → « Précédent » fonctionne aussi
3. **Expliquer** : « Le serveur envoie un événement `question_changed` à la room. »

### Étape 6 — Pause et réactions

1. Mettre la session en **pause** → les votes sont bloqués côté serveur
2. Montrer que les participants peuvent envoyer des **réactions** (emoji animé)
3. Reprendre la session → les votes sont de nouveau possibles

### Étape 7 — Terminer et montrer les résultats

1. Cliquer sur « Terminer »
2. Les participants voient automatiquement la page des résultats finaux
3. **Expliquer** : « Le statut passe de `active` à `finished`. C'est une machine à états. »

---

## 🏗️ Architecture — comment l'expliquer simplement

### Le monorepo

> « Le projet est organisé en **monorepo** avec npm workspaces. Il y a trois parties : »

```
reagis/
  ├── apps/back/       ← Le serveur (Express + MongoDB + Socket.io)
  ├── apps/web/        ← Le client (React + Redux + Vite)
  └── packages/shared/ ← Les constantes partagées (noms d'événements WS)
```

> « Le package `shared` est importé par le back ET par le web.
> Si je change le nom d'un événement WebSocket, les deux côtés sont mis à jour automatiquement.
> TypeScript vérifie la cohérence à la compilation. »

**Si le prof demande pourquoi un monorepo :**
> « Parce que le front et le back partagent du code (les événements WebSocket).
> Avec un monorepo, un seul `npm install`, un seul repo Git, et les imports entre packages sont directs. »

### Les 4 couches du backend

| Couche | Rôle | Exemple |
|--------|------|---------|
| **Routes** | Reçoivent les requêtes HTTP | `POST /api/sessions` |
| **Middleware** | Vérifient l'authentification | `authenticateToken` vérifie le JWT |
| **Controllers** | La logique métier | Créer une session, valider un vote |
| **Models** | La structure des données (MongoDB) | User, Session, Question, Vote |

> « Une requête arrive → la route la reçoit → le middleware vérifie le token → le controller exécute la logique → le model accède à la base de données. »

**Pourquoi cette séparation ? (comment défendre ce choix)**

Chaque couche a **une seule question** à résoudre :

- **Route** → « Quelle URL va où ? » C'est un index. Pas de logique, juste la liaison URL → middleware → controller.
- **Middleware** → « Le client a-t-il le droit ? » Il vérifie le JWT et passe au suivant. Il ne sait pas ce qui va se passer après.
- **Controller** → « Que faut-il faire ? » Les validations métier, les transitions d'état, les broadcasts WebSocket.
- **Model** → « Comment les données sont structurées ? » Les champs, les types, les index, les contraintes.

L'avantage concret : le middleware `authenticateToken` est **réutilisé sur 8 routes** sans dupliquer le code :

```typescript
router.get('/my-sessions',  authenticateToken, getMySessions);
router.patch('/:id/start',  authenticateToken, startSession);
router.patch('/:id/end',    authenticateToken, endSession);
// → même vérification JWT, écrite une seule fois
```

Si un jour on change la méthode d'authentification (JWT → OAuth par exemple), on modifie **un seul fichier** et toutes les routes sont mises à jour.

> « C'est le pattern **MVC** (Model-View-Controller) adapté pour une API REST.
> Chaque fichier a une seule raison de changer → c'est plus facile à lire, à tester, et à maintenir. »

**Si le prof demande « pourquoi pas tout dans un seul fichier ? » :**
> « Ça marcherait pour un petit projet. Mais avec 12 routes, 2 types d'auth, et du WebSocket, un seul fichier serait illisible. La séparation permet de réutiliser (un middleware pour 8 routes) et de limiter l'impact d'un changement à un seul endroit. »

### Les 4 couches du frontend

| Couche | Rôle | Exemple |
|--------|------|---------|
| **Pages** | Ce que l'utilisateur voit | `PresentationPage`, `JoinPage` |
| **Components** | Les éléments réutilisables | `VoteBar`, `Button`, `Sidebar` |
| **API** | Les appels HTTP vers le backend | `sessionApi.ts`, `authApi.ts` |
| **Store (Redux)** | L'état partagé en temps réel | `sessionSlice`, `questionSlice` |

> « Les pages utilisent les components. Les appels REST passent par la couche API. Les données en temps réel passent par Redux + WebSocket. »

---

## 🔑 Concepts techniques — fiches simples

### REST API — c'est quoi ?

> « REST, c'est une façon de communiquer entre le client et le serveur avec HTTP.
> Le client envoie une **requête** (GET, POST, PATCH, DELETE), le serveur renvoie une **réponse**.
> C'est **sans état** : chaque requête est indépendante. Le serveur ne se souvient pas du client entre les requêtes. »

**Exemples dans Réagis :**
- `POST /api/auth/login` → se connecter, recevoir un token
- `GET /api/sessions/my-sessions` → récupérer mes sessions
- `PATCH /api/sessions/:id/start` → démarrer une session

**Si on te demande la différence avec WebSocket :**
> « REST, c'est comme envoyer un email : tu envoies, tu attends la réponse.
> WebSocket, c'est comme un appel téléphonique : la connexion reste ouverte, les deux côtés peuvent parler à tout moment. »

### MongoDB — c'est quoi ?

> « MongoDB est une base de données **NoSQL**. Au lieu de tables avec des lignes et des colonnes (comme SQL), on stocke des **documents** au format JSON.
> C'est flexible : chaque document peut avoir une structure un peu différente. »

**Les 4 collections de Réagis :**

```
User ──1:N──► Session ──1:N──► Question ──1:N──► Vote
                                    │
                                    └── options[] (sous-documents)
```

> « Un User (présentateur) crée plusieurs Sessions.
> Chaque Session a plusieurs Questions.
> Chaque Question a des options embarquées (sous-documents) et reçoit des Votes. »

**Si on te demande pourquoi MongoDB et pas SQL :**
> « Les options de chaque question sont toujours lues avec la question. En MongoDB, on peut les embarquer directement comme sous-documents — c'est une seule lecture au lieu d'un JOIN. Et le format JSON est naturel pour une API REST. »

### WebSocket (Socket.io) — c'est quoi ?

> « WebSocket est un protocole qui permet une connexion **persistante** entre le client et le serveur.
> Le serveur peut envoyer des données au client **sans que le client les demande**.
> Socket.io est une librairie qui ajoute des fonctionnalités utiles : les **rooms** et les **events**. »

**Les rooms :**
> « Chaque session a sa propre room : `session:<id>`.
> Quand un participant vote, le serveur envoie le résultat uniquement aux gens dans cette room.
> Les autres sessions ne reçoivent rien. »

**Les événements — 4 du client vers le serveur, 8 du serveur vers les clients :**

| Direction | Événement | C'est quoi |
|-----------|-----------|------------|
| Client → Serveur | `join_session` | Un participant rejoint la session |
| Client → Serveur | `submit_vote` | Un participant vote |
| Client → Serveur | `send_reaction` | Un participant envoie un emoji |
| Serveur → Clients | `vote_update` | Les compteurs de votes ont changé |
| Serveur → Clients | `question_changed` | Le présentateur a changé de question |
| Serveur → Clients | `session_started` | La session a démarré |
| Serveur → Clients | `participant_count` | Le nombre de participants a changé |

> « Les noms de ces événements sont définis dans `packages/shared/wsEvents.ts`.
> C'est la **source de vérité** : le back et le web importent le même fichier. »

### Redux — c'est quoi ?

> « Redux est un **gestionnaire d'état** pour React.
> L'état (les données) est centralisé dans un **store**. Quand l'état change, tous les composants qui utilisent cette donnée se mettent à jour automatiquement. »

**Pourquoi Redux dans Réagis ?**
> « Parce que les données en temps réel (votes, compteur de participants, statut de la session) doivent être accessibles par **plusieurs composants** en même temps.
> Avec `useState`, chaque composant a son propre état — les données ne se partagent pas facilement. »

**Le flux Redux + WebSocket :**

```
Socket.io event arrive
  → socketMiddleware le reçoit
    → dispatch une action Redux
      → le slice met à jour l'état
        → les composants React se re-rendent
```

> « Le middleware est le pont entre Socket.io et Redux.
> Il transforme les événements WebSocket en actions Redux. »

---

## 🔐 Auth et rôles — comment l'expliquer

### Deux types d'utilisateurs, deux systèmes

| | Présentateur | Participant |
|---|---|---|
| **Compte** | Email + mot de passe | Aucun (anonyme) |
| **Token** | JWT signé avec `JWT_SECRET` | JWT signé avec `PARTICIPANT_JWT_SECRET` |
| **Durée** | 1 heure | 6 heures |
| **Contenu du JWT** | `{ userId, role }` | `{ sessionId, participantToken }` |
| **Middleware** | `authenticateToken` | `authenticateParticipant` |

> « Il y a **deux secrets JWT différents**. Même si un token participant est volé, il ne peut pas accéder aux routes du présentateur. C'est une séparation de sécurité. »

### Comment le participant est identifié (sans compte)

> « Le participant n'a pas de compte. Voici comment on l'identifie : »

```
1. Le navigateur génère un deviceId unique (stocké dans localStorage)
2. Le serveur calcule : SHA256(deviceId + sessionId) = participantToken
3. Ce token est signé dans un JWT et renvoyé au client
```

> « C'est **déterministe** : même appareil + même session = même token.
> Si le participant rafraîchit la page, il récupère le même token.
> Mais dans une autre session, le token est différent — pas de traçage entre sessions. »

**Si on te demande pourquoi SHA256 :**
> « Pour créer un identifiant unique et stable sans stocker de session côté serveur. Le hash est toujours le même pour les mêmes entrées, donc le participant peut se reconnecter. »

---

## 💡 Points de code importants — à montrer si le prof demande

### 1. Anti-double vote (le plus important à montrer)

**Fichier** : `apps/back/src/models/Vote.ts` (lignes 35-42)

```typescript
// Index unique partiel — la base de données refuse le doublon
voteSchema.index(
  { question: 1, participantToken: 1 },
  { unique: true, partialFilterExpression: { participantToken: { $exists: true } } }
);
```

> « L'unicité du vote n'est **pas** vérifiée par le code. C'est un **index unique** dans MongoDB.
> Même si 100 votes arrivent en même temps, la base rejette les doublons.
> Le code applicatif attrape l'erreur `11000` et renvoie un message clair. »

**Pourquoi `partialFilterExpression` ?**

Imaginons qu'on ajoute le vote par compte utilisateur (champ `user` au lieu de `participantToken`). Sans filtre partiel, voici ce qui se passe :

| question | participantToken | user |
|----------|-----------------|------|
| Q1 | `abc123` | — |
| Q1 | `def456` | — |
| Q1 | **undefined** | `userId_A` |
| Q1 | **undefined** | `userId_B` |

Les lignes 3 et 4 ont la même combinaison `{ question: Q1, participantToken: undefined }`. L'index unique voit ça comme un **doublon** et bloque `userId_B`. MongoDB traite `undefined` comme une vraie valeur dans l'index.

Avec `partialFilterExpression: { participantToken: { $exists: true } }`, l'index **ignore** les documents où `participantToken` n'existe pas. Il vérifie l'unicité seulement sur les documents qui ont ce champ. Les autres passent librement.

Le deuxième index `{ question, user }` avec son propre filtre partiel s'occupe des lignes 3 et 4. Chaque index gère **son type d'identité** sans interférer avec l'autre.

### 2. Compteur atomique $inc

**Fichier** : `apps/back/src/sockets/voteHandler.ts` (lignes 67-70)

```typescript
// Pas de read-modify-write, pas de race condition
await Question.findByIdAndUpdate(
  question._id,
  { $inc: { [`options.${optionIndex}.votes`]: 1 } },
  { new: true }
);
```

**Sans `$inc` — le problème (read-modify-write) :**

```typescript
// Approche naïve en 3 étapes :
const question = await Question.findById(id);       // 1. lire → 10
const newVotes = question.options[0].votes + 1;      // 2. calculer → 11
question.options[0].votes = newVotes;
await question.save();                                // 3. écrire → 11
```

Ça marche avec un vote à la fois. Mais avec deux votes simultanés :

```
Temps    Vote A                    Vote B
─────    ──────                    ──────
  1      lit votes = 10            lit votes = 10
  2      calcule 10 + 1 = 11      calcule 10 + 1 = 11
  3      écrit 11                  écrit 11
```

Résultat : **11** au lieu de **12**. Un vote est perdu. C'est une **race condition**.

**Avec `$inc` — opération atomique :**

On ne lit pas, on n'ajoute pas, on ne réécrit pas. On dit juste à MongoDB : « ajoute 1 ». MongoDB fait le tout en **une seule opération** interne, avec un verrou sur le document.

```
Temps    Vote A                    Vote B
─────    ──────                    ──────
  1      $inc +1 (10→11)          attend…
  2                                $inc +1 (11→12)
```

Résultat : **12**. Aucun vote perdu. « Atomique » veut dire : l'opération est **indivisible** — personne ne peut lire la valeur au milieu de la mise à jour.

### 3. Le middleware Socket.io ↔ Redux

**Fichier** : `apps/web/src/store/socketMiddleware.ts`

> « Ce fichier est le **pont** entre Socket.io et Redux. Il fait deux choses : »
>
> 1. **Intercepte les actions Redux** (`ws/connect`, `ws/submitVote`, etc.) et les transforme en émissions Socket.io
> 2. **Écoute les événements Socket.io** (`vote_update`, `question_changed`, etc.) et les transforme en actions Redux

```
Action Redux ws/submitVote
  → middleware intercepte
    → socket.emit('submit_vote', { questionId, optionIndex })

Événement Socket.io 'vote_update'
  → middleware écoute
    → dispatch(updateVotes(data))
      → composant React se met à jour
```

### 4. La machine à états (Session)

**Fichier** : `apps/back/src/controllers/sessionController.ts`

```
draft ──► active ◄──► paused ──► finished
                │                    │
                └──► finished ◄──────┘
```

> « Chaque transition est protégée côté serveur.
> On ne peut pas passer de `draft` à `finished` directement.
> Si le statut actuel n'est pas le bon, le serveur renvoie une erreur 409 (Conflict).
> Et seul le présentateur propriétaire peut changer l'état (sinon 403 Forbidden). »

### 5. Les events partagés (shared package)

**Fichier** : `packages/shared/wsEvents.ts`

```typescript
export const WsEvents = {
  JOIN_SESSION:    'join_session',
  SUBMIT_VOTE:     'submit_vote',
  VOTE_UPDATE:     'vote_update',
  QUESTION_CHANGED:'question_changed',
  // ...
} as const;
```

> « `as const` fait que TypeScript traite ces valeurs comme des constantes exactes, pas comme des strings.
> Si j'écris `WsEvents.SUBMITE_VOTE` avec une faute de frappe, TypeScript me dit tout de suite qu'il y a une erreur.
> C'est le contrat entre le backend et le frontend. »

---

## ❓ Questions possibles du prof — réponses préparées

### « Pourquoi Socket.io et pas juste WebSocket natif ? »

> « Socket.io ajoute des fonctionnalités importantes : les **rooms** (pour isoler chaque session), la **reconnexion automatique**, et les **acknowledgements** (le serveur peut confirmer qu'il a bien reçu un événement). WebSocket natif n'a pas ça. »

### « Pourquoi Redux et pas juste useState ? »

> « Parce que les données en temps réel sont utilisées par plusieurs composants. Le compteur de participants est dans le header, les votes sont dans les barres, le statut change l'affichage de toute la page. Avec Redux, un seul état centralisé met à jour tout automatiquement. »

### « Pourquoi pas une app mobile ? »

> « Pour réduire la friction. Les participants sont dans un bar, une conférence — ils ne vont pas télécharger une app pour répondre à un sondage de 5 minutes. Un lien ou un QR code, et c'est prêt. Le web mobile est suffisant, et le design est responsive. »

### « Comment vous gérez les votes en double ? »

> « Par la base de données. Un index unique partiel dans MongoDB garantit qu'un participant ne peut voter qu'une fois par question. C'est plus fiable que de vérifier dans le code, parce que même avec des requêtes simultanées, la base rejette le doublon. Le code attrape l'erreur 11000. »

### « Que se passe-t-il si un participant perd la connexion ? »

> « Le middleware Socket.io côté client sauvegarde les informations de connexion. Quand le socket se reconnecte automatiquement, le middleware ré-envoie l'événement `join_session` avec le même token. Le participant retrouve sa place dans la session sans rien faire. »

### « Pourquoi deux secrets JWT ? »

> « C'est une séparation de sécurité. Si le secret participant est compromis, les routes du présentateur restent protégées. Les deux middlewares vérifient des secrets différents et attachent les infos à des propriétés différentes de la requête (`req.user` vs `req.participant`). »

### « Comment les données arrivent en temps réel sur l'écran ? »

> « Le flux complet : un participant vote → le socket émet `submit_vote` → le serveur crée le Vote, incrémente le compteur avec `$inc`, puis broadcast `vote_update` à toute la room → le middleware Redux côté client reçoit l'événement et dispatch `updateVotes()` → le slice met à jour le store → les composants React qui lisent ces données se re-rendent automatiquement. »

### « C'est quoi `$inc` ? Pourquoi pas lire puis écrire ? »

> « `$inc` est une opération atomique de MongoDB. Au lieu de lire le compteur (10), ajouter 1 (11), et réécrire (11), MongoDB fait le +1 directement en une seule opération. Si deux votes arrivent en même temps, read-then-write pourrait perdre un vote (les deux lisent 10, les deux écrivent 11). Avec `$inc`, les deux passent (10 → 11 → 12). »

### « Pourquoi les options sont embarquées dans Question et pas dans une collection séparée ? »

> « Les options sont toujours lues avec leur question — jamais séparément. Les embarquer comme sous-documents évite un JOIN (ou un `populate` en Mongoose). C'est plus rapide et plus simple. Et comme le nombre d'options par question est petit (3-5), il n'y a pas de risque de faire grossir le document au-delà de la limite MongoDB. »

---

## 🗂️ Fichiers clés — aide-mémoire rapide

| Concept | Fichier | Ce qu'il fait |
|---------|---------|---------------|
| Modèles MongoDB | `apps/back/src/models/*.ts` | User, Session, Question, Vote |
| Auth présentateur | `apps/back/src/middleware/authenticateToken.ts` | Vérifie JWT_SECRET |
| Auth participant | `apps/back/src/middleware/authenticateParticipant.ts` | Vérifie PARTICIPANT_JWT_SECRET |
| Token participant | `apps/back/src/controllers/sessionController.ts` | SHA256(deviceId:sessionId) |
| Gestion des votes WS | `apps/back/src/sockets/voteHandler.ts` | Vote + $inc + broadcast |
| Rooms Socket.io | `apps/back/src/sockets/joinHandler.ts` | Join room + participant count |
| Events partagés | `packages/shared/wsEvents.ts` | Source de vérité des noms |
| Redux store | `apps/web/src/store/index.ts` | 4 slices + socketMiddleware |
| Middleware WS↔Redux | `apps/web/src/store/socketMiddleware.ts` | Pont Socket.io ↔ Redux |
| Page présentateur live | `apps/web/src/pages/presenter/PresentationPage.tsx` | Dashboard temps réel |
| Page participant | `apps/web/src/pages/participant/ParticipantSessionPage.tsx` | Vote + attente + résultats |
| Couche API | `apps/web/src/api/sessionApi.ts` | Tous les appels REST sessions |

---

## 🎤 Conseils pour la démo

1. **Ouvre les deux écrans côté à côté** : le présentateur (desktop) et un participant (mobile ou fenêtre étroite). L'effet "temps réel" est visible immédiatement.

2. **Fais voter la classe en vrai.** C'est le moment le plus impressionnant — les barres qui bougent en direct.

3. **Garde le DevTools ouvert** (onglet Network → WS) sur un écran pour montrer les messages WebSocket si le prof le demande.

4. **Si quelqu'un essaie de voter deux fois**, c'est une bonne chose ! Montre que la base refuse le doublon.

5. **Si le WiFi est lent**, pas de panique : Socket.io gère la reconnexion automatiquement. Tu peux même en parler : « regardez, la reconnexion est transparente ».

6. **Prépare la session à l'avance** avec des questions fun pour la classe (« Quel est le meilleur langage ? », « Pizza ou sushi ? »). Ça garde l'attention.

7. **Pour montrer le code** : ne montre que 2-3 fichiers max. Les plus impactants :
   - `voteHandler.ts` (le flux complet d'un vote)
   - `socketMiddleware.ts` (le pont WS ↔ Redux)
   - `Vote.ts` (l'index unique)
