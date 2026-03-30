# Design Patterns & Principles Interview Notes

## SOLID Principles
SOLID is an acronym that represents five principles of object-oriented programming for creating maintainable and scalable software. While traditionally OOP, they are heavily applied in TypeScript and backend development.

### S: Single Responsibility Principle (SRP)
- **Concept**: A class or module should have one, and only one, reason to change.
- **Example**: Do not mix database access logic, business logic, and UI rendering in one class. Split them.

```typescript
// Anti-pattern
class UserSettings {
  changePassword(newPwd) { /* ... */ }
  saveToDatabase() { /* ... */ } // Violates SRP
}

// Better
class UserSettings {
  changePassword(newPwd) { /* ... */ }
}
class UserRepository {
  save(user) { /* ... */ }
}
```

### O: Open-Closed Principle (OCP)
- **Concept**: Software entities should be open for extension but closed for modification. You should be able to add new functionality without changing existing code.

```typescript
// Better: Open for extension. To add a new shape, we create a new class.
interface Shape {
  calculateArea(): number;
}
class Circle implements Shape { /* ... */ }
class Square implements Shape { /* ... */ }

class AreaCalculator {
  calculate(shapes: Shape[]) {
    return shapes.reduce((sum, shape) => sum + shape.calculateArea(), 0);
  }
}
```

### L: Liskov Substitution Principle (LSP)
- **Concept**: Derived classes must be substitutable for their base classes without altering the correctness of the program. 

### I: Interface Segregation Principle (ISP)
- **Concept**: A client should never be forced to implement an interface that it doesn't use. Interfaces should be small and specific.

```typescript
// Anti-pattern: Fat interface
interface WorkerObject {
  work(): void;
  eat(): void;
}

// Problem: A Robot worker implements WorkerObject but shouldn't have to implement eat().
// Better: Segregate interfaces
interface Workable { work(): void; }
interface Feedable { eat(): void; }

class Robot implements Workable {
  work() {}
}
```

### D: Dependency Inversion Principle (DIP)
- **Concept**: High-level modules should not depend on low-level modules. Both should depend on abstractions (interfaces).

## Standard GoF Patterns

### Singleton Pattern (Creational)
- Ensures a class has only one instance and provides a global point of access to it.
- **Use Case**: Logging objects, database connection pools, global state stores config.

```typescript
class Database {
  private static instance: Database;
  private constructor() { /* Private constructor */ }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
const db1 = Database.getInstance();
```

### Factory Pattern (Creational)
- Defines an interface for creating objects but allows subclasses to alter the type of objects that will be created.
- **Use Case**: When object creation logic is complex or needs to be isolated.

### Observer Pattern (Behavioral)
- Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.
- **Use Case**: Event listeners, Redux (store/publishers and component/subscribers).

```typescript
class Subject {
  private observers: Function[] = [];
  
  subscribe(fn: Function) {
    this.observers.push(fn);
  }
  
  notify(data: any) {
    this.observers.forEach(observer => observer(data));
  }
}
```

### Strategy Pattern (Behavioral)
- Defines a family of algorithms, encapsulates each one, and makes them interchangeable.
- **Use Case**: Passing a sorting function, choosing a payment gateway (PayPal vs Stripe) at runtime.

### Decorator Pattern (Structural)
- Attaches additional responsibilities to an object dynamically. Gives a flexible alternative to subclassing.
- **Use Case**: React Higher-Order Components (HOC), NestJS decorators (`@Get()`, `@Injectable()`).

## Common Interview Questions

### Q: Why is dependency injection (DI) important?
A: Dependency injection aligns with the Dependency Inversion Principle. Instead of a class instantiating its dependencies internally with `new`, the dependencies are passed (injected) in via the constructor. This massively improves testability because you can easily pass mocked dependencies during testing.

### Q: Explain the difference between Composition and Inheritance.
A: Both are ways to reuse code. 
- **Inheritance** is an "is-a" relationship (Dog *is an* Animal). It can lead to tightly coupled rigid class hierarchies (the "gorilla holding the banana" problem).
- **Composition** is a "can-do" or "has-a" relationship (Car *has an* Engine). It provides greater flexibility by piecing together smaller classes or objects to build complex behaviors.
- "Favor composition over inheritance" is a standard design principle.

## Additional Patterns

### Adapter Pattern (Structural)
- Converts the interface of a class into another interface that clients expect.
- **Use Case**: Integrating third-party libraries with different APIs (e.g., switching from Axios to Fetch without changing the rest of your code).

```typescript
// Adapter: Make a third-party logger work with your app's logging interface
interface Logger {
  info(message: string): void;
  error(message: string): void;
}

class WinstonAdapter implements Logger {
  private winston: any;
  constructor(winstonInstance: any) { this.winston = winstonInstance; }
  info(message: string) { this.winston.log('info', message); }
  error(message: string) { this.winston.log('error', message); }
}
```

### Facade Pattern (Structural)
- Provides a simplified interface to a complex subsystem.
- **Use Case**: A `UserService` that hides the complexity of interacting with auth, database, and email services behind a single `createUser()` method.

### Repository Pattern
- Abstracts the data access layer, providing a clean API for the business logic layer to interact with data.
- **Use Case**: Swapping database implementations (MySQL to MongoDB) without changing business logic.

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

class MySQLUserRepository implements UserRepository { /* ... */ }
class MongoUserRepository implements UserRepository { /* ... */ }
```

### Middleware Pattern
- A chain of processing functions where each function decides whether to pass the request to the next one.
- **Use Case**: Express.js middleware chain, Redux middleware.

### Module Pattern
- Encapsulates related code into a self-contained unit with private and public members.
- Pre-ES6: Achieved using IIFEs (Immediately Invoked Function Expressions).
- Post-ES6: Native JS modules (`import`/`export`) serve the same purpose.

### MVC / MVVM
- **MVC (Model-View-Controller)**: Model (data), View (UI), Controller (logic connecting them). Used in Express (routes = controllers, templates = views).
- **MVVM (Model-View-ViewModel)**: The ViewModel acts as a data binding layer between the View and Model. React with hooks approximates this pattern (component = View, hook state = ViewModel, API layer = Model).

## Additional Interview Questions

### Q: What is the Middleware pattern and how does Express use it?
A: In Express, middleware is a function with `(req, res, next)` signature. Middleware functions form a pipeline: each can modify the request/response, end the cycle, or call `next()` to pass control to the next middleware. Authentication, logging, CORS, and error handling are all implemented as middleware.

### Q: When would you use the Adapter pattern?
A: When you need to make an existing class work with an incompatible interface. Common in: integrating third-party payment gateways (Stripe vs PayPal), wrapping legacy APIs, or normalizing data from different sources into a common format.
