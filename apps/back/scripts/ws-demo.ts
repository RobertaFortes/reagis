// Client de test manuel : simule 2 participants sur la session de démo.
// Le serveur doit tourner (npm run dev) et la démo être semée (npm run seed:demo).
// Usage : npm run ws:demo
import 'dotenv/config';
import { io, type Socket } from 'socket.io-client';
import { WsEvents } from '@reagis/shared';

const URL = `http://localhost:${process.env.PORT || 4000}`;
const CODE = 'RG-42';

const connect = (label: string) =>
  new Promise<Socket>((resolve, reject) => {
    const s = io(URL, { transports: ['websocket'] });
    s.on('connect', () => {
      console.log(`[${label}] connecté (${s.id})`);
      resolve(s);
    });
    s.on('connect_error', (e) =>
      reject(new Error(`${label} : ${e.message} — le serveur tourne-t-il ?`))
    );
  });

// Les handlers répondent via l'ack de Socket.io : on attend la réponse.
const emit = (s: Socket, event: string, payload: unknown) =>
  new Promise<any>((resolve) => s.emit(event, payload, resolve));

(async () => {
  const alice = await connect('alice');
  const bob = await connect('bob');

  // On écoute les broadcasts avant de voter, sinon on rate l'événement.
  for (const [label, s] of [['alice', alice], ['bob', bob]] as const) {
    s.on(WsEvents.VOTE_UPDATE, (p) =>
      console.log(`[${label}] <- vote_update`, p.options.map((o: any) => `${o.label}=${o.votes}`).join(' '))
    );
    s.on(WsEvents.PARTICIPANT_COUNT, (p) => console.log(`[${label}] <- participant_count`, p.count));
  }

  const joinA = await emit(alice, WsEvents.JOIN_SESSION, { code: CODE, participantToken: 'tok-alice' });
  console.log('[alice] join ->', joinA);
  if (!joinA.ok) {
    console.log('\nAstuce : lancez `npm run seed:demo` pour créer la session', CODE);
    process.exit(1);
  }

  const joinB = await emit(bob, WsEvents.JOIN_SESSION, { code: CODE, participantToken: 'tok-bob' });
  console.log('[bob] join ->', joinB);

  // La question active de la session de démo.
  const questionId = process.argv[2];
  if (!questionId) {
    console.log('\nPassez le questionId affiché par seed:demo : npm run ws:demo -- <questionId>');
    process.exit(1);
  }

  console.log('\n--- alice vote TypeScript (index 0)');
  console.log('[alice] ack ->', await emit(alice, WsEvents.SUBMIT_VOTE, { questionId, optionIndex: 0 }));

  console.log('\n--- bob vote Python (index 1)');
  console.log('[bob] ack ->', await emit(bob, WsEvents.SUBMIT_VOTE, { questionId, optionIndex: 1 }));

  console.log('\n--- alice revote (doit être refusé par l’index unique)');
  console.log('[alice] ack ->', await emit(alice, WsEvents.SUBMIT_VOTE, { questionId, optionIndex: 2 }));

  // Laisse le temps aux broadcasts d'arriver avant de fermer.
  setTimeout(() => {
    alice.disconnect();
    bob.disconnect();
    process.exit(0);
  }, 1000);
})();
