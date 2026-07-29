import type { Server, Socket } from 'socket.io';
import { WsEvents, SessionStatus } from '@reagis/shared';
import Session from '../models/Session';
import { sessionRoom } from './rooms';

type JoinPayload = {
  code?: string;
  participantToken?: string;
};

type Ack = (res: { ok: boolean; error?: string; session?: unknown }) => void;

// On garde les infos du participant sur le socket lui-même : à la déconnexion
// on n'a plus le payload, mais on a besoin de savoir quelle room décrémenter.
export type SessionSocket = Socket & {
  data: {
    sessionId?: string;
    participantToken?: string;
  };
};

// Nombre de sockets actuellement dans la room (undefined = room vide).
export const participantCount = (io: Server, sessionId: string) =>
  io.sockets.adapter.rooms.get(sessionRoom(sessionId))?.size ?? 0;

export const broadcastParticipantCount = (io: Server, sessionId: string) => {
  io.to(sessionRoom(sessionId)).emit(WsEvents.PARTICIPANT_COUNT, {
    sessionId,
    count: participantCount(io, sessionId),
  });
};

export const registerJoinHandler = (io: Server, socket: SessionSocket) => {
  socket.on(WsEvents.JOIN_SESSION, async (payload: JoinPayload = {}, ack?: Ack) => {
    const code = payload.code?.trim().toUpperCase();

    if (!code || !payload.participantToken) {
      return ack?.({ ok: false, error: 'code et participantToken requis' });
    }

    try {
      const session = await Session.findOne({ code });

      if (!session) {
        return ack?.({ ok: false, error: 'Session introuvable' });
      }
      // On ne rejoint que les sessions ouvertes : une session en draft n'est pas
      // encore diffusée, une session finished est close.
      if (session.status !== SessionStatus.ACTIVE) {
        return ack?.({ ok: false, error: 'Session non active' });
      }

      const sessionId = String(session._id);

      socket.data.sessionId = sessionId;
      socket.data.participantToken = payload.participantToken;
      await socket.join(sessionRoom(sessionId));

      ack?.({
        ok: true,
        session: {
          id: sessionId,
          name: session.name,
          code: session.code,
          status: session.status,
          currentQuestionIndex: session.currentQuestionIndex,
          reaction: session.reaction,
          reactionCount: session.reactionCount,
        },
      });

      broadcastParticipantCount(io, sessionId);
    } catch (err) {
      console.error('[ws] join_session', err);
      ack?.({ ok: false, error: 'Erreur serveur' });
    }
  });

  socket.on('disconnect', () => {
    // Le socket est retiré de ses rooms juste après ce handler : sans
    // setImmediate on compterait le partant comme encore présent.
    const { sessionId } = socket.data;
    if (!sessionId) return;
    setImmediate(() => broadcastParticipantCount(io, sessionId));
  });
};
