# Redux Toolkit & RTK Query Interview Notes

## Redux Fundamentals

### Core Concepts
- **Store**: Centralized state container
- **Actions**: Plain objects describing state changes
- **Reducers**: Pure functions that specify how state changes
- **Dispatch**: Function to send actions to the store
- **Selector**: Functions to extract data from the state

```typescript
// Traditional Redux
interface CounterState {
  value: number;
}

const initialState: CounterState = { value: 0 };

// Action types
const INCREMENT = 'counter/increment';
const DECREMENT = 'counter/decrement';

// Action creators
const increment = () => ({ type: INCREMENT });
const decrement = () => ({ type: DECREMENT });

// Reducer
const counterReducer = (
  state = initialState, 
  action: any
): CounterState => {
  switch (action.type) {
    case INCREMENT:
      return { ...state, value: state.value + 1 };
    case DECREMENT:
      return { ...state, value: state.value - 1 };
    default:
      return state;
  }
};
```

### Redux Toolkit (RTK)
- **configureStore**: Simplified store setup
- **createSlice**: Auto-generates actions and reducers
- **createAsyncThunk**: Handles async logic
- **createEntityAdapter**: Manages normalized data

```typescript
// Redux Toolkit approach
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1; // Immer allows direct mutation
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle async thunks
    builder
      .addCase(fetchCounter.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCounter.fulfilled, (state, action) => {
        state.status = 'idle';
        state.value = action.payload;
      });
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

## RTK Query

### Core Features
- **Data Fetching**: Built-in data fetching and caching
- **Automatic Caching**: Intelligent caching with tags
- **Background Updates**: Automatic refetching
- **Optimistic Updates**: Update UI before server response
- **Error Handling**: Built-in error state management

```typescript
// RTK Query API slice
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface User {
  id: number;
  name: string;
  email: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Auto-add auth token
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Post'], // Cache invalidation tags
  endpoints: (builder) => ({
    // Query endpoint (GET)
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['User'], // Cache tag
    }),
    
    // Mutation endpoint (POST)
    createUser: builder.mutation<User, Partial<User>>({
      query: (user) => ({
        url: 'users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'], // Invalidate cache
    }),
    
    // Optimistic update
    updateUser: builder.mutation<User, { id: number; updates: Partial<User> }>({
      query: ({ id, updates }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      optimisticUpdate: async ({ id, updates }, dispatch, getState) => {
        // Update cache immediately
        dispatch(
          apiSlice.util.updateQueryData('getUsers', undefined, (draft) => {
            const user = draft.find(user => user.id === id);
            if (user) {
              Object.assign(user, updates);
            }
          })
        );
      },
      // Revert on error
      onQueryStarted: async ({ id, updates }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic update
          dispatch(
            apiSlice.util.undoQueryData('getUsers', undefined)
          );
        }
      },
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = apiSlice;
```

## Advanced RTK Query Patterns

### Custom Base Query
```typescript
// Custom base query with retry logic
const baseQueryWithRetry = async (args: any, api: any, extraOptions: any) => {
  const result = await fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = (api.getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  })(args, api, extraOptions);

  // Retry on 5xx errors
  if (result.error && result.error.status >= 500) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return baseQueryWithRetry(args, api, extraOptions);
  }

  return result;
};
```

### Transform Response
```typescript
getUsers: builder.query<User[], void>({
  query: () => 'users',
  transformResponse: (response: { data: User[] }) => response.data,
  transformErrorResponse: (response: { status: string; message: string }) => ({
    status: response.status,
    message: response.message,
  }),
}),
```

### Conditional Fetching
```typescript
// Component usage
const UserList = ({ userId }: { userId?: number }) => {
  const {
    data: user,
    error,
    isFetching,
  } = useGetUserQuery(userId, {
    // Skip query if userId is not provided
    skip: !userId,
    // Polling
    pollingInterval: 30000,
  });

  if (!userId) return <div>Select a user</div>;
  if (isFetching) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{user?.name}</div>;
};
```

## State Management Patterns

### Normalized State with Entity Adapter
```typescript
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
}

// Entity adapter
const postsAdapter = createEntityAdapter<Post>({
  selectId: (post) => post.id,
  sortComparer: (a, b) => a.title.localeCompare(b.title),
});

interface PostsState extends EntityState<Post> {
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState({
    status: 'idle',
    error: null,
  }),
  reducers: {
    // CRUD operations
    addPost: postsAdapter.addOne,
    removePost: postsAdapter.removeOne,
    updatePost: postsAdapter.updateOne,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'idle';
        postsAdapter.setAll(state, action.payload);
      });
  },
});

// Selectors
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state: RootState) => state.posts);
```

### Middleware Configuration
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    posts: postsSlice.reducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Custom middleware options
      serializableCheck: {
        ignoredActions: [apiSlice.util.resetApiState.type],
      },
    }).concat(apiSlice.middleware),
});

// Enable refetchOnFocus/refetchOnReconnect behavior
setupListeners(store.dispatch);
```

## Common Interview Questions

### Q: What problems does Redux solve?
A: Redux solves:
- **State Management**: Centralized state for complex applications
- **Predictability**: Pure reducers make state changes predictable
- **Debugging**: Time-travel debugging and state history
- **Testing**: Pure functions are easy to test
- **Data Flow**: Unidirectional data flow

### Q: What is Redux Toolkit and why use it?
A: Redux Toolkit is the official recommended approach for Redux:
- **Less Boilerplate**: Reduces code by 90%
- **Immer Integration**: Allows direct state mutation
- **Built-in Best Practices**: Includes common patterns
- **Type Safety**: Excellent TypeScript support
- **RTK Query**: Built-in data fetching solution

### Q: How does RTK Query handle caching?
A: RTK Query provides:
- **Automatic Caching**: Responses cached by endpoint + parameters
- **Cache Tags**: Fine-grained cache invalidation
- **Background Updates**: Refetching in background
- **Subscriptions**: Real-time updates
- **Selective Updates**: Only update changed data

### Q: What are the benefits of normalized state?
A: Normalized state provides:
- **Single Source of Truth**: Each entity exists once
- **Easy Updates**: Update entity in one place
- **Performance**: Avoid deep object comparisons
- **Memory Efficiency**: Shared references
- **Consistency**: Prevent data duplication issues

### Q: How do you handle optimistic updates?
A: Optimistic updates in RTK Query:
1. Update cache immediately with `updateQueryData`
2. Make API call
3. Revert update if API call fails
4. Use `onQueryStarted` lifecycle hook

## Performance Optimization

### Memoization Strategies
```typescript
// Memoized selector with createSelector
import { createSelector } from '@reduxjs/toolkit';

const selectPosts = (state: RootState) => state.posts;
const selectUsers = (state: RootState) => state.users;
const selectCurrentUserId = (state: RootState) => state.auth.currentUserId;

const selectCurrentUserPosts = createSelector(
  [selectPosts, selectCurrentUserId],
  (posts, currentUserId) => posts.filter(post => post.authorId === currentUserId)
);
```

### Lazy Loading
```typescript
// Split API slices
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/users' }),
  endpoints: (builder) => ({
    // User-specific endpoints
  }),
});

export const postApi = createApi({
  reducerPath: 'postApi', 
  baseQuery: fetchBaseQuery({ baseUrl: '/api/posts' }),
  endpoints: (builder) => ({
    // Post-specific endpoints
  }),
});
```

### Bundle Size Optimization
```typescript
// Code split RTK Query endpoints
const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/admin' }),
  endpoints: (builder) => ({
    // Admin-only endpoints
  }),
});

// Conditionally add reducer
if (isAdmin) {
  store.injectEndpoints(adminApi.endpoints);
}
```

## Best Practices

### Store Structure
- **Feature-based organization**: Group related state
- **Normalized data**: Use entity adapters
- **Loading states**: Track async operation status
- **Error handling**: Centralized error management

### API Design
- **RESTful endpoints**: Follow REST conventions
- **Consistent responses**: Standard response format
- **Error handling**: Proper HTTP status codes
- **Documentation**: API documentation for teams

### Component Integration
- **Hooks-based**: Use generated hooks
- **Error boundaries**: Handle API errors gracefully
- **Loading states**: Show loading indicators
- **Optimistic UI**: Improve perceived performance

### Testing
- **Unit tests**: Test reducers and selectors
- **Integration tests**: Test API slices
- **Mock Service Worker**: Mock API responses
- **Component tests**: Test component integration

## Additional Interview Questions

### Q: When should you NOT use Redux?
A: Redux adds complexity. Avoid it when:
- The app is simple with little shared state (use `useState`/`useContext` instead).
- Only a few components need the data (lift state up or use Context).
- Server state is the primary concern (use RTK Query, React Query, or SWR instead).

### Q: What is the difference between Redux Thunk and Redux Saga?
A:
- **Thunk**: Simple. Actions can return functions instead of objects. Good for straightforward async operations.
- **Saga**: Uses ES6 generators (`function*`). Provides powerful side-effect management (debouncing, throttling, race conditions, cancellation). More complex but better for complex async flows.
- **RTK's `createAsyncThunk`** has largely replaced the need for both in modern apps.

### Q: How does Redux DevTools help debugging?
A: Redux DevTools allows:
- **Time-travel debugging**: Step forward/backward through dispatched actions.
- **Action inspection**: View the payload of every dispatched action.
- **State diff**: See exactly which fields in the state tree changed for each action.
- **Action replay**: Export/import action logs for reproducing bugs.

### Q: Redux vs Zustand vs React Context — when to use which?
A:
- **React Context**: For infrequently changing global values (theme, locale, auth user). Not optimized for frequent updates — causes full subtree re-renders.
- **Redux (RTK)**: For complex, centralized state with many inter-dependent slices, middleware needs, and developer tooling. Best at scale.
- **Zustand**: For simpler global state with minimal boilerplate. No Provider needed, selective subscriptions prevent unnecessary re-renders.
