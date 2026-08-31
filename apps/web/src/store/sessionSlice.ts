import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SessionState {
  id: string | null;
  name: string;
  code: string;
  status: string;
  currentQuestionIndex: number;
  reaction: string | null;
  reactionCount: number;
  participantCount: number;
}

const initialState: SessionState = {
  id: null,
  name: '',
  code: '',
  status: '',
  currentQuestionIndex: 0,
  reaction: null,
  reactionCount: 0,
  participantCount: 0,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<Omit<SessionState, 'participantCount'>>) {
      Object.assign(state, action.payload);
    },
    updateParticipantCount(state, action: PayloadAction<number>) {
      state.participantCount = action.payload;
    },
    sessionStarted(state) {
      state.status = 'active';
    },
    sessionEnded(state) {
      state.status = 'finished';
    },
    sessionPaused(state) {
      state.status = 'paused';
    },
    sessionResumed(state) {
      state.status = 'active';
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { setSession, updateParticipantCount, sessionStarted, sessionEnded, sessionPaused, sessionResumed, clearSession } =
  sessionSlice.actions;
export default sessionSlice.reducer;
