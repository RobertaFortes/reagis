import type { Server } from 'socket.io';
import { registerJoinHandler, type SessionSocket } from './joinHandler';
import { registerVoteHandler } from './voteHandler';

// Point d'entrée unique des sockets : server.ts ne connaît que cette fonction.
export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    const s = socket as SessionSocket;
    registerJoinHandler(io, s);
    registerVoteHandler(io, s);
  });
};
