// =============================================================
// Users API — RTK Query endpoints
// INTERVIEW: providesTags tells RTK Query what cache tags this
// query owns. When a mutation calls invalidatesTags, queries
// with matching providesTags are automatically refetched.
// =============================================================

import { baseApi } from './baseApi';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/users?page=1&limit=10
    getUsers: builder.query<PaginatedResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => `/users?page=${page}&limit=${limit}`,
      // INTERVIEW: providesTags for a list — use { type, id: 'LIST' } convention.
      // This way, creating/deleting a user invalidates the list but not individual items.
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'Users' as const, id: 'LIST' },
            ]
          : [{ type: 'Users' as const, id: 'LIST' }],
    }),

    // GET /api/users/:id
    getUserById: builder.query<{ data: User }, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'User', id }],
    }),

    // PUT /api/users/:id
    updateUser: builder.mutation<{ data: User }, { id: string; name: string }>({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'User', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // DELETE /api/users/:id (soft delete)
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
