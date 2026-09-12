# Journal technique — Réagis

> Journal des décisions techniques et étapes de développement.
> Mis à jour à chaque session de travail. Entrées les plus récentes en premier.

---
## 2026-09-10 — Audit SEO LandingPage 
état actuel est 99 Performance / 91 Accessibilité / 100 Bonnes pratiques / 83 SEO
1. apps/web/index.html — Ajouter une meta description
2. apps/web/public/robots.txt — création de apps/web/public/robots.txt
3. apps/web/public/sitemap.xml — Création de apps/web/public/sitemap.xml
4. apps/web/public/logo.png et logo-icon.png — Performance Convertis les logo en WebP.
5. Faire du lazy loading des routes pour éviter de charger toutes les pages ou les composants non nécessaire

## 2026-08-27 — Audit contrat front/back et documentation API

**Contexte :** Avant d'avancer sur le temps réel (S3), audit complet de l'alignement entre les routes backend et les appels frontend, plus revue des conventions de nommage (clean code).

**Ce qu'on a trouvé :**

1. **Bug URL dupliquée dans `authApi.ts`**
   - Le fallback `VITE_API_URL ?? "/api/auth"` concaténé avec `/api/auth/login` produisait `/api/auth/api/auth/login`
   - Fonctionnait uniquement parce que `VITE_API_URL` est défini dans le `.env`

2. **Rota morta `/vote/:code`**
   - `ParticipantSessionPage` fait `navigate('/vote/${code}')` sur l'événement WS `session:started`, mais cette route n'existe pas dans `App.tsx`

3. **Deux patterns WebSocket concurrents**
   - Le presenter utilise le middleware Redux (`socketMiddleware.ts`) — pattern correct
   - Le participant crée un socket raw directement dans le composant, bypass Redux entièrement
   - Les événements WS du participant (`session:started`, `session:updated`) ne correspondent pas aux constantes partagées de `@reagis/shared`

4. **Auth guards manquants**
   - Backend : `POST /api/sessions`, `POST /api/questions`, `DELETE /api/questions/:id`, `PATCH /reorder` n'exigent aucune authentification
   - Frontend : aucune protection de route côté React Router

5. **Dead code**
   - `wsConnect`, `wsSubmitVote`, `wsSendReaction` (action creators), `markVoted` (slice) — jamais appelés

**Documentation créée/mise à jour :**

| Fichier | Action |
|---------|--------|
| `docs/api-routes.md` | Créé — référence complète de toutes les routes REST |
| `docs/schemas-mongo.md` | Réécrit — schemas détaillés avec types, contraintes, index |
| `docs/presentation-context.md` | Corrigé — JWT 1h (pas 7j), événements WS actualisés |
| `docs/journal-technique.md` | Complété — entrées S1 et S3 ajoutées |

---

## 2026-08-25 — Temps réel P1 : Socket.io rooms, presenter dashboard live

**Contexte :** Sprint S3 — connecter le dashboard présentateur au temps réel. Les slices Redux existaient mais étaient vides. Objectif : que les votes apparaissent en direct sur `SessionDetailPage`.

**Ce qu'on a fait :**

1. **Handlers WebSocket backend**
   - `joinHandler.ts` — gère `join_session` (participant rejoint la room), broadcast `participant_count` au join et disconnect
   - `presenterHandler.ts` — gère `presenter_join` (vérification JWT + ownership de la session)
   - `voteHandler.ts` — gère `submit_vote` (validation, création Vote, `$inc` atomique, broadcast `vote_update`)
   - `rooms.ts` — helper pour le naming des rooms (`session:${sessionId}`)
   - `index.ts` — point d'entrée qui enregistre tous les handlers

2. **Middleware Redux WebSocket (`socketMiddleware.ts`)**
   - Intercepte les actions `ws*` pour émettre les événements Socket.io correspondants
   - Écoute les événements serveur et dispatch les actions Redux (`updateVotes`, `setQuestion`, `updateParticipantCount`, etc.)
   - Utilise les constantes `WsEvents` du package `@reagis/shared`

3. **Dashboard présentateur live (`SessionDetailPage`)**
   - Se connecte via `wsPresenterConnect` au montage
   - Les barres de vote (`VoteBar`) se mettent à jour en temps réel via Redux
   - Le compteur de participants est affiché dans un KPI

4. **Page participant (`ParticipantSessionPage`)**
   - Flow de join : `joinSessionByCode` (REST) pour obtenir le token, puis connexion WS
   - Écoute `session:started` et `session:updated` directement (sans Redux)

**Choix techniques :**

- **Middleware Redux pour le presenter, socket raw pour le participant** — choix pragmatique pour avancer vite. À unifier en S4 en migrant le participant vers le même middleware.
- **Ack callbacks sur tous les événements WS** — le serveur confirme chaque action avec `{ ok: true/false, error? }`, le client peut réagir aux erreurs sans devoir écouter un événement d'erreur séparé.

**Alternative écartée :**

- Passer les votes par REST (`POST /api/votes/vote`) puis rafraîchir — aurait fonctionné mais sans temps réel. Le endpoint REST existe comme fallback.

---

## 2026-08-24 — Connexion des formulaires aux routes CRUD (sessions & questions) - Refactoring Button et alias path
*
**Contexte :** Les pages presenter (HomePage, SessionPage, CreateSessionPage, SessionDetailPage) affichaient des données mockées/hardcoded. Les routes CRUD backend existaient déjà mais le frontend ne les appelait pas. Aucune couche API côté client pour les sessions/questions (seul `authApi.ts` existait).

**Ce qu'on a fait :**

1. **Couche API frontend**
   - Créé `apps/web/src/api/sessionApi.ts` — `createSession()`, `getMySessions()`, `getSessionById()`
   - Créé `apps/web/src/api/questionApi.ts` — `createQuestion()`, `deleteQuestion()`, `getQuestionsBySession()`
   - Même pattern que `authApi.ts` (fetch, error class, token via localStorage)

2. **Pages connectées aux vraies données**
   - **HomePage** — fetch `GET /api/sessions/my-sessions`, badge dynamique (EN DIRECT / BROUILLON / TERMINÉE), état vide, loading, erreur
   - **SessionPage** — même fetch + recherche locale fonctionnelle (filtre par nom)
   - **CreateSessionPage** — flow en 2 étapes : créer la session (`POST /api/sessions`), puis ajouter des questions (`POST /api/questions`) avec suppression (`DELETE /api/questions/:id`)
   - **SessionDetailPage** — fetch session + questions en parallèle (`Promise.all`), KPIs réels, question en cours avec pourcentages

3. *Nouvelle route backend**
   - Ajouté `GET /api/questions/session/:sessionId` — manquait pour récupérer les questions d'une session

**Choix techniques :**

- **State local (`useState`) plutôt que Redux** — les slices Redux existaient mais étaient tous vides. Pour des pages qui font un fetch au montage, `useState` + `useEffect` suffit. Redux sera pertinent quand on aura du state partagé (ex : session live avec WebSocket).
- **Code session auto-généré côté client** (format `RG-XXXX`) — évite un champ formulaire supplémentaire, le backend vérifie l'unicité (erreur 409 si doublon).
- **Création en 2 étapes** (session puis questions) — le modèle Question exige un `sessionId` comme foreign key. L'UI reflète ça : le formulaire de questions apparaît après la création de la session.

**Alternative écartée :**

- Envoyer session + questions en une seule requête — aurait nécessité une route custom avec transaction MongoDB. Complexité non justifiée pour le MVP, et le flow en 2 étapes donne un meilleur feedback utilisateur.

**Fichiers créés/modifiés :**

| Fichier | Action |
|---------|--------|
| `apps/web/src/api/sessionApi.ts` | Créé |
| `apps/web/src/api/questionApi.ts` | Créé |
| `apps/web/src/pages/presenter/HomePage.tsx` | Modifié |
| `apps/web/src/pages/presenter/SessionPage.tsx` | Réécrit |
| `apps/web/src/pages/presenter/CreateSessionPage.tsx` | Réécrit |
| `apps/web/src/pages/presenter/SessionDetailPage.tsx` | Réécrit |
| `apps/back/src/controllers/questionController.ts` | Ajout `getQuestionsBySession` |
| `apps/back/src/routes/questionRoutes.ts` | Ajout route GET |

4. **Refactorisation de l'interface utilisateur autour d'un composant Button réutilisable**
- Création du composant Button avec gestion des variantes primary et secondary.
- Remplacement des boutons HTML existants dans :
      CreateSessionPage
      HomePage
      LoginPage
      SessionDetailPage
      SessionPage
Conservation des différents types de boutons (button, submit, reset).
Ajout de la navigation vers /sessions/new depuis l'accueil et la page des sessions.
Conservation de la logique existante de connexion et d'inscription.
Uniformisation du rendu des actions principales de l'application.
**Bénéfices**
- Cette refactorisation permet de centraliser la gestion des boutons, d'améliorer la cohérence de l'UI et de faciliter les évolutions futures du UI Kit.

| Fichier | Action |
|---------|--------|
|`apps/web/src/components/Button.tsx`| Créé|
|`apps/web/src/pages/presenter/CreateSessionPage.tsx`| Modifié|
|`apps/web/src/pages/presenter/HomePage.tsx`| Modifié|
|`apps/web/src/pages/presenter/LoginPage.tsx`| Modifié|
|`apps/web/src/pages/presenter/SessionDetailPage.tsx`| Modifié|
|`apps/web/src/pages/presenter/SessionPage.tsx`| Modifié|

5. **Refactorisation configuration d'un alias de chemins (path alias)**
- Permet de remplacer les import exemple : Sidebar from "../../components/Sidebar"; par import Sidebar from "@/components/Sidebar";
**Bénéfices**
- Simplifier et fiabiliser les imports dans le projet REAGIS (React/TypeScript)
- Imports plus lisibles et meilleure adaptabilité si on déplace des fichiers

| Fichier                                              | Action  |
| ---------------------------------------------------- | ------- |
| `apps/web/src/components/AppLayout.tsx`              | Modifié |
| `apps/web/src/components/Sidebar.tsx`                | Modifié |
| `apps/web/src/pages/presenter/CreateSessionPage.tsx` | Modifié |
| `apps/web/src/pages/presenter/HomePage.tsx`          | Modifié |
| `apps/web/src/pages/presenter/LoginPage.tsx`         | Modifié |
| `apps/web/src/pages/presenter/SessionDetailPage.tsx` | Modifié |
| `apps/web/src/pages/presenter/SessionPage.tsx`       | Modifié |
| `apps/web/src/store/index.ts`                        | Modifié |
| `apps/web/src/App.tsx`                               | Modifié |
| `apps/web/src/main.tsx`                              | Modifié |
| `apps/web/tsconfig.json`                             | Modifié |
| `apps/web/vite.config.ts`                            | Modifié |

---

## 2026-08-14 — Sprint S1 : Fondations (repo, schemas, auth, wireframes)

**Contexte :** Démarrage du projet. Mise en place de l'infrastructure technique : monorepo, base de données, authentification, et wireframes.

**Ce qu'on a fait :**

1. **Setup monorepo npm workspaces**
   - Structure `apps/back`, `apps/web`, `packages/shared`
   - Scripts de développement (`tsx watch` pour le back, Vite pour le web)
   - Fichier `.nvmrc` (Node 22.18.0)

2. **Schemas Mongoose**
   - `User` — email unique, password bcrypt, role (presenter/participant)
   - `Session` — code unique uppercase, machine à états (draft/active/finished), réaction configurable
   - `Question` — options embarquées avec compteur dénormalisé, index compound `{session, order}`
   - `Vote` — index uniques partiels sur `{question, participantToken}` et `{question, user}`

3. **Auth présentateur**
   - Signup (`POST /api/auth/signup`) — hash bcrypt, rôle forcé à `presenter`
   - Login (`POST /api/auth/login`) — vérification bcrypt, génération JWT
   - Middleware `authenticateToken` pour protéger les routes presenter
   - Middleware `authenticateParticipant` séparé (JWT secret distinct)

4. **Redux store scaffoldé**
   - Slices vides : `sessionSlice`, `questionSlice`, `votesSlice`, `uiSlice`
   - Structure prête pour la connexion WebSocket (S3)

5. **Wireframes HTML interactifs**
   - `docs/wireframes/presentateur.html` — dashboard, création session, détail session
   - `docs/wireframes/participant.html` — join, vote, résultats
   - `docs/wireframes/index.html` — page d'index avec navigation

6. **Package shared**
   - `packages/shared/wsEvents.ts` — constantes d'événements WebSocket, source de vérité unique

**Choix techniques :**

- **Index unique au niveau DB pour les votes** (pas de vérification applicative) — garantit l'intégrité même sous charge concurrente. Même pattern recommandé par la doc MongoDB.
- **Deux JWT secrets distincts** (presenter vs participant) — isolation des contextes d'authentification. Un token participant volé ne peut pas accéder aux routes presenter.
- **Options embarquées dans Question** (pas une collection séparée) — les options sont toujours lues avec la question, jamais indépendamment. Sous-documents = une seule lecture MongoDB.

**Pivot important :**

- **Abandon de React Native** au profit du web responsive. Raison : la proposition de valeur de Réagis est le "zéro friction" — forcer le téléchargement d'une app en pleine conférence contredit cet objectif. Kahoot, Mentimeter, Slido fonctionnent tous dans le navigateur. Le web responsive couvre le même besoin avec moins de friction.
