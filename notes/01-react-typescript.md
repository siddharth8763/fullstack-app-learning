# React & TypeScript Interview Notes

## Core React Concepts

### JSX and Components
- **JSX**: Syntax extension for JavaScript that allows writing HTML-like code
- **Functional Components**: Preferred over class components for modern React
- **Props**: Read-only data passed from parent to child components
- **State**: Mutable data managed within components using `useState`

```typescript
// Functional component with TypeScript
interface UserProps {
  name: string;
  age: number;
  onUpdate?: () => void;
}

const UserCard: React.FC<UserProps> = ({ name, age, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
};
```

### Hooks
- **useState**: Manages component state
- **useEffect**: Handles side effects and lifecycle
- **useContext**: Consumes context values
- **useReducer**: Alternative to useState for complex state logic
- **useMemo**: Memoizes expensive calculations
- **useCallback**: Memoizes functions
- **useRef**: Mutable ref object that persists across renders

```typescript
// Custom hook example
const useCounter = (initialValue: number = 0) => {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);
  
  return { count, increment, decrement };
};
```

## TypeScript in React

### Type Definitions
- **Props Interface**: Define component props with TypeScript interfaces
- **Generic Components**: Create reusable components with generics
- **Event Handlers**: Properly type event handlers
- **State Types**: Type your state variables

```typescript
// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage
const UserList = () => (
  <List<User> 
    items={users} 
    renderItem={user => <span>{user.name}</span>} 
  />
);
```

### Advanced TypeScript Patterns
- **Discriminated Unions**: Type-safe handling of different states
- **Utility Types**: `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`
- **Conditional Types**: Types that depend on other types

```typescript
// Discriminated union for loading states
type LoadingState<T> = 
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Component using discriminated union
const DataLoader = <T,>({ state }: { state: LoadingState<T> }) => {
  switch (state.status) {
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>Data: {JSON.stringify(state.data)}</div>;
    case 'error':
      return <div>Error: {state.error}</div>;
  }
};
```

## Performance Optimization

### React.memo
- Prevents unnecessary re-renders of functional components
- Shallow comparison of props by default
- Custom comparison function available

```typescript
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  return <div>{/* expensive rendering */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.data.id === nextProps.data.id;
});
```

### useMemo and useCallback
- `useMemo`: Memoizes expensive calculations
- `useCallback`: Memoizes function references
- Use when dependencies change infrequently

```typescript
const Component = ({ items, filter }: Props) => {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);
  
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);
  
  return <ItemList items={filteredItems} onItemClick={handleClick} />;
};
```

### Code Splitting
- `React.lazy()`: Components that load on demand
- `Suspense`: Fallback UI while loading
- Route-based splitting with React Router

```typescript
const LazyComponent = React.lazy(() => import('./LazyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
```

## Common Interview Questions

### Q: What is the virtual DOM?
A: The virtual DOM is a JavaScript representation of the real DOM. React uses it for efficient updates by comparing the new virtual DOM with the previous one and only updating the changed parts.

### Q: Explain React's reconciliation process
A: Reconciliation is the process React uses to update the DOM. It:
1. Creates a new virtual DOM tree
2. Compares it with the previous tree (diffing)
3. Calculates the minimum set of changes needed
4. Applies only those changes to the real DOM

### Q: What are controlled vs uncontrolled components?
A: 
- **Controlled**: Component state controlled by React via `value` and `onChange`
- **Uncontrolled**: Component state managed internally by the DOM

### Q: How does React handle events?
A: React uses a synthetic event system that:
- Wraps native browser events
- Provides consistent API across browsers
- Uses event delegation for performance
- Pools event objects for memory efficiency

### Q: What is the purpose of keys in React lists?
A: Keys help React identify which items have changed, been added, or removed. They should be:
- Stable across re-renders
- Unique among siblings
- Not using array indices (can cause issues with reordering)

## Best Practices

### Component Design
- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Follow single responsibility principle

### State Management
- Keep state as local as possible
- Lift state up when needed
- Use context for global state
- Consider state management libraries for complex apps

### TypeScript Best Practices
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use generic components for reusability
- Avoid `any` type - use `unknown` instead

### Performance
- Profile components with React DevTools
- Use memoization strategically
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

## Advanced Topics

### Error Boundaries
- Catch JavaScript errors in component trees
- Display fallback UI instead of crashing
- Cannot catch errors in event handlers or async code

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### Concurrent Features
- `startTransition`: Mark non-urgent updates
- `useDeferredValue`: Defer expensive updates
- `useTransition`: Show loading states during transitions

### Server Components
- Run on the server, not in the browser
- Can access server-side resources directly
- Reduce client-side JavaScript bundle size
