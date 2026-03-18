# Express.js & Node.js Interview Notes

## Node.js Fundamentals

### Event Loop
- **Single-threaded**: Node.js runs on a single thread using event loop
- **Non-blocking I/O**: Asynchronous operations don't block the thread
- **Event Queue**: Callbacks queued when async operations complete
- **Call Stack**: Synchronous function calls
- **Event Loop**: Processes events from queue when call stack is empty

```javascript
// Event loop demonstration
console.log('Start'); // 1. Synchronous

setTimeout(() => {
  console.log('Timeout'); // 4. Timer callback
}, 0);

Promise.resolve().then(() => {
  console.log('Promise'); // 3. Microtask
});

console.log('End'); // 2. Synchronous

// Output: Start, End, Promise, Timeout
```

### Event Loop Phases
1. **Timers**: `setTimeout()`, `setInterval()`
2. **Pending Callbacks**: I/O callbacks
3. **Idle, Prepare**: Internal use
4. **Poll**: New I/O events
5. **Check**: `setImmediate()` callbacks
6. **Close Callbacks**: Close event callbacks

### Streams
- **Readable**: Data source streams
- **Writable**: Data destination streams
- **Duplex**: Both readable and writable
- **Transform**: Modify data during read/write

```javascript
const fs = require('fs');
const { Transform } = require('stream');

// Transform stream to uppercase
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// Pipe streams together
fs.createReadStream('input.txt')
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream('output.txt'));
```

## Express.js Architecture

### Middleware Chain
- **Request Processing**: Sequential middleware execution
- **Request/Response Objects**: Enhanced with additional properties
- **Next Function**: Pass control to next middleware
- **Error Handling**: Four-argument error middleware

```javascript
const express = require('express');
const app = express();

// Middleware types
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next(); // Pass to next middleware
});

// Route handler
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

// Error middleware (must have 4 arguments)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});
```

### Request/Response Lifecycle
1. **Request Incoming**: HTTP request received
2. **Middleware Execution**: Each middleware processes request
3. **Route Matching**: Find matching route handler
4. **Route Handler**: Process request and send response
5. **Response Sent**: HTTP response sent to client

### Routing
- **Route Methods**: GET, POST, PUT, DELETE, etc.
- **Route Paths**: String patterns, regex, parameter patterns
- **Route Handlers**: Single or multiple handler functions
- **Route Parameters**: Dynamic URL parameters

```javascript
// Route parameters
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ userId });
});

// Query parameters
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.json({ query });
});

// Multiple handlers
app.get('/api/data', 
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.json({ data: 'protected' });
  }
);

// Route chaining
app.route('/users')
  .get(getUsers)
  .post(createUser)
  .put(updateUser)
  .delete(deleteUser);
```

## Advanced Express Patterns

### Custom Middleware
```javascript
// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

### Error Handling
```javascript
// Async error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }
  
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Template Engines
```javascript
// EJS setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Route with template
app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    user: req.user,
    title: 'Dashboard'
  });
});
```

## Performance Optimization

### Caching Strategies
```javascript
// Memory cache
const cache = new Map();

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration * 1000) {
      return res.json(cached.data);
    }
    
    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson.call(this, data);
    };
    
    next();
  };
};

app.get('/api/data', cacheMiddleware(60), async (req, res) => {
  const data = await fetchData();
  res.json(data);
});
```

### Compression
```javascript
const compression = require('compression');

app.use(compression({
  level: 6, // Compression level
  threshold: 1024, // Only compress responses > 1KB
}));
```

### Cluster Mode
```javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });
} else {
  // Worker processes
  const app = require('./app');
  app.listen(3000);
}
```

## Security Best Practices

### Helmet.js
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### CORS Configuration
```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['https://example.com'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

app.post('/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Process valid data
    createUser(req.body);
    res.status(201).json({ message: 'User created' });
  }
);
```

## Common Interview Questions

### Q: Explain Node.js event loop
A: The event loop is the core mechanism that makes Node.js non-blocking:
1. **Call Stack**: Executes synchronous code
2. **Event Queue**: Holds callback functions
3. **Event Loop**: Moves callbacks from queue to stack when stack is empty
4. **Phases**: Different phases for different types of callbacks

### Q: What is middleware in Express?
A: Middleware functions are functions that have access to:
- **Request object** (`req`)
- **Response object** (`res`) 
- **Next function** (`next`)

They can:
- Execute code
- Modify request/response objects
- End request-response cycle
- Call next middleware in stack

### Q: How does Express handle async errors?
A: Express doesn't catch errors in async functions automatically. Solutions:
- **Try-catch blocks**: Wrap async code
- **Async handler wrapper**: Custom wrapper function
- **Express 5.0**: Built-in async error handling

### Q: What are streams in Node.js?
A: Streams are objects that let you read data from a source or write data to a destination in a continuous fashion:
- **Readable**: Data can be read from
- **Writable**: Data can be written to  
- **Duplex**: Both readable and writable
- **Transform**: Can modify or transform data

### Q: How would you optimize a Node.js application?
A: Optimization strategies:
- **Compression**: gzip responses
- **Caching**: Redis, in-memory cache
- **Clustering**: Utilize multiple CPU cores
- **Load balancing**: Distribute traffic
- **Database optimization**: Indexing, connection pooling
- **Code optimization**: Remove bottlenecks, use efficient algorithms

## Advanced Topics

### Worker Threads
```javascript
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread
  const worker = new Worker(__filename, {
    workerData: { start: 1, end: 1000000 }
  });
  
  worker.on('message', (result) => {
    console.log('Result:', result);
  });
} else {
  // Worker thread
  const { start, end } = workerData;
  let sum = 0;
  
  for (let i = start; i <= end; i++) {
    sum += i;
  }
  
  parentPort.postMessage(sum);
}
```

### Memory Management
```javascript
// Memory leak detection
const used = process.memoryUsage();
console.log('Memory Usage:', {
  rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
  heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
  heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
  external: Math.round(used.external / 1024 / 1024 * 100) / 100
});

// Garbage collection
if (global.gc) {
  global.gc();
}
```

### Graceful Shutdown
```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

## Best Practices

### Project Structure
```
src/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── models/         # Data models
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── config/         # Configuration files
└── app.js          # App setup
```

### Environment Configuration
```javascript
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  database: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development'
};
```

### Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```
