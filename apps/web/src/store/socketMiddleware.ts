import type { Middleware } from '@reduxjs/toolkit';
import { WsEvents } from '@reagis/shared';
import { socket } from '@/socket';
import { setSession, updateParticipantCount, sessionEnded } from './sessionSlice';
import { updateVotes, setQuestion } from './questionSlice';
import { setConnected, setError } from './uiSlice';

// Actions dispatched by components to drive the socket connection.
// They are intercepted by the middleware and never reach the reducers.
export const wsConnect = (participantToken: string, code: string) => ({
  type: 'ws/connect' as const,
  payload: { participantToken, code },
});

export const wsDisconnect = () => ({ type: 'ws/disconnect' as const });

export const wsSubmitVote = (questionId: string, optionIndex: number) => ({
  type: 'ws/submitVote' as const,
  payload: { questionId, optionIndex },
});

export const wsSendReaction = (emoji: string) => ({
  type: 'ws/sendReaction' as const,
  payload: { emoji },
});

export const socketMiddleware: Middleware = (store) => {
  // Bind WS listeners once — they dispatch into Redux.
  function bindListeners() {
    socket.on('connect', () => {
      store.dispatch(setConnected(true));
      store.dispatch(setError(null));
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
      store.dispatch(setQuestion(data));
    });

    socket.on(WsEvents.PARTICIPANT_COUNT, (data: any) => {
      store.dispatch(updateParticipantCount(data.count));
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

        if (!socket.connected) {
          socket.connect();
        }

        // Wait for the connection before emitting join.
        const emitJoin = () => {
          socket.emit(
            WsEvents.JOIN_SESSION,
            { code, participantToken },
            (res: any) => {
              if (res.ok) {
                store.dispatch(setSession(res.session));
              } else {
                store.dispatch(setError(res.error ?? 'Impossible de rejoindre'));
              }
            }
          );
        };

        if (socket.connected) {
          emitJoin();
        } else {
          socket.once('connect', emitJoin);
        }
        break;
      }

      case 'ws/disconnect': {
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
