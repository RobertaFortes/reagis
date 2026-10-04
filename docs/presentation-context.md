# Reagis — Contexte de presentation

> Document de reference pour preparer la soutenance de fin de formation.
> Regroupe les choix techniques, l'architecture, et les arguments defensables.

---

## 1. Pitch

**Reagis** est une plateforme de reactions collectives en temps reel.
Un presentateur cree une session de sondage depuis un dashboard web, genere un QR code, et les participants votent/reagissent depuis leur navigateur mobile — les resultats s'affichent en direct. **Tout se passe dans le navigateur, aucune app a telecharger.**

**Cas d'usage** : conferences, cours, bars (quiz), evenements corporate.

---

## 2. Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Backend | Node.js + Express + TypeScript | Ecosysteme JavaScript unifie, formation La Capsule |
| Base de donnees | MongoDB (Mongoose) | Schema flexible, denormalisation des compteurs |
| Temps reel | Socket.io | Abstraction WebSocket + fallback, rooms natives |
| Frontend web | React 18 + Redux Toolkit + Vite | SPA performante, state management previsible |
| Monorepo | npm workspaces | Back + web + shared dans un seul repo |
| Auth | JWT (presentateur) + token anonyme SHA256 (participant) | Pas de compte pour les participants = zero friction |
| Tests | Vitest (+ Testing Library cote web) | Meme outil que Vite, configuration minimale |
| Deploiement | Vercel (web) + Render (API) | `vercel.json` / `render.yaml` versionnes |

---

## 3. Architecture

```
┌─────────────────┐                  ┌──────────────┐     Mongoose     ┌──────────┐
│  Web presentateur├── REST + JWT ──►│  Express API  ├────────────────►│ MongoDB  │
│  (desktop)       │◄── Socket.io ──┤  :4000        │                 │ Atlas    │
└─────────────────┘                  └───────┬───────┘                 └──────────┘
                                             │
┌─────────────────┐     REST + WS    ┌───────┘
│  Web participant ├────────────────┘
│  (mobile browser)│
└─────────────────┘
```

**Tout est web** — le participant ouvre un lien ou scanne un QR code, zero telechargement.

**Flux de donnees** :
1. Le presentateur cree une session + questions (REST)
2. Les participants rejoignent via un code `RG-XXXX` ou QR code dans leur navigateur (REST → token anonyme)
3. Les votes sont soumis via WebSocket → stockes en MongoDB → diffuses en broadcast
4. Le dashboard presentateur se met a jour en temps reel

---

## 4. Choix techniques defensables

### 4.1 Denormalisation des compteurs de vote
- Les votes sont comptes en temps reel via `$inc` atomique sur `Question.options[].votes`
- **Pourquoi** : evite de faire un `count()` a chaque affichage, performant sous charge
- **Argument** : meme pattern utilise par MongoDB dans leurs guides de bonnes pratiques

### 4.2 Prevention du double vote par index unique
- Index unique MongoDB `{ question, participantToken }` avec `partialFilterExpression`
- **Pourquoi** : la base de donnees elle-meme rejette les doublons, meme sous requetes concurrentes
- **Argument** : plus fiable qu'un `if (alreadyVoted)` applicatif qui peut souffrir de race conditions

### 4.3 Token participant anonyme deterministe
- `SHA256(deviceId + sessionId)` → meme device + meme session = meme token
- **Pourquoi** : permet de rejoindre sans compte, tout en empechant le multi-vote
- **Argument** : zero friction pour les participants, pas de RGPD sur les donnees personnelles

### 4.4 Tout web, pas d'app mobile native
- Decision initiale : app React Native pour les participants, web pour le presentateur
- **Pivot** : tout passe par le web (responsive mobile-first pour les participants)
- **Pourquoi** : l'idee centrale est la participation sans friction. Forcer le telechargement d'une app en pleine conference/quiz = friction maximale. Un QR code → navigateur = zero friction.
- **Argument** : c'est exactement ce que font Kahoot, Mentimeter, Slido — tout dans le navigateur

### 4.5 useState pour le CRUD, Redux pour le temps reel
- Pages formulaires/listes (Home, Sessions, Create, Edit, Login) : `useState` + `useEffect` pour les fetches REST
- Donnees temps reel (statut, question courante, votes, participants, reactions) : Redux, alimente par le `socketMiddleware` (pont Socket.io ↔ Redux)
- **Argument** : pragmatisme — Redux seulement la ou plusieurs composants partagent un etat qui change en direct

### 4.6 TypeScript strict: false
- Adoption progressive, evite de bloquer le developpement sur des types
- **Argument** : choix conscient pour la velocite du MVP, pas un oubli

---

## 5. Securite

| Risque | Mitigation |
|--------|------------|
| Double vote | Index unique MongoDB (niveau DB, pas applicatif) |
| JWT vole | Expiration 1 jour (presentateur), 6h (participant) ; deux secrets distincts |
| Acces aux sessions d'un autre | Controle « proprietaire » (403) sur toutes les transitions et la suppression |
| Injection | Mongoose ODM (pas de queries brutes) |
| CORS | Restreint a `CLIENT_URL` (retombe sur `*` si la variable n'est pas definie) |
| Mots de passe | bcrypt (10 salt rounds) |
| Routes de creation sans auth | Limitation connue — `POST /sessions` et les routes `questions` ne sont pas encore protegees |
| Identite de vote WS | Limitation connue — le serveur utilise le JWT participant brut, non verifie (voir `auth-et-websocket.md`) |

---

## 6. Modele de donnees

4 collections MongoDB :

- **User** : email, password (hash), name, role (presenter/participant)
- **Session** : name, code (unique, `RG-XXXX`), presenter (ref User), status (draft/active/paused/finished), reaction (emoji configurable), reactionCount, currentQuestionIndex, startedAt, endedAt
- **Question** : session (ref), text, order, options[] (label + votes), status (pending/active/closed)
- **Vote** : question (ref), participantToken, optionIndex — index unique pour anti-doublon

**Relations** : User 1→N Session 1→N Question 1→N Vote

---

## 7. WebSocket — evenements temps reel

Les noms d'evenements sont definis dans `packages/shared/wsEvents.ts` (source de verite unique).
Room pattern : `session:${sessionId}`.

Tous les evenements de `wsEvents.ts` sont implementes.

| Direction | Evenement | Payload | Description |
|-----------|-----------|---------|-------------|
| Client→Server | `join_session` | `{code, participantToken}` + ack | Rejoindre la room — ack: `{ok, session, question}` |
| Client→Server | `presenter_join` | `{sessionId, token}` + ack | Presenter rejoint sa room — ack: `{ok, participantCount}` |
| Client→Server | `submit_vote` | `{questionId, optionIndex}` + ack | Voter pour une option — ack: `{ok}` ou `{ok:false, error}` |
| Client→Server | `send_reaction` | `{emoji}` | Envoyer une reaction |
| Server→Clients | `vote_update` | `{questionId, options: [{label, votes}]}` | Compteurs mis a jour apres chaque vote |
| Server→Clients | `participant_count` | `{sessionId, count}` | Nb de participants connectes (join + disconnect) |
| Server→Clients | `reaction_update` | `{sessionId, reactionCount, emoji}` | Compteur + emoji flottant |
| Server→Clients | `question_changed` | `{id, text, options, status, currentQuestionIndex?, totalQuestions?}` | Nouvelle question courante |
| Server→Clients | `session_started` / `session_paused` / `session_resumed` / `session_ended` | `{sessionId, status}` | Changements d'etat de la session |

Les commandes du presentateur (start, pause, next...) passent par REST ; le controleur emet ensuite l'evenement dans la room. En cas de coupure, Socket.io se reconnecte et le middleware re-emet automatiquement le join.

---

## 8. Design system — Kinetic Noir

- **Philosophie** : instrument de precision, net, reactif, affirme
- **Theme sombre** : optimise pour environnements peu eclaires (bars, conferences)
- **Couleur primaire** : orange (#D85A30 / #ffb59e) — reserve aux etats interactifs et indicateurs "en direct"
- **Typo** : Sora (titres, geometrique) + Geist (body, semi-monospace pour compteurs stables)
- **Layout** : desktop 12 colonnes (presentateur), mobile 1 colonne (participant)
- Spec complete : `docs/DESIGN.md`

---

## 9. Planning (6 sprints)

| Sprint | Dates | Focus | Statut |
|--------|-------|-------|--------|
| S1 | 10-14/08 | Fondations (repo, schemas, auth, wireframes) | Done |
| S2 | 17-21/08 | Core CRUD (sessions, questions, vote, forms) | Done |
| S3 | 24-28/08 | Temps reel P1 (Socket.io, WS↔Redux, dashboards) | Done |
| S4 | 31/08-04/09 | Temps reel P2 (reactions, reconnexion, QR code, pause) | Done |
| S5 | 07-11/09 | Tests + UI (UI Kit, tests Vitest, responsive, demo data) | Done |
| S6 | 14-19/09 | Repetition & buffer (speech, demo live, slides) | — |

Reste a faire (voir `docs/plano-entregaveis.md`) : proteger les routes de creation, verifier le JWT participant dans `join_session`, etendre la couverture de tests.

---

## 10. Points forts pour la soutenance

1. **Architecture temps reel fonctionnelle** — WebSocket bidirectionnel avec rooms par session
2. **Anti-triche au niveau DB** — pas de hack applicatif, MongoDB garantit l'integrite
3. **Zero friction participant** — pas de compte, pas d'app a telecharger, juste un QR code → navigateur
4. **Monorepo structure** — code partage via npm workspaces + package shared
5. **Design system documente** — UI Kit complet avant le code (approche design-first)
6. **Scalabilite pensee** — compteurs atomiques, pas de count() en temps reel
7. **Pivot justifie** — abandon du mobile natif au profit du web responsive, coherent avec la vision zero friction

---

## 11. Questions jury anticipees

**Q: Pourquoi pas Firebase/Supabase au lieu de votre propre backend ?**
R: On voulait maitriser le WebSocket et comprendre le flux temps reel de bout en bout. Firebase abstrait trop pour un projet d'apprentissage.

**Q: Comment vous gerez 100 participants qui votent en meme temps ?**
R: `$inc` atomique MongoDB + index unique = pas de race condition, pas de double vote. Socket.io gere le broadcast a toute la room.

**Q: Pourquoi Redux si vous utilisez aussi useState ?**
R: Redux sert uniquement aux donnees temps reel (statut, question courante, votes, participants, reactions) lues par plusieurs composants et mises a jour par le WebSocket via un middleware. Les pages CRUD gardent du state local. C'est un choix delibere, pas un oubli.

**Q: Comment un participant peut voter sans compte ?**
R: Token anonyme deterministe SHA256(deviceId + sessionId). Meme device = meme token = un seul vote. Pas de donnees personnelles stockees.

**Q: Et si quelqu'un ouvre deux onglets pour voter deux fois ?**
R: Cible : meme deviceId → meme participantToken → l'index unique MongoDB rejette le 2e vote. ⚠️ Aujourd'hui l'UI bloque le re-vote via `localStorage`, mais cote serveur l'identite WS est le JWT participant (different a chaque join) : deux onglets ouverts en meme temps peuvent encore voter deux fois. A corriger avant la demo (verifier le JWT dans `joinHandler`) ou a presenter honnetement comme limite connue.

**Q: Pourquoi vous avez abandonne l'app mobile ?**
R: Notre valeur centrale c'est le zero friction. Demander a 50 personnes dans une salle de telecharger une app avant de voter, c'est exactement le contraire. Un QR code → navigateur mobile, ca marche instantanement. C'est ce que font tous les leaders du marche (Kahoot, Mentimeter, Slido).

**Q: Mais React Native etait prevu au depart, c'est pas un echec ?**
R: C'est un pivot technique justifie. On a realise que la contrainte "app store" contredisait notre proposition de valeur. C'est une decision d'architecture, pas un abandon — le web responsive couvre le meme besoin avec moins de friction.
