// Noms d'événements WebSocket partagés entre back, web et mobile.
// Un seul point de vérité évite les typos entre les 3 apps.

module.exports = {
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
};
