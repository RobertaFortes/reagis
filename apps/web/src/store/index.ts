import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '@/store/sessionSlice';
import questionReducer from '@/store/questionSlice';
import votesReducer from '@/store/votesSlice';
import uiReducer from '@/store/uiSlice';
import { socketMiddleware } from '@/store/socketMiddleware';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    question: questionReducer,
    votes: votesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware),
});

// Types inférés du store — base pour les hooks typés des futurs slices.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
