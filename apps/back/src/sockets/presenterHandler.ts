import type { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WsEvents } from '@reagis/shared';
import Session from '../models/Session';
import { sessionRoom } from './rooms';
import { participantCount } from './joinHandler';
import type { SessionSocket } from './joinHandler';
import type { JwtPayload } from '../types/auth';

type PresenterJoinPayload = {
  sessionId?: string;
  token?: string;
};

type Ack = (res: { ok: boolean; error?: string; participantCount?: number }) => void;

export const registerPresenterHandler = (io: Server, socket: SessionSocket) => {
  socket.on(WsEvents.PRESENTER_JOIN, async (payload: PresenterJoinPayload = {}, ack?: Ack) => {
    const { sessionId, token } = payload;

    if (!sessionId || !token) {
      return ack?.({ ok: false, error: 'sessionId et token requis' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const session = await Session.findById(sessionId);
      if (!session) {
        return ack?.({ ok: false, error: 'Session introuvable' });
      }

      if (String(session.presenter) !== decoded.userId) {
        return ack?.({ ok: false, error: 'Non autorisé' });
      }

      socket.data.sessionId = sessionId;
      await socket.join(sessionRoom(sessionId));

      const count = await participantCount(io, sessionId);

      ack?.({
        ok: true,
        participantCount: count,
      });
    } catch (err: any) {
      if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
        return ack?.({ ok: false, error: 'Token invalide ou expiré' });
      }
      console.error('[ws] presenter_join', err);
      ack?.({ ok: false, error: 'Erreur serveur' });
    }
  });
};
