import type { Server } from 'socket.io';
import mongoose from 'mongoose';
import { WsEvents } from '@reagis/shared';
import Session from '../models/Session';
import Question from '../models/Question';
import Vote from '../models/Vote';
import { sessionRoom } from './rooms';
import type { SessionSocket } from './joinHandler';

type VotePayload = {
  questionId?: string;
  optionIndex?: number;
};

type Ack = (res: { ok: boolean; error?: string }) => void;

// Code Mongo "duplicate key" : renvoyé par l'index unique de Vote quand la même
// identité vote deux fois sur la même question.
const DUPLICATE_KEY = 11000;

export const registerVoteHandler = (io: Server, socket: SessionSocket) => {
  socket.on(WsEvents.SUBMIT_VOTE, async (payload: VotePayload = {}, ack?: Ack) => {
    const { sessionId, participantToken } = socket.data;

    // Impossible de voter sans avoir rejoint : le token vient du join, pas du
    // client, sinon n'importe qui pourrait voter au nom d'un autre.
    if (!sessionId || !participantToken) {
      return ack?.({ ok: false, error: 'Rejoignez la session avant de voter' });
    }

    const { questionId, optionIndex } = payload;
    // isValidObjectId en amont : sinon findById lève un CastError qui serait
    // journalisé comme une erreur serveur alors que c'est une entrée client.
    if (!questionId || !mongoose.isValidObjectId(questionId) || !Number.isInteger(optionIndex)) {
      return ack?.({ ok: false, error: 'questionId et optionIndex requis' });
    }

    try {
      const session = await Session.findById(sessionId);
      if (!session || session.status === 'paused') {
        return ack?.({ ok: false, error: 'Session en pause' });
      }

      const question = await Question.findById(questionId);

      if (!question || String(question.session) !== sessionId) {
        return ack?.({ ok: false, error: 'Question introuvable' });
      }
      if (question.status !== 'active') {
        return ack?.({ ok: false, error: 'Question fermée' });
      }
      if (optionIndex! < 0 || optionIndex! >= question.options.length) {
        return ack?.({ ok: false, error: 'Option invalide' });
      }

      // On écrit d'abord le vote : l'index unique est la seule garantie
      // anti-double-vote (pas de findOne + create, qui laisserait passer deux
      // votes concurrents entre la lecture et l'écriture).
      await Vote.create({
        question: question._id,
        participantToken,
        optionIndex,
      });

      // Le vote est accepté → on incrémente le compteur dénormalisé en atomique
      // et on récupère le document à jour pour diffuser les totaux exacts.
      const updated = await Question.findByIdAndUpdate(
        question._id,
        { $inc: { [`options.${optionIndex}.votes`]: 1 } },
        { new: true }
      );

      ack?.({ ok: true });

      io.to(sessionRoom(sessionId)).emit(WsEvents.VOTE_UPDATE, {
        questionId: String(question._id),
        options: (updated ?? question).options.map((o) => ({
          label: o.label,
          votes: o.votes,
        })),
      });
    } catch (err: any) {
      if (err?.code === DUPLICATE_KEY) {
        return ack?.({ ok: false, error: 'Vous avez déjà voté sur cette question' });
      }
      console.error('[ws] submit_vote', err);
      ack?.({ ok: false, error: 'Erreur serveur' });
    }
  });
};
