import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  connected: boolean;
  error: string | null;
}

const initialState: UiState = {
  connected: false,
  error: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setConnected, setError } = uiSlice.actions;
export default uiSlice.reducer;
