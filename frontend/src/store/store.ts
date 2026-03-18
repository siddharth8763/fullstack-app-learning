// =============================================================
// Redux Store Configuration
// INTERVIEW: Redux Toolkit (RTK) is the official, opinionated way
// to write Redux. It reduces boilerplate via:
//   - createSlice: combines reducer + action creators
//   - createAsyncThunk: handles async action lifecycle
//   - configureStore: sets up Redux DevTools + middleware automatically
//
// RTK Query (part of RTK) is a data-fetching & caching solution.
// It auto-generates React hooks from endpoint definitions.
// Think of it as a smarter Axios/fetch + React Query combined.
// =============================================================

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './authSlice';
import { baseApi } from '../api/baseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // RTK Query automatically manages its own slice in the store
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    // INTERVIEW: RTK Query middleware handles cache lifetime,
    // polling, and invalidation logic automatically.
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// ── Typed Hooks ────────────────────────────────────────────────
// INTERVIEW: These typed wrappers give you full TypeScript autocomplete
// in components instead of using the untyped useSelector/useDispatch.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
