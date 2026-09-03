import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface FloatingReaction {
  id: string;
  emoji: string;
  left: number; // 0-100 horizontal position %
}

export interface SessionState {
  id: string | null;
  name: string;
  code: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  reaction: string | null;
  reactionCount: number;
  participantCount: number;
  floatingReactions: FloatingReaction[];
}

const initialState: SessionState = {
  id: null,
  name: '',
  code: '',
  status: '',
  currentQuestionIndex: 0,
  totalQuestions: 0,
  reaction: null,
  reactionCount: 0,
  participantCount: 0,
  floatingReactions: [],
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
    updateQuestionIndex(state, action: PayloadAction<{ currentQuestionIndex: number; totalQuestions: number }>) {
      state.currentQuestionIndex = action.payload.currentQuestionIndex;
      state.totalQuestions = action.payload.totalQuestions;
    },
    clearSession() {
      return initialState;
    },
    updateReactionCount(state, action: PayloadAction<number>) {
      state.reactionCount = action.payload;
    },
    addFloatingReaction(state, action: PayloadAction<FloatingReaction>) {
      state.floatingReactions.push(action.payload);
    },
    removeFloatingReaction(state, action: PayloadAction<string>) {
      state.floatingReactions = state.floatingReactions.filter(r => r.id !== action.payload);
    },
  },
});

export const { setSession, updateParticipantCount, sessionStarted, sessionEnded, sessionPaused, sessionResumed, updateQuestionIndex, clearSession, updateReactionCount, addFloatingReaction, removeFloatingReaction } =
  sessionSlice.actions;
export default sessionSlice.reducer;
