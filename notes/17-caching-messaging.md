# Advanced Data Caching & Message Brokers

## Redis & Caching

### Redis Uses Cases
Redis (Remote Dictionary Server) is an in-memory data structure store, used as a distributed, in-memory key–value database, cache, and message broker.
1. **Caching Database Queries**: Storing heavy DB query results temporarily to relieve RDS/MySQL load.
2. **Session Storage**: Storing JWT blocklists or server-side session IDs (since it is extremely fast and persistent across microservice instances).
3. **Rate Limiting**: Using key-expiration times to limit API hits per IP address easily.
4. **Pub/Sub**: Using Redis as a fast, light-weight pub/sub system for real-time events (WebSockets).

### Caching Strategies
- **Cache Aside (Lazy Loading)**: Application queries Cache. If miss, queries Database, writes to Cache, then returns data.
  - *Pros:* Only caches requested data.
  - *Cons:* First request is slow (cache penalty).
- **Write-Through**: Whenever application writes to DB, it immediately writes to Cache as well.
  - *Pros:* Data in cache is never stale.
  - *Cons:* Slower write operations.

### Cache Eviction Policies
When memory gets full, Redis must remove data:
- **LRU (Least Recently Used)**: Evicts the least recently accessed keys first. Highly recommended for web caches.
- **LFU (Least Frequently Used)**: Evicts keys that are requested the least heavily.
- **TTL (Time To Live)**: Keys naturally expire after X seconds.

## Message Brokers (Kafka vs RabbitMQ)

In a microservices architecture, services often need to communicate asynchronously to remain decoupled. Message brokers handle this.

### Asynchronous Messaging Types
1. **Message Queues**: Point-to-point. A message is sent globally, but consumed by exactly ONE worker. (Used for tasks like sending emails, resizing images).
2. **Pub/Sub**: Publisher sends to a topic, and MULTIPLE subscribers receive a copy of that same message.

### RabbitMQ
- **Type**: Traditional Message Broker.
- **Mechanism**: Smart Broker / Dumb Consumer. Pushes messages to consumers. 
- **Features**: Highly flexible routing rules (exchanges, routing keys).
- **Persistence**: Messages are typically deleted from queues once consumed and acknowledged.
- **Best For**: Complex routing logic, background job queues, low latency task offloading.

### Apache Kafka
- **Type**: Distributed Event Streaming Platform.
- **Mechanism**: Dumb Broker / Smart Consumer. Consumers pull messages from the broker.
- **Persistence**: Stores streams of records sequentially (like a commit log). Messages are kept for a set period (days/weeks) even after consumption.
- **Features**: Horizontally scalable using partitions, allows consumers to "replay" historical events. 
- **Best For**: Big data pipelines, Event Sourcing architectures, high-throughput microservice communication, audit logging.

## Common Interview Questions

### Q: What is the "Cache Stampede" (or Thundering Herd) problem?
A: When a highly requested cached item expires at the exact same moment, causing thousands of requests to simultaneously hit the database, potentially crashing it. It can be solved by adding random "jitter" to the TTL (e.g., expiry is 5 minutes +/- 30 seconds) so expirations stagger out, or locking the fetch mechanism.

### Q: If a message fails processing in a queue, what happens?
A: You utilize a Dead Letter Queue (DLQ). If a worker fails to process a message multiple times (due to crashes or malformed data), the broker routes it to the DLQ instead of blocking the main queue. Engineers can then manually inspect the DLQ.

### Q: Explain Eventual Consistency in Microservices.
A: Unlike monolithic systems with a single SQL database capable of ACID transactions, microservices spread data across databases. Using message brokers, changes from Service A are emitted as events. Service B listens and updates its DB seconds later. Thus, the system is not instantly consistent, but "eventually" consistent.

## Redis Data Structures

Redis supports more than just key-value strings:

| Data Structure | Description | Use Case |
|---|---|---|
| **String** | Simple key-value | Caching, counters |
| **List** | Ordered collection (linked list) | Job queues, activity feeds |
| **Set** | Unordered unique values | Tags, unique visitors |
| **Sorted Set (ZSet)** | Set with a score per element | Leaderboards, priority queues |
| **Hash** | Key-value pairs within a key | User profiles, object storage |
| **Stream** | Append-only log | Event sourcing, real-time data |

```bash
# Sorted Set example: Leaderboard
ZADD leaderboard 100 "player1"
ZADD leaderboard 200 "player2"
ZRANGE leaderboard 0 -1 WITHSCORES   # Get all, sorted by score
ZREVRANK leaderboard "player2"        # Rank of player2 (0-indexed, desc)
```

## Write-Behind (Write-Back) Caching
- Application writes to Cache first, returns immediately to the user.
- A background worker asynchronously flushes dirty cache entries to the database.
- **Pros**: Fastest write performance, can batch/coalesce writes.
- **Cons**: Risk of data loss if cache crashes before flushing to DB.

## CDN Caching
- **CDN (Content Delivery Network)**: A network of geographically distributed servers that cache static content (images, CSS, JS) close to users.
- **Cache-Control headers**: `max-age`, `s-maxage`, `no-cache`, `no-store`, `stale-while-revalidate`.
- **Cache Invalidation**: Hardest problem in computing. Strategies:
  - **Filename hashing** (e.g., `app.a1b2c3.js`): New builds get new filenames, old files naturally expire.
  - **Purge API**: Explicitly clear CDN cache for specific URLs.

## Kafka Deep Dive

### Consumer Groups
- Multiple consumers in a group split the work of reading from partitions.
- Each partition is consumed by exactly ONE consumer in a group (no duplicates).
- If a consumer fails, its partitions are reassigned to other consumers in the group (**rebalancing**).

### Partitions
- A topic is split into partitions for parallel processing.
- Messages within a single partition maintain **strict ordering**.
- The partition key (e.g., `userId`) determines which partition a message goes to, ensuring all events for a given user are processed in order.

### Kafka Offsets
- Each message in a partition has an **offset** (a sequential number).
- Consumers track their offset to know where they left off.
- **Auto-commit** vs **Manual commit**: Manual gives more control (at-least-once vs at-most-once delivery guarantees).

## Idempotency in Distributed Systems
- An operation is **idempotent** if performing it multiple times produces the same result as performing it once.
- **Why it matters**: In distributed systems, messages can be delivered more than once (network retries). Without idempotency, a payment could be charged twice.
- **Implementation**: Use unique **idempotency keys** (e.g., `orderId`). Before processing, check if the key has already been processed.

```javascript
async function processPayment(orderId, amount) {
  // Check if already processed
  const existing = await db.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
  if (existing.length > 0) return existing[0]; // Already processed, return existing result
  
  // Process payment
  const result = await paymentGateway.charge(amount);
  await db.query('INSERT INTO payments (order_id, amount, status) VALUES (?, ?, ?)', 
    [orderId, amount, 'completed']);
  return result;
}
```

## Back-Pressure
- When a producer generates messages faster than the consumer can process them.
- **Strategies**:
  - **Buffering**: Queue messages temporarily (up to a limit).
  - **Dropping**: Discard excess messages (acceptable for non-critical data like metrics).
  - **Rate Limiting**: Slow down the producer.
  - **Scaling**: Add more consumer instances.

## Additional Interview Questions

### Q: How do you choose between Redis and Memcached?
A: Redis supports rich data structures (lists, sets, sorted sets), persistence, pub/sub, and Lua scripting. Memcached is simpler, multi-threaded (better for pure key-value caching with high throughput), but lacks persistence and complex data types. Use Redis for most cases; Memcached only if you need simple, high-throughput, multi-threaded caching.

### Q: What is Event Sourcing?
A: Instead of storing the current state, you store a sequence of all events ("UserCreated", "NameChanged", "AddressUpdated"). The current state is derived by replaying all events. Benefits: full audit trail, ability to reconstruct state at any point in time, easy debugging. Kafka's commit log naturally supports this pattern.
