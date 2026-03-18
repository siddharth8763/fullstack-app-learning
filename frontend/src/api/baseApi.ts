// =============================================================
// RTK Query — Base API Configuration
// INTERVIEW: RTK Query's createApi() defines:
//   - baseQuery: how to make HTTP requests (fetch here)
//   - endpoints: grouped API calls (auth, users, etc.)
//   - tagTypes: used for cache invalidation
//
// prepareHeaders injects the JWT access token from the Redux store
// into every request's Authorization header automatically.
//
// Re-auth (401 handling): fetchBaseQueryWithReauth wraps the base
// query — if we get a 401, it silently calls /auth/refresh, updates
// the store, and retries the original request. UX stays seamless.
// =============================================================

import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';
import { setCredentials, logout, updateAccessToken } from '../store/authSlice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ── Base Query with Bearer token injection ─────────────────────
const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api`,
  credentials: 'include',  // include cookies (refresh token)
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// ── Re-authentication wrapper ──────────────────────────────────
// INTERVIEW: This is the "silent refresh" pattern.
// When a 401 is received, the access token has expired.
// We use the refresh token (in cookie) to get a new access token.
// If refresh also fails, the user is logged out.
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Try to refresh the token
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);

    if (refreshResult.data) {
      const { accessToken } = refreshResult.data as { accessToken: string };
      // Update the token in the store
      api.dispatch(updateAccessToken(accessToken));
      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — log out
      api.dispatch(logout());
    }
  }

  return result;
};

// ── Create Base API ────────────────────────────────────────────
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // INTERVIEW: tagTypes enable cache invalidation.
  // When you invalidatesTags(['Users']), all queries with
  // providesTags(['Users']) are refetched automatically.
  tagTypes: ['User', 'Users'],
  endpoints: () => ({}),
});
