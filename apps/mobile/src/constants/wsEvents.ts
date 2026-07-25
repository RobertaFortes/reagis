// Noms d'événements WebSocket — DUPLIQUÉS depuis packages/shared/wsEvents.ts.
//
// Choix assumé : le mobile (Expo/Metro) reste HORS du workspace npm du monorepo,
// car la résolution d'un package partagé via Metro est fragile. Le back et le web
// importent @reagis/shared ; le mobile recopie ces constantes ici.
//
// ⚠️ Doit rester synchronisé avec packages/shared/wsEvents.ts.
export const WsEvents = {
  // Client → Serveur
  JOIN_SESSION: 'join_session',
  SUBMIT_VOTE: 'submit_vote',
  SEND_REACTION: 'send_reaction',

  // Serveur → Clients
  VOTE_UPDATE: 'vote_update',
  REACTION_UPDATE: 'reaction_update',
  QUESTION_CHANGED: 'question_changed',
  SESSION_ENDED: 'session_ended',
  PARTICIPANT_COUNT: 'participant_count',
} as const;

export type WsEvent = (typeof WsEvents)[keyof typeof WsEvents];
