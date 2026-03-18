# Microservices Architecture Interview Notes

## Core Concepts

### What are Microservices?
- **Architectural Style**: Decomposes applications into small, independent services
- **Single Responsibility**: Each service handles one business capability
- **Decentralized**: Services owned by different teams
- **Independently Deployable**: Each service can be deployed separately

```yaml
# Example: E-commerce microservices
services:
  - user-service: User management, authentication
  - product-service: Product catalog, inventory
  - order-service: Order processing, payment
  - notification-service: Emails, SMS, push notifications
  - api-gateway: Request routing, aggregation
```

### Benefits
- **Scalability**: Scale individual services based on demand
- **Technology Diversity**: Use different tech stacks per service
- **Fault Isolation**: Failure in one service doesn't affect others
- **Team Autonomy**: Teams can work independently
- **Faster Deployment**: Smaller codebase, quicker releases

### Challenges
- **Complexity**: Distributed systems are inherently complex
- **Network Latency**: Inter-service communication overhead
- **Data Consistency**: Maintaining consistency across services
- **Monitoring**: Observability across multiple services
- **Testing**: Integration testing complexity

## Communication Patterns

### Synchronous Communication
```javascript
// REST API call between services
const axios = require('axios');

class OrderService {
  async createOrder(userId, items) {
    // Validate user
    const user = await axios.get(`http://user-service/users/${userId}`);
    if (!user.data.active) throw new Error('User not active');
    
    // Check inventory
    for (const item of items) {
      const inventory = await axios.get(
        `http://product-service/products/${item.productId}/inventory`
      );
      if (inventory.data.quantity < item.quantity) {
        throw new Error('Insufficient inventory');
      }
    }
    
    // Create order
    const order = await this.saveOrder(userId, items);
    
    // Update inventory
    await Promise.all(items.map(item => 
      axios.put(`http://product-service/products/${item.productId}/inventory`, {
        quantity: inventory.data.quantity - item.quantity
      })
    ));
    
    return order;
  }
}
```

### Asynchronous Communication
```javascript
// Event-driven architecture with message queue
const EventEmitter = require('events');

class OrderService extends EventEmitter {
  async createOrder(userId, items) {
    const order = await this.saveOrder(userId, items);
    
    // Emit events for other services
    this.emit('order.created', {
      orderId: order.id,
      userId,
      items,
      timestamp: new Date()
    });
    
    return order;
  }
}

// Inventory service listens for events
class InventoryService {
  constructor(orderService) {
    orderService.on('order.created', this.handleOrderCreated.bind(this));
  }
  
  async handleOrderCreated(event) {
    for (const item of event.items) {
      await this.updateInventory(item.productId, -item.quantity);
    }
  }
}
```

### API Gateway Pattern
```javascript
// API Gateway implementation
const express = require('express');
const httpProxy = require('http-proxy-middleware');

const app = express();

// Service discovery
const services = {
  users: 'http://user-service:3001',
  products: 'http://product-service:3002',
  orders: 'http://order-service:3003'
};

// Route to appropriate service
app.use('/api/users', httpProxy({ target: services.users }));
app.use('/api/products', httpProxy({ target: services.products }));
app.use('/api/orders', httpProxy({ target: services.orders }));

// Aggregation endpoint
app.get('/api/user/:userId/orders', async (req, res) => {
  const { userId } = req.params;
  
  // Parallel calls to multiple services
  const [user, orders] = await Promise.all([
    axios.get(`${services.users}/users/${userId}`),
    axios.get(`${services.orders}/orders?userId=${userId}`)
  ]);
  
  res.json({
    user: user.data,
    orders: orders.data
  });
});
```

## Data Management

### Database per Service Pattern
```yaml
# Each service owns its database
user-service:
  database: users_db
  tables: users, user_profiles

product-service:
  database: products_db
  tables: products, inventory, categories

order-service:
  database: orders_db
  tables: orders, order_items, payments
```

### Data Consistency Patterns

#### Saga Pattern
```javascript
// Choreography-based saga
class OrderSaga {
  async executeCreateOrder(orderData) {
    const saga = new Saga();
    
    // Step 1: Create order
    saga.addStep(
      () => this.orderService.createOrder(orderData),
      (order) => this.orderService.cancelOrder(order.id)
    );
    
    // Step 2: Reserve inventory
    saga.addStep(
      (order) => this.inventoryService.reserveItems(order.items),
      (reservation) => this.inventoryService.releaseReservation(reservation.id)
    );
    
    // Step 3: Process payment
    saga.addStep(
      (reservation) => this.paymentService.processPayment(reservation),
      (payment) => this.paymentService.refund(payment.id)
    );
    
    // Step 4: Confirm order
    saga.addStep(
      (payment) => this.orderService.confirmOrder(payment.orderId),
      (order) => this.orderService.cancelOrder(order.id)
    );
    
    return saga.execute();
  }
}
```

#### Event Sourcing
```javascript
// Event store implementation
class EventStore {
  async saveEvent(aggregateId, eventType, data) {
    const event = {
      id: uuid(),
      aggregateId,
      eventType,
      data,
      timestamp: new Date(),
      version: await this.getNextVersion(aggregateId)
    };
    
    await this.db.collection('events').insertOne(event);
    return event;
  }
  
  async getEvents(aggregateId) {
    return this.db.collection('events')
      .find({ aggregateId })
      .sort({ timestamp: 1 })
      .toArray();
  }
}

// Aggregate root
class Order {
  constructor(id) {
    this.id = id;
    this.status = 'created';
    this.items = [];
  }
  
  static async fromHistory(eventStore, id) {
    const order = new Order(id);
    const events = await eventStore.getEvents(id);
    
    for (const event of events) {
      order.apply(event);
    }
    
    return order;
  }
  
  apply(event) {
    switch (event.eventType) {
      case 'OrderCreated':
        this.status = 'created';
        this.items = event.data.items;
        break;
      case 'PaymentProcessed':
        this.status = 'paid';
        break;
      case 'OrderCancelled':
        this.status = 'cancelled';
        break;
    }
  }
}
```

## Resilience Patterns

### Circuit Breaker
```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000
});

async function callUserService(userId) {
  return circuitBreaker.execute(async () => {
    return axios.get(`http://user-service/users/${userId}`);
  });
}
```

### Retry Pattern
```javascript
class RetryService {
  async execute(operation, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const delay = options.delay || 1000;
    const backoff = options.backoff || 2;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) break;
        
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await this.sleep(waitTime);
      }
    }
    
    throw lastError;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Bulkhead Pattern
```javascript
class Bulkhead {
  constructor(maxConcurrent) {
    this.semaphore = new Semaphore(maxConcurrent);
  }
  
  async execute(operation) {
    await this.semaphore.acquire();
    
    try {
      return await operation();
    } finally {
      this.semaphore.release();
    }
  }
}

class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }
  
  async acquire() {
    return new Promise(resolve => {
      if (this.current < this.maxConcurrent) {
        this.current++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.current--;
    }
  }
}
```

## Service Discovery

### Client-Side Discovery
```javascript
class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }
  
  register(serviceName, instance) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Set());
    }
    
    this.services.get(serviceName).add({
      ...instance,
      registeredAt: new Date(),
      lastHeartbeat: new Date()
    });
  }
  
  discover(serviceName) {
    const instances = this.services.get(serviceName);
    if (!instances || instances.size === 0) {
      throw new Error(`No instances found for ${serviceName}`);
    }
    
    // Simple round-robin load balancing
    const instanceArray = Array.from(instances);
    const index = Math.floor(Math.random() * instanceArray.length);
    return instanceArray[index];
  }
  
  healthCheck() {
    const now = new Date();
    
    for (const [serviceName, instances] of this.services) {
      for (const instance of instances) {
        if (now - instance.lastHeartbeat > 30000) { // 30 seconds
          instances.delete(instance);
        }
      }
    }
  }
}
```

### Server-Side Discovery
```javascript
class LoadBalancer {
  constructor() {
    this.backends = [];
    this.currentIndex = 0;
  }
  
  addBackend(url) {
    this.backends.push({
      url,
      healthy: true,
      failures: 0
    });
  }
  
  getNextBackend() {
    const healthyBackends = this.backends.filter(b => b.healthy);
    
    if (healthyBackends.length === 0) {
      throw new Error('No healthy backends available');
    }
    
    // Round-robin
    const backend = healthyBackends[this.currentIndex % healthyBackends.length];
    this.currentIndex++;
    
    return backend;
  }
  
  async execute(request) {
    const backend = this.getNextBackend();
    
    try {
      const response = await fetch(backend.url + request.path, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      backend.failures = 0;
      return response;
    } catch (error) {
      backend.failures++;
      
      if (backend.failures > 3) {
        backend.healthy = false;
        // Schedule health check
        setTimeout(() => this.checkHealth(backend), 30000);
      }
      
      throw error;
    }
  }
  
  async checkHealth(backend) {
    try {
      const response = await fetch(backend.url + '/health');
      backend.healthy = response.ok;
      backend.failures = 0;
    } catch (error) {
      backend.healthy = false;
    }
  }
}
```

## Common Interview Questions

### Q: What is the difference between monolithic and microservices architecture?
A: 
**Monolithic:**
- Single codebase, single database
- Tight coupling between components
- Easier to develop and test initially
- Scaling entire application required

**Microservices:**
- Multiple independent services
- Loose coupling, high cohesion
- Independent deployment and scaling
- More complex operational overhead

### Q: How do you handle communication between microservices?
A: Communication patterns:
- **Synchronous**: REST APIs, gRPC, GraphQL
- **Asynchronous**: Message queues, event streaming
- **API Gateway**: Single entry point, request routing
- **Service Mesh**: Advanced communication management

### Q: What is the Saga pattern?
A: Saga pattern manages distributed transactions:
- **Sequence of local transactions**
- **Compensating actions** for rollback
- **Two implementations**: Choreography (event-driven) and Orchestration (coordinator)
- **Ensures eventual consistency** across services

### Q: How do you ensure data consistency in microservices?
A: Consistency strategies:
- **Eventual consistency**: Accept temporary inconsistencies
- **Saga pattern**: Compensating transactions
- **Event sourcing**: Immutable event log
- **CQRS**: Separate read/write models
- **Distributed transactions**: Two-phase commit (avoid if possible)

### Q: What is the Circuit Breaker pattern?
A: Circuit Breaker prevents cascading failures:
- **CLOSED**: Normal operation, passes requests
- **OPEN**: Fails fast, no requests pass
- **HALF_OPEN**: Limited requests to test recovery
- **Automatic recovery** after timeout

## Best Practices

### Service Design
- **Single Responsibility**: One business capability per service
- **Bounded Context**: Clear domain boundaries
- **API Versioning**: Backward compatibility
- **Documentation**: OpenAPI/Swagger specifications
- **Health Checks**: Standard health endpoints

### Deployment
- **Containerization**: Docker for consistency
- **Orchestration**: Kubernetes for management
- **CI/CD**: Automated deployment pipelines
- **Blue-Green Deployments**: Zero downtime
- **Canary Releases**: Gradual rollout

### Monitoring
- **Distributed Tracing**: Request flow across services
- **Metrics Collection**: Prometheus, Grafana
- **Centralized Logging**: ELK stack
- **Alerting**: Proactive issue detection
- **Service Level Objectives**: Performance targets

### Security
- **API Gateway**: Authentication, rate limiting
- **Service-to-Service**: mTLS, OAuth 2.0
- **Secrets Management**: HashiCorp Vault
- **Network Policies**: Kubernetes NetworkPolicy
- **Zero Trust**: Verify everything
