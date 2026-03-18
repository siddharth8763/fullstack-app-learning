// =============================================================
// Auth API — RTK Query endpoints
// INTERVIEW: injectEndpoints() extends the base API with auth endpoints.
// RTK Query auto-generates React hooks:
//   useLoginMutation(), useRegisterMutation(), useRefreshTokenQuery()
//
// Mutation vs Query:
//   Query  = GET-like, auto-cached, refetchable
//   Mutation = POST/PUT/DELETE-like, triggers on demand, can invalidate cache
// =============================================================

import { baseApi } from './baseApi';

interface LoginRequest { email: string; password: string; }
interface RegisterRequest { email: string; password: string; name: string; }

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/auth/login
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // POST /api/auth/register
    register: builder.mutation<{ message: string; user: User }, RegisterRequest>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // POST /api/auth/refresh — reads cookie automatically (credentials: 'include')
    refreshToken: builder.mutation<{ accessToken: string }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),

    // POST /api/auth/logout
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      // INTERVIEW: invalidatesTags clears ALL cached data on logout.
      // This ensures stale data isn't shown to the next user.
      invalidatesTags: ['User', 'Users'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;
