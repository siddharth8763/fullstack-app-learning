# Core JavaScript Fundamentals Interview Notes

## Scope, Closures, and Execution Context

### Scope and Lexical Environment
- **Scope**: Determines the accessibility of variables. JS has Global, Function, and Block scope (`let` and `const`).
- **Lexical Scope**: A function's scope is determined by where it is defined in the source code, not where it is called.
- **Execution Context**: The environment in which JS code is evaluated and executed. Contains the Variable Object, Scope Chain, and `this` keyword.

### Closures
- A **closure** is a function that remembers its outer variables and can access them.
- It is created when a function is defined within another function, allowing the inner function to access the outer function's scope even after the outer function has returned.

```javascript
// Closure Example
function createCounter() {
  let count = 0; // Lexical environment of createCounter
  
  return function() {
    count++; // Accesses variables from outer scope
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
```

### Hoisting and Temporal Dead Zone (TDZ)
- **Hoisting**: JS engine moves variable and function declarations to the top of their containing scope during the compile phase.
- `var` declarations are hoisted and initialized with `undefined`.
- `let` and `const` are hoisted but remain uninitialized. Accessing them before declaration results in a `ReferenceError` (this period is the **Temporal Dead Zone**).
- Function declarations are fully hoisted. Function expressions are not.

```javascript
// Hoisting
console.log(a); // undefined
var a = 5;

// console.log(b); // ReferenceError (TDZ)
let b = 10;
```

## The `this` Keyword

### Binding Rules
The value of `this` is determined by how a function is called:
1. **Implicit Binding**: When a function is called as a method of an object, `this` refers to the object.
2. **Explicit Binding**: Using `call`, `apply`, or `bind` to explicitly set `this`.
3. **New Binding**: When a function is called with the `new` keyword, `this` refers to the newly created object.
4. **Default Binding**: In non-strict mode, `this` defaults to the global object (`window` in browser). In strict mode, it is `undefined`.

### Arrow Functions
- Arrow functions do not have their own `this` binding. They inherit `this` from the enclosing lexical context.

```javascript
const person = {
  name: 'John',
  greet: function() {
    console.log(`Hello, ${this.name}`);
  },
  greetArrow: () => {
    console.log(`Hello, ${this.name}`); // 'this' is inherited from global scope, undefined here
  }
};

person.greet(); // Hello, John
person.greetArrow(); // Hello, undefined
```

### Call, Apply, Bind
- `call(thisArg, arg1, arg2)`: Invokes the function immediately.
- `apply(thisArg, [argsArray])`: Invokes immediately, takes arguments as an array.
- `bind(thisArg, arg1)`: Returns a new function with `this` bound to the provided value.

## Prototypal Inheritance

### Prototypes
- Every object in JavaScript has a hidden internal property `[[Prototype]]` that points to another object (or `null`).
- The `__proto__` accessor exposes this property, though `Object.getPrototypeOf()` is the modern standard.
- Functions have a `prototype` property used as the prototype for objects created with `new`.

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a noise.`);
};

const dog = new Animal('Rex');
dog.speak(); // Rex makes a noise.
```

### Prototype Chain
- When accessing an object's property, JS first checks the object itself. If not found, it traverses up the prototype chain until it finds the property or reaches `null`.

### ES6 Classes
- Syntactic sugar over prototypal inheritance.

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} makes a noise.`);
  }
}

class Dog extends Animal {
  speak() {
    console.log(`${this.name} barks.`);
  }
}
```

## Asynchronous JavaScript

### Promises
- A Promise represents the eventual completion (or failure) of an asynchronous operation and its resulting value.
- States: `Pending`, `Fulfilled`, `Rejected`.

```javascript
const myPromise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true;
    if (success) resolve("Operation succeeded");
    else reject(new Error("Operation failed"));
  }, 1000);
});

myPromise
  .then(res => console.log(res))
  .catch(err => console.error(err))
  .finally(() => console.log("Done"));
```

### Async/Await
- Syntactic sugar over Promises, making asynchronous code look synchronous.

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
```

### Event Loop (Browser vs Node)
- **Macrotasks Array**: `setTimeout`, `setInterval`, network requests.
- **Microtasks Array**: Promises (`.then`, `.catch`), `MutationObserver`.
- The Event Loop clears the call stack, then executes ALL microtasks before taking the next macrotask.

## Common Interview Questions

### Q: What is the difference between `==` and `===`?
A: `==` performs type coercion before comparing (e.g., `1 == '1'` is true). `===` is strict equality and does not perform type coercion (e.g., `1 === '1'` is false).

### Q: Explain event delegation.
A: Event delegation is a technique involving adding event listeners to a parent element instead of multiple child elements. It utilizes event bubbling (events propagating up the DOM tree) to handle events efficiently.

### Q: What is a Higher-Order Function (HOF)?
A: A function that either takes one or more functions as arguments or returns a function. Examples: `map`, `filter`, `reduce`.

### Q: What is Currying?
A: A technique of evaluating a function with multiple arguments into a sequence of functions with a single argument. E.g., `f(a, b, c)` becomes `f(a)(b)(c)`.

```javascript
function multiply(x) {
  return function(y) {
    return x * y;
  }
}
console.log(multiply(2)(3)); // 6
```

## Debounce and Throttle
- **Debounce**: Delays execution until a set time has passed since the LAST call. Resets the timer on each new call.
  - **Use Case**: Search input (wait until user stops typing).
- **Throttle**: Ensures a function is called at most once every X milliseconds, regardless of how many times it's triggered.
  - **Use Case**: Scroll events, window resize.

```javascript
// Debounce implementation
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle implementation
function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

## Spread, Rest, and Destructuring

```javascript
// Spread (...) - Expands an iterable
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]
const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 }; // { a: 1, b: 2 }

// Rest (...) - Collects remaining arguments into an array
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

// Destructuring
const { name, age, city = 'Unknown' } = user; // Object destructuring with default
const [first, , third] = [1, 2, 3]; // Array destructuring, skip second
```

## Map, Set, WeakMap, WeakRef

| Data Structure | Key Types | Ordered | Duplicate Keys | Garbage Collectible |
|---|---|---|---|---|
| **Object** | String/Symbol only | No | No | No |
| **Map** | Any type | Yes (insertion) | No | No |
| **Set** | N/A (values only) | Yes (insertion) | No (unique values) | No |
| **WeakMap** | Objects only | No | No | Yes (keys are weak references) |
| **WeakSet** | Objects only | No | No | Yes |

- **WeakMap Use Case**: Storing private data associated with DOM elements without causing memory leaks. When the DOM element is removed, the WeakMap entry is automatically garbage collected.

## Promise Combinators

```javascript
const p1 = fetch('/api/users');
const p2 = fetch('/api/posts');
const p3 = Promise.reject('error');

// Promise.all - Resolves when ALL resolve. Rejects on FIRST rejection.
Promise.all([p1, p2]); // Use for parallel requests that all must succeed

// Promise.allSettled - Waits for ALL to settle (resolve OR reject). Never short-circuits.
Promise.allSettled([p1, p2, p3]); // [{status: 'fulfilled', value}, {status: 'rejected', reason}]

// Promise.race - Resolves/Rejects as soon as the FIRST promise settles.
Promise.race([p1, p2]); // Use for timeouts

// Promise.any - Resolves as soon as the FIRST promise FULFILLS. Ignores rejections.
Promise.any([p1, p3]); // Resolves with p1's value, ignores p3's rejection
```

## Generators
- Functions that can be paused and resumed using `yield`.
- Returns an iterator object with a `.next()` method.

```javascript
function* idGenerator() {
  let id = 1;
  while (true) {
    yield id++;
  }
}
const gen = idGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
```

## Additional Interview Questions

### Q: What is the difference between `typeof` and `instanceof`?
A: `typeof` returns a string indicating the primitive type (`"string"`, `"number"`, `"object"`, `"function"`, `"undefined"`). Famously, `typeof null === "object"` (a known JS bug). `instanceof` checks if an object is an instance of a specific constructor via the prototype chain.

### Q: How does Garbage Collection work in JavaScript?
A: V8 uses a **mark-and-sweep** algorithm. The garbage collector starts from "roots" (global variables, currently executing functions) and marks all objects that are reachable. Any object NOT marked is considered unreachable and its memory is freed. This is why WeakMap/WeakSet are useful — their references don't prevent garbage collection.

### Q: What is the difference between `null` and `undefined`?
A: `undefined` means a variable has been declared but not assigned a value. `null` is an intentional assignment of "no value". `typeof undefined` is `"undefined"`, `typeof null` is `"object"` (a JS quirk). `null == undefined` is `true`, but `null === undefined` is `false`.

### Q: What is a `Symbol` in JavaScript?
A: A primitive type introduced in ES6 that creates a unique, immutable identifier. Useful for creating non-clashing property keys on objects (e.g., for libraries that add metadata to user objects without risking name collisions).
