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
