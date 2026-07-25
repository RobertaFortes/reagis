# Réagis

Plateforme de réactions collectives en temps réel — projet de fin de cours, La Capsule 2026.

## Structure du monorepo

```
reagis/
├── apps/
│   ├── back/       Node + Express + Mongoose + Socket.io
│   ├── web/        React + Redux (présentateur)
│   └── mobile/     React Native (participant)
├── packages/
│   └── shared/     Types et constantes partagés (événements WS, statuts...)
└── docs/           Wireframes, UI Kit, schémas Mongo, notes d'architecture
```

## Stack

- **Backend** : Node.js, Express, MongoDB (Mongoose), Socket.io
- **Web** : React, Redux
- **Mobile** : React Native (Expo)
- **Base de données** : MongoDB Atlas

## Prérequis

- **Node.js 22** (version utilisée par l'équipe : 22.18.0). Vérifier avec `node -v`.
- **Watchman** — **macOS uniquement**, obligatoire pour le mobile :
  ```bash
  brew install watchman
  ```
  Sans lui, Metro plante avec `EMFILE: too many open files`.
  Sur **Windows**, Watchman n'est pas nécessaire (Metro fonctionne sans).
- **Expo Go** sur le téléphone (App Store / Play Store). Le projet est sur le **SDK 54**,
  qui correspond à la version actuelle d'Expo Go.
- Le téléphone et l'ordinateur doivent être sur **le même réseau WiFi**.

> ⚠️ macOS : ne jamais lancer `npm install` avec `sudo`. Cela crée des fichiers appartenant
> à `root` dans le cache npm et casse toutes les installations suivantes.

### Notes Windows

- Lancer les commandes dans **PowerShell** ou **Git Bash** (pas cmd.exe).
- Si Metro ne se connecte pas au téléphone, c'est souvent le **pare-feu Windows** qui
  bloque le port 8081 : autoriser Node.js quand la fenêtre le demande, ou ouvrir le port.
- Les fins de ligne : le repo laisse Git gérer (`git config core.autocrlf true` côté Windows)
  pour éviter que chaque `git status` montre tous les fichiers comme modifiés.

## Setup rapide

Chaque app a son propre `package.json` et se lance indépendamment.

```bash
# Backend
cd apps/back
cp .env.example .env   # remplir les variables
npm install
npm run dev

# Web
cd apps/web
npm install
npm run dev

# Mobile
cd apps/mobile
npm install
npm start
```

## Variables d'environnement

Voir `.env.example` dans chaque app. Ne jamais commit un fichier `.env` réel.

## Problèmes fréquents

Erreurs rencontrées pendant le setup, avec leur solution.

### `EACCES` / `EEXIST` pendant `npm install`

Des fichiers du cache npm appartiennent à `root` (conséquence d'un ancien `sudo npm install`).

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

### `EMFILE: too many open files, watch`

Metro surveille trop de fichiers pour la limite de macOS. Installer Watchman :

```bash
brew install watchman
```

### Watchman : `Failed to open ~/Library/LaunchAgents/... Permission denied`

Le dossier `LaunchAgents` appartient à `root`. Symptôme trompeur : Metro démarre et
répond sur le port 8081, mais le bundle n'arrive jamais (le téléphone affiche
« Could not connect to development server »).

```bash
sudo chown $(whoami):staff ~/Library/LaunchAgents
watchman shutdown-server
```

Pour vérifier si c'est bien ça — `/status` répond vite, mais le bundle expire :

```bash
curl "http://localhost:8081/status"   # doit répondre immédiatement
```

### Expo Go : « project uses SDK 51 / Expo Go is SDK 54 »

Ne devrait plus arriver (le projet a été migré vers le SDK 54). Si ça revient, c'est que
les dépendances ont été réinstallées depuis un ancien lock :

```bash
cd apps/mobile
npx expo install --fix
```

### Repartir de zéro (mobile)

```bash
cd apps/mobile
rm -rf node_modules
npm install
npx expo start -c        # -c vide le cache de Metro
```

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — UI Kit (couleurs, typographie, composants)
- [`docs/schemas-mongo.md`](docs/schemas-mongo.md) — modélisation MongoDB
- [`docs/wireframes/`](docs/wireframes/) — wireframes basse fidélité (web + mobile)

## Équipe

Projet réalisé en binôme dans le cadre du titre RNCP — La Capsule.
