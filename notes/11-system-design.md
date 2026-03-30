# System Design Interview Notes

## Core Concepts

### System Design Principles
- **Scalability**: Handle increasing load
- **Availability**: System remains operational
- **Reliability**: Consistent performance
- **Performance**: Fast response times
- **Maintainability**: Easy to modify and extend
- **Security**: Protect against threats

### CAP Theorem
- **Consistency**: All nodes see same data simultaneously
- **Availability**: System remains operational
- **Partition Tolerance**: System continues despite network partitions

**Trade-offs**:
- **CP**: Consistency + Partition tolerance (sacrifice availability)
- **AP**: Availability + Partition tolerance (sacrifice consistency)
- **CA**: Consistency + Availability (not realistic in distributed systems)

## Load Balancing

### Types of Load Balancers
```yaml
# Layer 4 (Transport Layer)
- Operates on TCP/UDP connections
- Fast, low overhead
- No application awareness
- Example: HAProxy, Nginx TCP

# Layer 7 (Application Layer)
- Operates on HTTP/HTTPS requests
- Content-aware routing
- SSL termination
- Example: Nginx HTTP, AWS ALB

# Global Server Load Balancer
- Routes traffic across regions
- DNS-based routing
- Health checks across regions
- Example: Route 53, Cloudflare
```

### Load Balancing Algorithms
```javascript
// Round Robin
class RoundRobinBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
  }
  
  getNextServer() {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}

// Weighted Round Robin
class WeightedRoundRobinBalancer {
  constructor(servers) {
    this.servers = servers.map(server => ({
      ...server,
      currentWeight: server.weight,
      effectiveWeight: server.weight
    }));
  }
  
  getNextServer() {
    let totalWeight = 0;
    let bestServer = null;
    
    for (const server of this.servers) {
      if (!server.healthy) continue;
      
      server.currentWeight += server.effectiveWeight;
      totalWeight += server.effectiveWeight;
      
      if (!bestServer || server.currentWeight > bestServer.currentWeight) {
        bestServer = server;
      }
    }
    
    if (bestServer) {
      bestServer.currentWeight -= totalWeight;
    }
    
    return bestServer;
  }
}

// Least Connections
class LeastConnectionsBalancer {
  constructor(servers) {
    this.servers = servers.map(server => ({
      ...server,
      connections: 0
    }));
  }
  
  getNextServer() {
    return this.servers
      .filter(server => server.healthy)
      .reduce((min, server) => 
        server.connections < min.connections ? server : min
      );
  }
}
```

## Caching Strategies

### Cache Types
```javascript
// In-Memory Cache
class MemoryCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = new Map();
  }
  
  get(key) {
    if (this.cache.has(key)) {
      this.updateAccessOrder(key);
      return this.cache.get(key);
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, value);
    this.updateAccessOrder(key);
  }
  
  evictLRU() {
    const oldestKey = this.accessOrder.keys().next().value;
    this.cache.delete(oldestKey);
    this.accessOrder.delete(oldestKey);
  }
  
  updateAccessOrder(key) {
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
  }
}

// Distributed Cache (Redis)
class RedisCache {
  constructor(redisClient) {
    this.redis = redisClient;
  }
  
  async get(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value, ttl = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Cache Patterns
```javascript
// Cache-Aside Pattern
class CacheAsideService {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async getUser(userId) {
    // Try cache first
    let user = await this.cache.get(`user:${userId}`);
    
    if (!user) {
      // Cache miss, fetch from database
      user = await this.database.getUser(userId);
      
      if (user) {
        // Populate cache
        await this.cache.set(`user:${userId}`, user, 3600);
      }
    }
    
    return user;
  }
  
  async updateUser(userId, userData) {
    // Update database
    await this.database.updateUser(userId, userData);
    
    // Invalidate cache
    await this.cache.invalidate(`user:${userId}`);
  }
}

// Write-Through Pattern
class WriteThroughService {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
  }
  
  async updateUser(userId, userData) {
    // Update database
    await this.database.updateUser(userId, userData);
    
    // Update cache
    await this.cache.set(`user:${userId}`, userData, 3600);
  }
}

// Write-Behind Pattern
class WriteBehindService {
  constructor(cache, database) {
    this.cache = cache;
    this.database = database;
    this.writeQueue = [];
    this.processQueue();
  }
  
  async updateUser(userId, userData) {
    // Update cache immediately
    await this.cache.set(`user:${userId}`, userData, 3600);
    
    // Add to write queue
    this.writeQueue.push({
      type: 'update',
      userId,
      userData,
      timestamp: Date.now()
    });
  }
  
  async processQueue() {
    setInterval(async () => {
      while (this.writeQueue.length > 0) {
        const operation = this.writeQueue.shift();
        
        try {
          if (operation.type === 'update') {
            await this.database.updateUser(operation.userId, operation.userData);
          }
        } catch (error) {
          // Re-queue failed operation
          this.writeQueue.unshift(operation);
          break;
        }
      }
    }, 1000);
  }
}
```

## Database Design

### Database Sharding
```javascript
// Hash-based Sharding
class HashSharding {
  constructor(shards) {
    this.shards = shards;
    this.shardCount = shards.length;
  }
  
  getShard(key) {
    const hash = this.hash(key);
    const shardIndex = hash % this.shardCount;
    return this.shards[shardIndex];
  }
  
  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  async get(key) {
    const shard = this.getShard(key);
    return shard.get(key);
  }
  
  async set(key, value) {
    const shard = this.getShard(key);
    return shard.set(key, value);
  }
}

// Range-based Sharding
class RangeSharding {
  constructor(shards) {
    this.shards = shards.map((shard, index) => ({
      ...shard,
      range: shard.range,
      index
    }));
  }
  
  getShard(key) {
    // Assuming key is numeric
    const keyValue = parseInt(key);
    
    for (const shard of this.shards) {
      if (keyValue >= shard.range.min && keyValue < shard.range.max) {
        return shard;
      }
    }
    
    throw new Error('Key outside shard range');
  }
}

// Directory-based Sharding
class DirectorySharding {
  constructor(shards) {
    this.shards = shards;
    this.directory = new Map();
  }
  
  async getShard(key) {
    // Check directory first
    if (this.directory.has(key)) {
      const shardIndex = this.directory.get(key);
      return this.shards[shardIndex];
    }
    
    // If not in directory, assign to least loaded shard
    const shardIndex = this.findLeastLoadedShard();
    this.directory.set(key, shardIndex);
    
    return this.shards[shardIndex];
  }
  
  findLeastLoadedShard() {
    // Implementation would track load per shard
    return 0; // Simplified
  }
}
```

### Database Replication
```javascript
// Master-Slave Replication
class MasterSlaveReplication {
  constructor(master, slaves) {
    this.master = master;
    this.slaves = slaves;
    this.writeQueue = [];
    this.replicateToSlaves();
  }
  
  async write(key, value) {
    // Write to master
    await this.master.write(key, value);
    
    // Queue for replication
    this.writeQueue.push({
      operation: 'write',
      key,
      value,
      timestamp: Date.now()
    });
  }
  
  async read(key) {
    // Read from master (strong consistency)
    return this.master.read(key);
  }
  
  async readFromSlave(key) {
    // Read from any slave (eventual consistency)
    const slave = this.getRandomSlave();
    return slave.read(key);
  }
  
  async replicateToSlaves() {
    setInterval(async () => {
      while (this.writeQueue.length > 0) {
        const operation = this.writeQueue.shift();
        
        // Replicate to all slaves
        await Promise.all(
          this.slaves.map(slave => 
            slave.write(operation.key, operation.value)
          )
        );
      }
    }, 100);
  }
}

// Multi-Master Replication
class MultiMasterReplication {
  constructor(masters) {
    this.masters = masters;
    this.conflictResolver = new ConflictResolver();
  }
  
  async write(key, value, masterId) {
    // Write to local master
    const localMaster = this.masters[masterId];
    await localMaster.write(key, value);
    
    // Replicate to other masters
    const replicationPromises = this.masters
      .filter((_, index) => index !== masterId)
      .map(master => this.replicateWithConflictResolution(master, key, value));
    
    await Promise.allSettled(replicationPromises);
  }
  
  async replicateWithConflictResolution(master, key, value) {
    try {
      const existingValue = await master.read(key);
      
      if (existingValue && existingValue.version >= value.version) {
        // Conflict detected
        const resolvedValue = this.conflictResolver.resolve(existingValue, value);
        await master.write(key, resolvedValue);
      } else {
        await master.write(key, value);
      }
    } catch (error) {
      console.error('Replication failed:', error);
    }
  }
}
```

## Message Queues

### Queue Implementation
```javascript
// Simple Message Queue
class MessageQueue {
  constructor() {
    this.queue = [];
    this.subscribers = new Map();
    this.processing = false;
  }
  
  publish(topic, message) {
    this.queue.push({
      topic,
      message,
      timestamp: Date.now(),
      id: this.generateId()
    });
    
    this.processQueue();
  }
  
  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    
    this.subscribers.get(topic).push(callback);
  }
  
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { topic, message, id } = this.queue.shift();
      
      const subscribers = this.subscribers.get(topic) || [];
      
      await Promise.all(
        subscribers.map(callback => 
          this.safeExecute(callback, message, id)
        )
      );
    }
    
    this.processing = false;
  }
  
  async safeExecute(callback, message, id) {
    try {
      await callback(message);
    } catch (error) {
      console.error(`Error processing message ${id}:`, error);
      // Could implement retry logic here
    }
  }
  
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Priority Queue
class PriorityQueue {
  constructor() {
    this.queue = [];
    this.subscribers = new Map();
  }
  
  publish(topic, message, priority = 0) {
    const item = {
      topic,
      message,
      priority,
      timestamp: Date.now(),
      id: this.generateId()
    };
    
    // Insert in priority order
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, item);
    this.processQueue();
  }
}
```

### Message Patterns
```javascript
// Publish-Subscribe Pattern
class PubSubPattern {
  constructor() {
    this.topics = new Map();
  }
  
  publish(topic, message) {
    const subscribers = this.topics.get(topic) || [];
    
    subscribers.forEach(subscriber => {
      // Async delivery
      setImmediate(() => {
        try {
          subscriber(message);
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      });
    });
  }
  
  subscribe(topic, callback) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
    
    this.topics.get(topic).push(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.topics.get(topic);
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }
}

// Request-Reply Pattern
class RequestReplyPattern {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  async sendRequest(service, request) {
    const requestId = this.generateId();
    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
    });
    
    // Send request to service
    this.sendToService(service, {
      id: requestId,
      type: 'request',
      data: request
    });
    
    // Set timeout
    setTimeout(() => {
      if (this.pendingRequests.has(requestId)) {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }
    }, 5000);
    
    return promise;
  }
  
  handleResponse(response) {
    const { id, type, data, error } = response;
    
    if (type === 'response') {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        this.pendingRequests.delete(id);
        
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(data);
        }
      }
    }
  }
}
```

## API Design

### RESTful API Design
```javascript
// REST API resource structure
class UserAPI {
  constructor(userService) {
    this.userService = userService;
  }
  
  // GET /users
  async getUsers(req, res) {
    const { page = 1, limit = 10, search } = req.query;
    
    const users = await this.userService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });
    
    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    });
  }
  
  // GET /users/:id
  async getUser(req, res) {
    const { id } = req.params;
    
    try {
      const user = await this.userService.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // POST /users
  async createUser(req, res) {
    const userData = req.body;
    
    try {
      const user = await this.userService.createUser(userData);
      res.status(201).json({ data: user });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // PUT /users/:id
  async updateUser(req, res) {
    const { id } = req.params;
    const userData = req.body;
    
    try {
      const user = await this.userService.updateUser(id, userData);
      res.json({ data: user });
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // DELETE /users/:id
  async deleteUser(req, res) {
    const { id } = req.params;
    
    try {
      await this.userService.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

### GraphQL API Design
```javascript
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql');

// GraphQL schema
const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    posts: {
      type: new GraphQLList(postType),
      resolve: (user) => getPostsByUserId(user.id)
    }
  }
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: userType,
      args: {
        id: { type: GraphQLString }
      },
      resolve: (_, { id }) => getUserById(id)
    },
    users: {
      type: new GraphQLList(userType),
      resolve: () => getAllUsers()
    }
  }
});

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: userType,
      args: {
        name: { type: GraphQLString },
        email: { type: GraphQLString }
      },
      resolve: (_, { name, email }) => createUser({ name, email })
    }
  }
});

const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType
});
```

## Common Interview Questions

### Q: How would you design a URL shortener?
A: Key components:
1. **Hash Generation**: Base62 encoding for short URLs
2. **Database**: Store mapping between short/long URLs
3. **Caching**: Redis for frequently accessed URLs
4. **Analytics**: Track click counts and referrers
5. **Load Balancing**: Handle high traffic

```javascript
class URLShortener {
  constructor(database, cache) {
    this.database = database;
    this.cache = cache;
    this.base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  async shortenUrl(longUrl) {
    // Check if URL already exists
    const existing = await this.database.findByLongUrl(longUrl);
    if (existing) {
      return existing.shortUrl;
    }
    
    // Generate short code
    const id = await this.database.getNextId();
    const shortCode = this.encodeBase62(id);
    const shortUrl = `https://short.ly/${shortCode}`;
    
    // Store in database
    await this.database.create({
      id,
      longUrl,
      shortUrl,
      shortCode,
      createdAt: new Date()
    });
    
    // Cache the mapping
    await this.cache.set(shortCode, longUrl, 3600);
    
    return shortUrl;
  }
  
  async getLongUrl(shortCode) {
    // Try cache first
    let longUrl = await this.cache.get(shortCode);
    
    if (!longUrl) {
      // Fallback to database
      const record = await this.database.findByShortCode(shortCode);
      if (record) {
        longUrl = record.longUrl;
        await this.cache.set(shortCode, longUrl, 3600);
      }
    }
    
    return longUrl;
  }
  
  encodeBase62(num) {
    let result = '';
    while (num > 0) {
      result = this.base62[num % 62] + result;
      num = Math.floor(num / 62);
    }
    return result.padStart(6, '0');
  }
}
```

### Q: How would you design a Twitter-like system?
A: Architecture components:
1. **User Service**: Profile management, authentication
2. **Tweet Service**: Create, read tweets
3. **Timeline Service**: Generate user timelines
4. **Feed Service**: Home timeline generation
5. **Notification Service**: Likes, mentions, follows
6. **Analytics**: Real-time metrics

### Q: How would you handle high traffic for an e-commerce site?
A: Strategies:
1. **Load Balancing**: Distribute traffic across servers
2. **Caching**: Multiple layers (CDN, application, database)
3. **Database**: Read replicas, sharding
4. **Queue**: Asynchronous processing for orders
5. **CDN**: Static content delivery
6. **Auto-scaling**: Dynamic resource allocation

### Q: What is the difference between SQL and NoSQL databases?
A: 
**SQL (Relational)**:
- Structured data with schema
- ACID transactions
- Complex queries with JOINs
- Good for structured data, relationships

**NoSQL (Non-relational)**:
- Flexible schema
- Horizontal scaling
- Eventually consistent
- Good for unstructured data, high throughput

### Q: How would you ensure system reliability?
A: Reliability measures:
1. **Redundancy**: Multiple instances, failover
2. **Monitoring**: Health checks, metrics, alerts
3. **Circuit Breakers**: Prevent cascading failures
4. **Rate Limiting**: Prevent overload
5. **Backup and Recovery**: Data protection
6. **Disaster Recovery**: Multi-region deployment

## Best Practices

### API Design
```javascript
// API versioning
app.get('/api/v1/users', getUsersV1);
app.get('/api/v2/users', getUsersV2);

// Consistent response format
const response = {
  data: result,
  meta: {
    timestamp: new Date().toISOString(),
    version: '1.0'
  },
  errors: []
};

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests
}));
```

### Database Design
```sql
-- Indexing strategy
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Partitioning for large tables
CREATE TABLE orders_2023 PARTITION OF orders
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Security
```javascript
// Input validation
const { body, validationResult } = require('express-validator');

app.post('/api/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
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
```

### Performance Optimization
```javascript
// Caching strategy
class CacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.localCache = new Map();
  }
  
  async get(key) {
    // Try local cache first
    if (this.localCache.has(key)) {
      return this.localCache.get(key);
    }
    
    // Try Redis
    const value = await this.redis.get(key);
    if (value) {
      this.localCache.set(key, JSON.parse(value));
      return JSON.parse(value);
    }
    
    return null;
  }
  
  async set(key, value, ttl = 3600) {
    // Set in both caches
    this.localCache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}

// Database connection pooling
const pgp = require('pg-promise')();
const db = pgp({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000
});
```

## Additional Topics

### Consistent Hashing
- Traditional hashing (key % N servers) breaks when servers are added/removed (almost all keys remap).
- Consistent Hashing arranges servers and keys on a virtual ring (0 to 2^32).
- Only K/N keys need to be remapped when a server is added/removed (K = keys, N = servers).
- **Virtual Nodes**: Each server is placed at multiple positions on the ring for better distribution.
- **Use Case**: Distributed caches (Redis Cluster), CDNs, database sharding.

```
Ring:  0 ----[Server A]---- [Key 1] ----[Server B]---- [Key 2] ----[Server C]---- 2^32
       Key 1 maps to Server B (next server clockwise on the ring)
       Key 2 maps to Server C
```

### Rate Limiter Design
A classic system design interview question. Approaches:

| Algorithm | How It Works | Pros | Cons |
|---|---|---|---|
| **Token Bucket** | Tokens added at fixed rate; each request consumes a token | Allows bursts, smooth | Needs timer |
| **Leaky Bucket** | Requests queued and processed at fixed rate | Smooth output | No burst handling |
| **Fixed Window Counter** | Count requests in fixed time windows (e.g., per minute) | Simple | Burst at window edges |
| **Sliding Window Log** | Track timestamp of each request in a sorted set | Precise | High memory |
| **Sliding Window Counter** | Weighted combination of current + previous window counts | Balanced | Approximate |

```javascript
// Token Bucket implementation
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  allowRequest() {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}
```

### CDN (Content Delivery Network) Design
- **Purpose**: Serve static content from servers geographically closest to the user.
- **Pull CDN**: CDN fetches content from origin on first request, caches it. Simpler.
- **Push CDN**: You upload content to the CDN proactively. Better for large, infrequently updated files.
- **Invalidation**: Versioned URLs (`app.v2.js`), purge APIs, or TTL-based expiry.

### Bloom Filters
- A probabilistic data structure that answers "is this element in the set?".
- **False positives**: Possible (says "yes" when it's not).
- **False negatives**: Impossible (never says "no" when it is).
- **Use Case**: Checking if a username is taken (fast pre-check before hitting DB), spam detection, CDN cache lookup.
- **How**: Uses multiple hash functions mapping to a bit array.

### Scaling WebSockets
- WebSockets maintain long-lived connections, breaking stateless scaling.
- **Solutions**:
  - **Sticky Sessions**: Route the same user to the same server (via load balancer).
  - **Pub/Sub Backend (Redis)**: When Server A receives a message, it publishes to Redis. All servers subscribe and forward to their connected clients.
  - **Dedicated WebSocket Service**: Separate from the REST API, scaled independently.

## Classic System Design Scenarios

### Design a Chat System (WhatsApp/Slack)
- **Components**: WebSocket Gateway, Message Service, Presence Service, Notification Service, Media Storage (S3).
- **Message Flow**: Sender → WebSocket → Message Service → DB + Message Queue → Recipient's WebSocket.
- **Presence**: Heartbeat mechanism. Client sends periodic pings. Server marks user offline after timeout.
- **Group Chat**: Fan-out on write (write message to each member's inbox) vs fan-out on read (members query the group's message log).

### Design a Notification System
- **Types**: Push (mobile), Email, SMS, In-app.
- **Components**: Notification Service → Priority Queue → Workers (one per channel).
- **Rate Limiting**: Prevent notification fatigue (max N notifications per user per hour).
- **User Preferences**: Users can opt-out of specific notification types.
- **Retry with Backoff**: Failed deliveries go to a retry queue with exponential backoff.

### Design a File Storage System (Google Drive/Dropbox)
- **Upload**: Break files into chunks, upload in parallel, store in object storage (S3).
- **Sync**: Use a metadata server to track file versions. Clients poll or use WebSockets for change notifications.
- **Deduplication**: Hash file chunks. If the hash already exists, skip upload.
- **Versioning**: Keep multiple versions of file metadata for undo/history.

## Additional Interview Questions

### Q: How would you design a system for 1 million concurrent users?
A: Key strategies:
1. **Stateless services** behind a load balancer (horizontal scaling).
2. **CDN** for static assets.
3. **Database read replicas** for read-heavy workloads.
4. **Caching layer** (Redis) between app and DB.
5. **Message queues** to handle spikes asynchronously.
6. **Auto-scaling groups** based on CPU/request metrics.
7. **Database sharding** if single DB becomes a bottleneck.

### Q: What are the tradeoffs of horizontal vs vertical scaling?
A:
- **Vertical Scaling (Scale Up)**: Add more CPU/RAM to a single server. Simple, no code changes. Limited by hardware ceiling. Single point of failure.
- **Horizontal Scaling (Scale Out)**: Add more servers. No ceiling. Requires stateless design, load balancer, distributed data management. More complex but more resilient.
