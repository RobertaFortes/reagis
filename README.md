# Réagis

Plateforme de réactions collectives en temps réel — projet de fin de cours, La Capsule 2026.

## Structure du monorepo

```
reagis/
├── apps/
│   ├── back/       Node + Express + Mongoose + Socket.io  (workspace)
│   └── web/        React + Redux (présentateur + participant)  (workspace)
├── packages/
│   └── shared/     Types et constantes partagés (événements WS, statuts...) (workspace)
└── docs/           Wireframes, UI Kit, schémas Mongo, notes d'architecture
```

Le monorepo utilise les **npm workspaces** pour `apps/back`, `apps/web` et
`packages/shared` : le back et le web importent `@reagis/shared` (source unique de
vérité pour les noms d'événements WebSocket et les statuts).

## Stack

- **Langage** : TypeScript sur tout le monorepo (mode graduel/leniente — `strict: false`,
  pour permettre d'écrire du TS sans bloquer sur les types dès le départ)
- **Backend** : Node.js, Express, MongoDB (Mongoose), Socket.io — exécuté avec `tsx`
- **Web** : React, Redux (Redux Toolkit), build Vite — responsive (desktop pour le présentateur, mobile-first pour le participant)
- **Base de données** : MongoDB Atlas

## Prérequis

- **Node.js 22** (version utilisée par l'équipe : 22.18.0). Vérifier avec `node -v`.

> ⚠️ macOS : ne jamais lancer `npm install` avec `sudo`. Cela crée des fichiers appartenant
> à `root` dans le cache npm et casse toutes les installations suivantes.

## Setup rapide

Un seul `npm install` à la **racine** installe les dépendances du back, du web et du shared
(liés par les workspaces npm).

```bash
# À la racine — installe back + web + shared (workspaces)
npm install

# Backend
cd apps/back
cp .env.example .env   # remplir les variables
npm run dev            # tsx watch src/server.ts

# Web
cd apps/web
npm run dev            # vite
```

> Ne pas lancer `npm install` dans `apps/back` ou `apps/web` : leurs dépendances sont
> hissées à la racine par les workspaces. L'install se fait à la racine.

## Variables d'environnement

Voir `.env.example` dans chaque app. Ne jamais commit un fichier `.env` réel.

## Problèmes fréquents

### `EACCES` / `EEXIST` pendant `npm install`

Des fichiers du cache npm appartiennent à `root` (conséquence d'un ancien `sudo npm install`).

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — UI Kit (couleurs, typographie, composants)
- [`docs/schemas-mongo.md`](docs/schemas-mongo.md) — modélisation MongoDB
- [`docs/wireframes/`](docs/wireframes/) — wireframes basse fidélité

## Équipe

Projet réalisé en binôme dans le cadre du titre RNCP — La Capsule.
