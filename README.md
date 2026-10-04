# Réagis

Plateforme de réactions collectives en temps réel — projet de fin de cours, La Capsule 2026.

Un présentateur crée une session de sondage depuis son navigateur (desktop), les participants
la rejoignent en scannant un QR code ou en tapant un code `RG-XXXX` sur leur téléphone, votent
et envoient des réactions — les résultats s'affichent en direct. **Tout se passe dans le
navigateur, aucune application à télécharger.**

## Structure du monorepo

```
reagis/
├── apps/
│   ├── back/       Node + Express + Mongoose + Socket.io  (workspace @reagis/back)
│   └── web/        React + Redux Toolkit + Vite — présentateur + participant  (workspace @reagis/web)
├── packages/
│   └── shared/     Constantes partagées (événements WS, statuts de session)  (workspace @reagis/shared)
└── docs/           Architecture, API, schémas Mongo, UI Kit, wireframes, préparation soutenance
```

Le monorepo utilise les **npm workspaces** pour `apps/back`, `apps/web` et
`packages/shared` : le back et le web importent `@reagis/shared` (source unique de
vérité pour les noms d'événements WebSocket et les statuts).

## Stack

- **Langage** : TypeScript sur tout le monorepo (mode graduel — `strict: false`,
  pour permettre d'écrire du TS sans bloquer sur les types dès le départ)
- **Backend** : Node.js, Express, MongoDB (Mongoose), Socket.io — exécuté avec `tsx` en dev
- **Web** : React 18, Redux Toolkit, React Router, Vite — responsive (desktop pour le présentateur, mobile-first pour le participant)
- **Base de données** : MongoDB Atlas
- **Tests** : Vitest (+ Testing Library côté web)
- **Déploiement** : Vercel (web, `vercel.json`) + Render (API, `render.yaml`)

## Prérequis

- **Node.js 22** (version utilisée par l'équipe : 22.18.0, voir `.nvmrc`). Vérifier avec `node -v`.
- Une base **MongoDB** (Atlas ou locale).

> ⚠️ macOS : ne jamais lancer `npm install` avec `sudo`. Cela crée des fichiers appartenant
> à `root` dans le cache npm et casse toutes les installations suivantes.

## Setup rapide

Un seul `npm install` à la **racine** installe les dépendances du back, du web et du shared
(liés par les workspaces npm).

```bash
# 1. À la racine — installe back + web + shared (workspaces)
npm install

# 2. Variables d'environnement
cp apps/back/.env.example apps/back/.env   # remplir MONGO_URI, JWT_SECRET, PARTICIPANT_JWT_SECRET
cp apps/web/.env.example apps/web/.env     # VITE_API_URL / VITE_WS_URL → http://localhost:4000

# 3. (optionnel) Données de démo : session RG-42 avec une question active
npm -w @reagis/back run seed:demo

# 4. Lancer le back (terminal 1) — http://localhost:4000
npm -w @reagis/back run dev

# 5. Lancer le web (terminal 2) — http://localhost:5173
npm -w @reagis/web run dev
```

> Ne pas lancer `npm install` dans `apps/back` ou `apps/web` : leurs dépendances sont
> hissées à la racine par les workspaces. L'install se fait à la racine.

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm -w @reagis/back run dev` | API + WebSocket en mode watch (`tsx`), port 4000 |
| `npm -w @reagis/web run dev` | Front Vite, port 5173 |
| `npm -w @reagis/back run test` | Tests Vitest du back |
| `npm -w @reagis/web run test` | Tests Vitest + Testing Library du web |
| `npm -w @reagis/back run typecheck` | Vérification TypeScript du back |
| `npm -w @reagis/web run typecheck` | Vérification TypeScript du web |
| `npm -w @reagis/back run build` | Compilation `tsc` → `apps/back/dist` |
| `npm -w @reagis/web run build` | Build de production Vite → `apps/web/dist` |
| `npm -w @reagis/back run seed:demo` | Crée la session de démo `RG-42` |
| `npm -w @reagis/back run ws:demo` | Simule 2 participants WebSocket sur `RG-42` (le back doit tourner) |

## Routes de l'application web

| Route | Pour qui | Page |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Présentateur | Connexion / inscription |
| `/home`, `/sessions`, `/sessions/new` | Présentateur (auth) | Tableau de bord, liste, création |
| `/sessions/:id`, `/sessions/:id/edit` | Présentateur (auth) | Pilotage / édition d'une session |
| `/sessions/:id/present` | Présentateur (auth) | Vue projection plein écran (QR code) |
| `/join` | Participant | Saisir ou scanner un code |
| `/session/:code` | Participant | Attente → vote → résultats |

## Variables d'environnement

Voir `apps/back/.env.example` et `apps/web/.env.example`. Ne jamais commit un fichier `.env` réel.

| Variable | App | Rôle |
|---|---|---|
| `PORT` | back | Port de l'API (défaut 4000) |
| `MONGO_URI` | back | Connection string MongoDB |
| `JWT_SECRET` | back | Signature des JWT présentateur (1 jour) |
| `PARTICIPANT_JWT_SECRET` | back | Signature des JWT participant (6 h) — secret distinct |
| `CLIENT_URL` | back | Origine autorisée par CORS (URL du front) |
| `VITE_API_URL` | web | URL de l'API (ex. `http://localhost:4000`) — **obligatoire**, Vite n'a pas de proxy |
| `VITE_WS_URL` | web | URL du serveur Socket.io (défaut `http://localhost:4000`) |

## Problèmes fréquents

### `EACCES` / `EEXIST` pendant `npm install`

Des fichiers du cache npm appartiennent à `root` (conséquence d'un ancien `sudo npm install`).

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

### Les appels API renvoient du HTML ou une 404

`VITE_API_URL` n'est pas défini dans `apps/web/.env` : les requêtes partent vers le serveur
Vite (5173) au lieu de l'API (4000). Redémarrer `npm run dev` après avoir modifié le `.env`.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/architecture-overview.md`](docs/architecture-overview.md) | Vue d'ensemble : monorepo, routes web, flux de bout en bout |
| [`docs/api-routes.md`](docs/api-routes.md) | Référence des routes REST et événements liés |
| [`docs/auth-et-websocket.md`](docs/auth-et-websocket.md) | Authentification (présentateur / participant) et Socket.io |
| [`docs/state-management.md`](docs/state-management.md) | Redux, `socketMiddleware`, qui utilise quoi |
| [`docs/schemas-mongo.md`](docs/schemas-mongo.md) | Modélisation MongoDB (champs, index, machine à états) |
| [`docs/DESIGN.md`](docs/DESIGN.md) · [`docs/ui-kit.html`](docs/ui-kit.html) | Design system Kinetic Noir |
| [`docs/wireframes/`](docs/wireframes/) | Wireframes basse fidélité |
| [`docs/journal-technique.md`](docs/journal-technique.md) | Journal des décisions techniques |
| [`docs/presentation-context.md`](docs/presentation-context.md) · [`docs/guide-presentation.md`](docs/guide-presentation.md) | Préparation de la soutenance et de la démo |
| [`docs/roadmap-trello.csv`](docs/roadmap-trello.csv) | Planning initial des 6 sprints |

## Équipe

Projet réalisé en binôme dans le cadre du titre RNCP — La Capsule.
