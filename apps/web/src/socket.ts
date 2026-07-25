import { io, type Socket } from 'socket.io-client';
import { WsEvents } from '@reagis/shared';

// Connexion WebSocket du présentateur.
// Les noms d'événements viennent de @reagis/shared : une seule source de vérité
// partagée avec le back, ce qui élimine les typos entre client et serveur.
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export const socket: Socket = io(WS_URL, { autoConnect: false });

// Exemple de câblage typé — les handlers réels arriveront avec les slices Redux.
export function onQuestionChanged(handler: (payload: unknown) => void): void {
  socket.on(WsEvents.QUESTION_CHANGED, handler);
}
