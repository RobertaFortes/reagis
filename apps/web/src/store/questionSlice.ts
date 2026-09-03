import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Option {
  label: string;
  votes: number;
}

export interface QuestionState {
  id: string | null;
  text: string;
  options: Option[];
  status: string;
  order: number;
  total: number;
}

const initialState: QuestionState = {
  id: null,
  text: '',
  options: [],
  status: '',
  order: 0,
  total: 0,
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    setQuestion(state, action: PayloadAction<QuestionState>) {
      Object.assign(state, action.payload);
    },
    updateVotes(
      state,
      action: PayloadAction<{ questionId: string; options: Option[] }>
    ) {
      if (state.id === action.payload.questionId) {
        state.options = action.payload.options;
      }
    },
    clearQuestion() {
      return initialState;
    },
  },
});

export const { setQuestion, updateVotes, clearQuestion } = questionSlice.actions;
export default questionSlice.reducer;
