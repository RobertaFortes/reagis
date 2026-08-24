import { configureStore } from '@reduxjs/toolkit';

// Slices à créer au fur et à mesure (semaine 1 : structure vide) :
import sessionReducer from '@/store/sessionSlice';
import questionReducer from '@/store/questionSlice';
import votesReducer from '@/store/votesSlice';
import uiReducer from '@/store/uiSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    question: questionReducer,
    votes: votesReducer,
    ui: uiReducer,
  },
});

// Types inférés du store — base pour les hooks typés des futurs slices.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
