import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface VotesState {
  /** IDs des questions pour lesquelles le participant a déjà voté. */
  votedQuestions: string[];
}

const initialState: VotesState = {
  votedQuestions: [],
};

const votesSlice = createSlice({
  name: 'votes',
  initialState,
  reducers: {
    markVoted(state, action: PayloadAction<string>) {
      if (!state.votedQuestions.includes(action.payload)) {
        state.votedQuestions.push(action.payload);
      }
    },
    clearVotes() {
      return initialState;
    },
  },
});

export const { markVoted, clearVotes } = votesSlice.actions;
export default votesSlice.reducer;
