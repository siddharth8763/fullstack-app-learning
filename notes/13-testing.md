# Testing Interview Notes (Frontend & Backend)

## Unit Testing Fundamentals

### Test-Driven Development (TDD)
- **Red-Green-Refactor Cycle**: Write a failing test (Red), write minimum code to pass it (Green), improve code structure (Refactor).
- **Benefits**: Better design, fewer bugs, living documentation.

### Mocking, Stubbing, and Spying
- **Mock**: Fakes a complete function or module to prevent side effects (like API calls).
- **Stub**: Provides hard-coded answers to calls during the test.
- **Spy**: Wraps a real function to track its calls (arguments, frequency) while still executing the original logic.

## Frontend Testing (React & Jest)

### Jest Fundamentals
- **Jest**: A zero-config JavaScript testing framework created by Meta. Includes assert functions, test runner, and mocking library.

```javascript
// Basic Jest usage
describe('Math utilities', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
  
  it('should mock an API call', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'fake data' });
    const result = await fetchData(mockFetch);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.data).toBe('fake data');
  });
});
```

### React Testing Library (RTL)
- RTL focuses on testing components from the user's perspective rather than testing implementation details.
- Avoids testing state or internals directly; tests DOM output and interactivity.

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('Counter Component', () => {
  it('increments internal count on button click', async () => {
    render(<Counter />);
    
    // Find element by accessible role
    const button = screen.getByRole('button', { name: /increment/i });
    const display = screen.getByText('Count: 0');
    
    // Simulate user interaction correctly
    await userEvent.click(button);
    
    expect(display).toHaveTextContent('Count: 1');
  });
});
```

### RTL Query Priority
1. `getByRole`: Best for accessibility.
2. `getByLabelText`: Good for form inputs.
3. `getByPlaceholderText`
4. `getByText`: finding non-interactive elements.
5. `getByTestId`: Fallback explicitly tied to test attributes (`data-testid`).

## Backend Testing (Node.js & Express)

### Supertest
- HTTP assertions made easy. Great for testing Express APIs without actually starting a network server instance.

```javascript
const request = require('supertest');
const app = require('../app'); // Usually export Express app before app.listen()

describe('GET /users', () => {
  it('responds with json containing a list of users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token123')
      .expect('Content-Type', /json/)
      .expect(200);
      
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBeTruthy();
  });
});
```

### Database Integration Testing
- Use in-memory databases (like `mongodb-memory-server` or SQLite in memory) to prevent touching a real DB during unit tests.
- Alternatively, use a Dockerized test database spun up before test suites.

## End-to-End (E2E) Testing

### Cypress
- Runs directly in the browser. E2E tests validate entire user flows from frontend to backend database.

```javascript
describe('Login Flow', () => {
  it('successfully logs in and navigates to dashboard', () => {
    cy.visit('/login');
    
    cy.get('input[name=username]').type('testuser');
    cy.get('input[name=password]').type('password123');
    
    cy.get('button[type=submit]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, testuser').should('be.visible');
  });
});
```

## Common Interview Questions

### Q: What is the difference between unit, integration, and E2E testing?
A: 
- **Unit Testing**: Tests individual functions or components in isolation from the rest of the application.
- **Integration Testing**: Tests how different units (e.g., a React component and a Redux store, or an Express route and a Database query) work together.
- **E2E Testing**: Tests the full application flow from start to finish (browser UI down to the database) mirroring real user behavior.

### Q: Why is React Testing Library preferred over Enzyme?
A: Enzyme allowed easy access to component state and internal methods, leading developers to test implementation details. When refactoring components, these tests often broke easily even if the UI behaved identically. RTL enforces testing the DOM structure and user behavior directly, making tests resilient to refactoring.

### Q: What is a snapshot test, and when should you use it?
A: Snapshot testing creates a serialized output of a UI component (like an HTML string) and compares against it in future runs. It is useful for spotting unintended visual regressions, but it should not replace actual assertion testing because snapshots are prone to "snapshot fatigue" where developers mindlessly update snapshots instead of verifying why they failed.

## Testing Pyramid

```
           /  E2E   \          <- Few, slow, expensive, high confidence
          / Integration \      <- Moderate, medium speed
         /   Unit Tests   \    <- Many, fast, cheap, low confidence
```

- **Unit Tests** (base): Fast, isolated, test individual functions. Should be the largest portion.
- **Integration Tests** (middle): Test how modules work together (e.g., component + API slice).
- **E2E Tests** (top): Test full user flows through the real browser. Slowest, most fragile, but highest confidence.

## Code Coverage
- Measures what percentage of your code is executed during tests.
- **Metrics**: Statements, Branches, Functions, Lines.
- **Target**: 80% is a common industry target. 100% is not practical and doesn't guarantee bug-free code.
- **Jest**: Run `jest --coverage` to generate a report.
- **Warning**: High coverage with weak assertions gives false confidence.

## Mock Service Worker (MSW)
- Intercepts network requests at the service worker level, providing realistic API mocking without modifying application code.
- Works in both tests and browser (for development).

```javascript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'Test User' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## React Testing: Advanced Patterns

### `act()` Wrapper
- Ensures all state updates and effects are processed before making assertions.
- RTL's `render`, `fireEvent`, and `userEvent` wrap actions in `act()` automatically. You only need explicit `act()` for custom async state updates.

### Async Queries: `findBy` vs `waitFor`
- **`findBy*`**: Returns a promise that resolves when the element appears. Combines `getBy` + `waitFor`. Use for elements that appear after async operations.
- **`waitFor`**: Repeatedly calls a callback until it stops throwing (or times out). Use for waiting on assertions.

```typescript
// Waiting for async data to load
const userName = await screen.findByText('John Doe'); // Waits for element

// Waiting for an assertion to pass
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Additional Interview Questions

### Q: What is Contract Testing?
A: Contract Testing verifies that two services (e.g., frontend and backend API) agree on the shape of data exchanged. Tools like Pact create a "contract" from consumer tests, which the provider then verifies against. This prevents integration bugs without needing a full E2E test environment.

### Q: What is the difference between `fireEvent` and `userEvent` in RTL?
A: `fireEvent` dispatches a single DOM event. `userEvent` simulates full user interactions (e.g., `userEvent.type` fires `keyDown`, `keyPress`, `input`, `keyUp` for each character, mimicking real behavior). Always prefer `userEvent` for realistic testing.
