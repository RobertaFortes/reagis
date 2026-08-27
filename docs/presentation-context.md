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

### 4.5 useState plutot que Redux (MVP)
- Pages presentateur utilisent `useState` + `useEffect` pour les fetches
- Redux scaffolde mais vide — sera connecte quand le WebSocket poussera du state partage
- **Argument** : pragmatisme — pas de state partage = pas besoin de store global

### 4.6 TypeScript strict: false
- Adoption progressive, evite de bloquer le developpement sur des types
- **Argument** : choix conscient pour la velocite du MVP, pas un oubli

---

## 5. Securite

| Risque | Mitigation |
|--------|------------|
| Double vote | Index unique MongoDB (niveau DB, pas applicatif) |
| JWT vole | Expiration 1h (presentateur), 6h (participant) |
| Injection | Mongoose ODM (pas de queries brutes) |
| CORS | Restreint a `CLIENT_URL` configure |
| Mots de passe | bcrypt (salt rounds par defaut) |
| Routes de creation sans auth | Limitation connue du MVP — a securiser en S4 |

---

## 6. Modele de donnees

4 collections MongoDB :

- **User** : email, password (hash), name, role (presenter/participant)
- **Session** : name, code (unique, `RG-XXXX`), presenter (ref User), status (draft/active/finished), reaction (emoji configurable), reactionCount, currentQuestionIndex
- **Question** : session (ref), text, order, options[] (label + votes), status (pending/active/closed)
- **Vote** : question (ref), participantToken, optionIndex — index unique pour anti-doublon

**Relations** : User 1→N Session 1→N Question 1→N Vote

---

## 7. WebSocket — evenements temps reel

Les noms d'evenements sont definis dans `packages/shared/wsEvents.ts` (source de verite unique).
Room pattern : `session:${sessionId}`.

### Implementes (S3)

| Direction | Evenement | Payload | Description |
|-----------|-----------|---------|-------------|
| Client→Server | `join_session` | `{code, participantToken}` + ack callback | Rejoindre la room — ack: `{ok, session?}` |
| Client→Server | `presenter_join` | `{sessionId, token}` + ack callback | Presenter rejoint sa room — ack: `{ok}` |
| Client→Server | `submit_vote` | `{questionId, optionIndex}` + ack callback | Voter pour une option — ack: `{ok}` |
| Server→Clients | `vote_update` | `{questionId, options: [{label, votes}]}` | Compteurs mis a jour apres chaque vote |
| Server→Clients | `participant_count` | `{sessionId, count}` | Nb de participants connectes (join + disconnect) |

### Planifies (S4)

| Direction | Evenement | Payload | Description |
|-----------|-----------|---------|-------------|
| Client→Server | `send_reaction` | `{emoji}` | Envoyer un emoji (a implementer) |
| Server→Clients | `reaction_update` | `{sessionId, count}` | Compteur de reactions (a implementer) |
| Server→Clients | `question_changed` | `{sessionId, newQuestionIndex}` | Question suivante (a implementer) |
| Server→Clients | `session_ended` | `{sessionId}` | Session terminee (a implementer) |

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
| S3 | 24-28/08 | Temps reel P1 (Socket.io, WS↔Redux, dashboards) | **En cours** |
| S4 | 31/08-04/09 | Temps reel P2 (reactions, reconnexion, QR code) | A venir |
| S5 | 07-11/09 | Tests + UI (UI Kit, charge, responsive, demo data) | A venir |
| S6 | 14-19/09 | Repetition & buffer (speech, demo live, slides) | A venir |

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

**Q: Pourquoi Redux si vous utilisez useState partout ?**
R: Redux est scaffolde pour la phase WebSocket (S3-S4). Le state local suffit pour les pages CRUD. C'est un choix delibere, pas un oubli.

**Q: Comment un participant peut voter sans compte ?**
R: Token anonyme deterministe SHA256(deviceId + sessionId). Meme device = meme token = un seul vote. Pas de donnees personnelles stockees.

**Q: Et si quelqu'un ouvre deux onglets pour voter deux fois ?**
R: Meme deviceId → meme token → index unique MongoDB rejette le 2e vote. C'est garanti au niveau base de donnees.

**Q: Pourquoi vous avez abandonne l'app mobile ?**
R: Notre valeur centrale c'est le zero friction. Demander a 50 personnes dans une salle de telecharger une app avant de voter, c'est exactement le contraire. Un QR code → navigateur mobile, ca marche instantanement. C'est ce que font tous les leaders du marche (Kahoot, Mentimeter, Slido).

**Q: Mais React Native etait prevu au depart, c'est pas un echec ?**
R: C'est un pivot technique justifie. On a realise que la contrainte "app store" contredisait notre proposition de valeur. C'est une decision d'architecture, pas un abandon — le web responsive couvre le meme besoin avec moins de friction.
