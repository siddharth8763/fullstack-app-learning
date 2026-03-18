// =============================================================
// Auth Slice — manages authentication state
// INTERVIEW: createSlice auto-generates action creators.
// We NEVER store tokens in localStorage (XSS risk).
// Access tokens live in memory (Redux store) — gone on refresh.
// Refresh tokens live in HttpOnly cookies — persistent, XSS-safe.
//
// Silent refresh: on app startup OR when an API call gets 401,
// we call /auth/refresh. If it succeeds, we get a new access token.
// If it fails (expired cookie), user is logged out.
// =============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

// INTERVIEW: PayloadAction<T> is RTK's typed action creator.
// It ensures the reducer receives the exact shape expected.
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
