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

### React Router
- **`<BrowserRouter>`**: Uses HTML5 history API for clean URLs
- **`<Routes>` and `<Route>`**: Declarative route matching
- **`useNavigate()`**: Programmatic navigation hook
- **`useParams()`**: Access route parameters
- **`useSearchParams()`**: Access and modify query strings
- **`<Outlet>`**: Renders child routes in nested layouts
- **Lazy Routes**: Combine `React.lazy` with route-based splitting

```typescript
import { BrowserRouter, Routes, Route, useParams, Outlet } from 'react-router-dom';

// Nested layout pattern
const DashboardLayout = () => (
  <div>
    <Sidebar />
    <Outlet /> {/* Child routes render here */}
  </div>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/users/:id" element={<UserProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
```

### Context API Deep Dive
- **Purpose**: Share data across the component tree without passing props manually ("prop drilling").
- **Performance Pitfall**: Every consumer re-renders when the context value changes. Split contexts or use `useMemo` on the value.

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Custom hook for type-safe context consumption
function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  // Memoize the value to prevent unnecessary re-renders of consumers
  const value = React.useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(prev => (prev === 'light' ? 'dark' : 'light')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
```

### Portals
- Render children into a DOM node that exists outside the parent component's DOM hierarchy.
- **Use Case**: Modals, tooltips, dropdowns that need to break out of `overflow: hidden` or `z-index` stacking contexts.

```typescript
import ReactDOM from 'react-dom';

const Modal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return ReactDOM.createPortal(
    <div className="modal-overlay">{children}</div>,
    document.getElementById('modal-root')! // Render into a separate DOM node
  );
};
```

### Higher-Order Components (HOC) vs Render Props
- **HOC**: A function that takes a component and returns a new component with injected props. Can cause "wrapper hell".
- **Render Props**: A component takes a function as a prop (`children` or `render`) and calls it to determine what to render.
- **Modern alternative**: Custom Hooks replaced both patterns in most use cases.

### React.forwardRef
- Allows a parent component to pass a `ref` directly to a child component's DOM element.
- Essential for reusable UI libraries (e.g., custom Input components).

```typescript
const CustomInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} className="custom-input" />
));
```

### React Fiber Architecture
- Fiber is React's internal reconciliation engine (introduced in React 16).
- Breaks rendering work into small **units of work** that can be paused, aborted, or restarted.
- Enables **priority-based rendering**: urgent updates (user input) are processed before non-urgent ones (data fetching results).
- This is the foundation for Concurrent Features like `startTransition`.

## Additional Interview Questions

### Q: When would you use `useReducer` over `useState`?
A: Use `useReducer` when:
- State logic is complex (multiple sub-values, or next state depends on the previous one).
- Multiple event handlers update the same state in different ways.
- You want to centralize state logic similar to Redux within a component.

### Q: What is prop drilling and how do you avoid it?
A: Prop drilling is passing props through many layers of intermediate components that don't use them. Solutions: React Context API, state management libraries (Redux, Zustand), or component composition.

### Q: What is the difference between `useEffect` cleanup and `componentWillUnmount`?
A: The `useEffect` cleanup function runs before every re-render (if dependencies change) AND on unmount, making it more granular than `componentWillUnmount` which only runs once on unmount.
