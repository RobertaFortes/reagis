import type { Server, Socket } from 'socket.io';
import { WsEvents, SessionStatus } from '@reagis/shared';
import Session from '../models/Session';
import Question from '../models/Question';
import { sessionRoom } from './rooms';

type JoinPayload = {
  code?: string;
  participantToken?: string;
};

type Ack = (res: { ok: boolean; error?: string; session?: unknown; question?: unknown }) => void;

// On garde les infos du participant sur le socket lui-même : à la déconnexion
// on n'a plus le payload, mais on a besoin de savoir quelle room décrémenter.
export type SessionSocket = Socket & {
  data: {
    sessionId?: string;
    participantToken?: string;
  };
};

// Nombre de participants (exclut le presenter) dans la room.
export const participantCount = async (io: Server, sessionId: string) => {
  const room = sessionRoom(sessionId);
  const socketIds = io.sockets.adapter.rooms.get(room);
  if (!socketIds) return 0;

  let count = 0;
  for (const sid of socketIds) {
    const s = io.sockets.sockets.get(sid);
    if (s?.data.participantToken) count++;
  }
  return count;
};

export const broadcastParticipantCount = async (io: Server, sessionId: string) => {
  const count = await participantCount(io, sessionId);
  io.to(sessionRoom(sessionId)).emit(WsEvents.PARTICIPANT_COUNT, {
    sessionId,
    count,
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
      // On rejoint les sessions en draft (en attente) ou active.
      // Seules les sessions terminées sont fermées aux nouveaux participants.
      if (session.status === SessionStatus.FINISHED) {
        return ack?.({ ok: false, error: 'Session terminée' });
      }

      const sessionId = String(session._id);

      socket.data.sessionId = sessionId;
      socket.data.participantToken = payload.participantToken;
      await socket.join(sessionRoom(sessionId));

      // Si la session est active, envoyer aussi la question courante
      let currentQuestion = null;
      if (session.status === SessionStatus.ACTIVE || session.status === SessionStatus.PAUSED) {
        const questions = await Question.find({ session: session._id }).sort({ order: 1 });
        const q = questions[session.currentQuestionIndex];
        if (q) {
          currentQuestion = {
            id: q._id,
            text: q.text,
            options: q.options.map((o: any) => ({ label: o.label, votes: o.votes })),
            status: q.status,
          };
        }
      }

      const totalQuestions = await Question.countDocuments({ session: session._id });

      ack?.({
        ok: true,
        session: {
          id: sessionId,
          name: session.name,
          code: session.code,
          status: session.status,
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions,
          reaction: session.reaction,
          reactionCount: session.reactionCount,
        },
        question: currentQuestion,
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
