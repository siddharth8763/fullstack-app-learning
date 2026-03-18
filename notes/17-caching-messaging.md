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
