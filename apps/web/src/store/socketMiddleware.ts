import type { Middleware } from '@reduxjs/toolkit';
import { WsEvents } from '@reagis/shared';
import { socket } from '@/socket';
import { setSession, updateParticipantCount, sessionStarted, sessionEnded, updateReactionCount, sessionPaused, sessionResumed, updateQuestionIndex, addFloatingReaction, removeFloatingReaction } from './sessionSlice';
import { updateVotes, setQuestion } from './questionSlice';
import { setConnected, setError } from './uiSlice';

// Actions dispatched by components to drive the socket connection.
// They are intercepted by the middleware and never reach the reducers.
export const wsConnect = (participantToken: string, code: string) => ({
  type: 'ws/connect' as const,
  payload: { participantToken, code },
});

export const wsDisconnect = () => ({ type: 'ws/disconnect' as const });

export const wsPresenterConnect = (sessionId: string) => ({
  type: 'ws/presenterConnect' as const,
  payload: { sessionId },
});

export const wsSubmitVote = (questionId: string, optionIndex: number) => ({
  type: 'ws/submitVote' as const,
  payload: { questionId, optionIndex },
});

export const wsSendReaction = (emoji: string) => ({
  type: 'ws/sendReaction' as const,
  payload: { emoji },
});

export const socketMiddleware: Middleware = (store) => {
  // Credentials du dernier join — permet de re-rejoindre la room après reconnexion.
  let lastJoin:
    | { role: 'participant'; participantToken: string; code: string }
    | { role: 'presenter'; sessionId: string; token: string }
    | null = null;

  function rejoin() {
    if (!lastJoin) return;

    if (lastJoin.role === 'participant') {
      const { participantToken, code } = lastJoin;
      socket.emit(
        WsEvents.JOIN_SESSION,
        { code, participantToken },
        (res: any) => {
          if (res.ok) {
            store.dispatch(setSession(res.session));
            if (res.question) {
              store.dispatch(setQuestion(res.question));
            }
          } else {
            store.dispatch(setError(res.error ?? 'Impossible de rejoindre'));
          }
        }
      );
    } else {
      const { sessionId, token } = lastJoin;
      socket.emit(
        WsEvents.PRESENTER_JOIN,
        { sessionId, token },
        (res: any) => {
          if (res.ok) {
            store.dispatch(updateParticipantCount(res.participantCount ?? 0));
          } else {
            store.dispatch(setError(res.error ?? 'Impossible de rejoindre'));
          }
        }
      );
    }
  }

  // Bind WS listeners once — they dispatch into Redux.
  function bindListeners() {
    socket.on('connect', () => {
      store.dispatch(setConnected(true));
      store.dispatch(setError(null));
      // Premier connect ou reconnexion : (re-)rejoindre la room
      rejoin();
    });

    socket.on('disconnect', () => {
      store.dispatch(setConnected(false));
    });

    socket.on('connect_error', (err: Error) => {
      store.dispatch(setError(err.message));
    });

    socket.on(WsEvents.VOTE_UPDATE, (data: any) => {
      store.dispatch(updateVotes(data));
    });

    socket.on(WsEvents.QUESTION_CHANGED, (data: any) => {
      store.dispatch(setQuestion({
        id: data.id,
        text: data.text,
        options: data.options,
        status: data.status,
        order: data.currentQuestionIndex !== undefined ? data.currentQuestionIndex + 1 : 0,
        total: data.totalQuestions ?? 0,
      }));
      if (data.currentQuestionIndex !== undefined) {
        store.dispatch(updateQuestionIndex({
          currentQuestionIndex: data.currentQuestionIndex,
          totalQuestions: data.totalQuestions,
        }));
      }
    });

    socket.on(WsEvents.PARTICIPANT_COUNT, (data: any) => {
      store.dispatch(updateParticipantCount(data.count));
    });

    socket.on(WsEvents.REACTION_UPDATE, (data: any) => {
      store.dispatch(updateReactionCount(data.reactionCount));
      const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const left = 10 + Math.random() * 80;
      store.dispatch(addFloatingReaction({ id, emoji: data.emoji || '👍', left }));
      setTimeout(() => store.dispatch(removeFloatingReaction(id)), 3000);
    });

    socket.on(WsEvents.SESSION_STARTED, () => {
      store.dispatch(sessionStarted());
    });

    socket.on(WsEvents.SESSION_PAUSED, () => {
      store.dispatch(sessionPaused());
    });

    socket.on(WsEvents.SESSION_RESUMED, () => {
      store.dispatch(sessionResumed());
    });

    socket.on(WsEvents.SESSION_ENDED, () => {
      store.dispatch(sessionEnded());
    });

  }

  let listenersBound = false;

  return (next) => (action: any) => {
    switch (action.type) {
      case 'ws/connect': {
        if (!listenersBound) {
          bindListeners();
          listenersBound = true;
        }

        const { participantToken, code } = action.payload;
        lastJoin = { role: 'participant', participantToken, code };

        if (!socket.connected) {
          socket.connect();
        } else {
          rejoin();
        }
        break;
      }

      case 'ws/presenterConnect': {
        if (!listenersBound) {
          bindListeners();
          listenersBound = true;
        }

        const { sessionId } = action.payload;
        const token = localStorage.getItem('reagis_token');

        if (!token) {
          store.dispatch(setError('Non authentifié'));
          break;
        }

        lastJoin = { role: 'presenter', sessionId, token };

        if (!socket.connected) {
          socket.connect();
        } else {
          rejoin();
        }
        break;
      }

      case 'ws/disconnect': {
        lastJoin = null;
        socket.disconnect();
        break;
      }

      case 'ws/submitVote': {
        const { questionId, optionIndex } = action.payload;
        socket.emit(
          WsEvents.SUBMIT_VOTE,
          { questionId, optionIndex },
          (res: any) => {
            if (!res.ok) {
              store.dispatch(setError(res.error ?? 'Erreur de vote'));
            }
          }
        );
        break;
      }

      case 'ws/sendReaction': {
        socket.emit(WsEvents.SEND_REACTION, action.payload);
        break;
      }

      default:
        break;
    }

    return next(action);
  };
};
