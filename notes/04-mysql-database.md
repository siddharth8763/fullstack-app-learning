# MySQL Database Interview Notes

## Database Fundamentals

### ACID Properties
- **Atomicity**: All operations in a transaction succeed or fail together
- **Consistency**: Database remains in valid state after transaction
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed changes persist even after system failure

```sql
-- Transaction example
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Either both updates succeed or both fail
COMMIT; -- or ROLLBACK;
```

### Normalization
- **1NF**: Each cell contains atomic values, no repeating groups
- **2NF**: 1NF + no partial dependencies on composite keys
- **3NF**: 2NF + no transitive dependencies
- **BCNF**: Stronger version of 3NF

```sql
-- Unnormalized (violates 1NF)
orders (order_id, customer_id, product_ids, quantities)

-- 1NF (atomic values)
order_items (order_id, product_id, quantity)

-- 3NF (remove transitive dependencies)
customers (customer_id, customer_name, city_id)
cities (city_id, city_name, state)
```

## MySQL Specific Features

### Storage Engines
- **InnoDB**: Default, supports transactions, foreign keys, row-level locking
- **MyISAM**: Older engine, table-level locking, no transactions
- **Memory**: In-memory storage, very fast, data lost on restart

```sql
-- Specify storage engine
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
) ENGINE=InnoDB;
```

### Index Types
- **Primary Key**: Unique identifier for each row
- **Unique Index**: Ensures column values are unique
- **Composite Index**: Index on multiple columns
- **Full-text Index**: For text searching
- **Spatial Index**: For geographic data

```sql
-- Index examples
CREATE INDEX idx_email ON users(email);
CREATE UNIQUE INDEX idx_username ON users(username);
CREATE INDEX idx_name_age ON users(last_name, age);
CREATE FULLTEXT INDEX idx_content ON articles(content);

-- Explain query execution
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

### Data Types
```sql
-- Numeric types
INT, BIGINT, DECIMAL(10,2), FLOAT, DOUBLE

-- String types
VARCHAR(255), TEXT, CHAR(10), ENUM('A','B','C')

-- Date/Time types
DATE, TIME, DATETIME, TIMESTAMP, YEAR

-- JSON type (MySQL 5.7+)
CREATE TABLE products (
  id INT PRIMARY KEY,
  attributes JSON
);

-- Query JSON data
SELECT * FROM products 
WHERE JSON_EXTRACT(attributes, '$.color') = 'red';
```

## Advanced SQL Concepts

### Joins
```sql
-- Inner Join (default)
SELECT u.name, o.order_date
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- Left Join
SELECT u.name, o.order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- Right Join
SELECT u.name, o.order_date
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;

-- Full Outer Join (MySQL workaround)
SELECT u.name, o.order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
UNION
SELECT u.name, o.order_date
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
```

### Subqueries and CTEs
```sql
-- Subquery
SELECT name FROM users 
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- Common Table Expression (CTE)
WITH top_customers AS (
  SELECT user_id, SUM(total) as total_spent
  FROM orders
  GROUP BY user_id
  HAVING SUM(total) > 1000
)
SELECT u.name, tc.total_spent
FROM users u
JOIN top_customers tc ON u.id = tc.user_id;

-- Window Functions
SELECT 
  name,
  total,
  ROW_NUMBER() OVER (ORDER BY total DESC) as rank,
  LAG(total) OVER (ORDER BY total DESC) as prev_total
FROM orders;
```

### Aggregate Functions
```sql
-- Basic aggregates
SELECT COUNT(*), AVG(price), MAX(price), MIN(price), SUM(price)
FROM products;

-- Group by with having
SELECT category, COUNT(*) as count, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING COUNT(*) > 10;

-- Conditional aggregation
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
FROM users;
```

## Performance Optimization

### Query Optimization
```sql
-- Use indexes effectively
-- Bad: function on indexed column
SELECT * FROM users WHERE YEAR(created_at) = 2023;

-- Good: range on indexed column
SELECT * FROM users 
WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';

-- Avoid SELECT *
SELECT id, name, email FROM users WHERE active = 1;

-- Use LIMIT for large result sets
SELECT * FROM orders LIMIT 1000;

-- Use EXPLAIN to analyze queries
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

### Indexing Strategy
```sql
-- B-Tree indexes (default)
CREATE INDEX idx_user_email ON users(email);

-- Composite indexes (order matters)
CREATE INDEX idx_user_status_created ON users(status, created_at);

-- Covering indexes (include all needed columns)
CREATE INDEX idx_order_covering ON orders(user_id, total, status);

-- Partial indexes (MySQL 8.0+)
CREATE INDEX idx_active_users ON users(id) WHERE active = 1;

-- Index cardinality check
SELECT COUNT(DISTINCT email) / COUNT(*) as cardinality FROM users;
```

### Database Configuration
```sql
-- MySQL configuration variables
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'query_cache_size';
SHOW VARIABLES LIKE 'max_connections';

-- Performance schema
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY COUNT_STAR DESC LIMIT 10;

-- Slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

## Transactions and Locking

### Transaction Isolation Levels
```sql
-- Read Uncommitted (lowest isolation)
-- Allows dirty reads

-- Read Committed (default in many databases)
-- Prevents dirty reads, allows non-repeatable reads

-- Repeatable Read (MySQL default)
-- Prevents dirty and non-repeatable reads, allows phantom reads

-- Serializable (highest isolation)
-- Prevents all concurrency issues

SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

### Locking Mechanisms
```sql
-- Explicit locking
SELECT * FROM users WHERE id = 1 FOR UPDATE; -- Row lock
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE; -- Shared lock

-- Table locks
LOCK TABLES users WRITE;
-- ... operations ...
UNLOCK TABLES;

-- Deadlock detection
SHOW ENGINE INNODB STATUS;
```

### Optimistic Concurrency Control
```sql
-- Version column approach
UPDATE products 
SET name = 'New Name', version = version + 1
WHERE id = 1 AND version = 5;

-- Check affected rows to detect conflicts
```

## Database Design Patterns

### Soft Deletes
```sql
-- Add deleted_at column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;

-- Soft delete query
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- Query active records
SELECT * FROM users WHERE deleted_at IS NULL;
```

### Audit Trail
```sql
-- Audit table
CREATE TABLE user_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSON,
  new_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for automatic audit
DELIMITER //
CREATE TRIGGER user_audit_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  INSERT INTO user_audit (user_id, action, old_data, new_data)
  VALUES (OLD.id, 'UPDATE', 
          JSON_OBJECT('name', OLD.name, 'email', OLD.email),
          JSON_OBJECT('name', NEW.name, 'email', NEW.email));
END//
DELIMITER ;
```

### Hierarchical Data
```sql
-- Adjacency List Model
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Recursive CTE for hierarchy
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 as level
  FROM categories WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT c.id, c.name, c.parent_id, ct.level + 1
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
```

## Common Interview Questions

### Q: What is the difference between CHAR and VARCHAR?
A: 
- **CHAR**: Fixed-length string, padded with spaces
- **VARCHAR**: Variable-length string, only uses actual storage needed
- Use CHAR for consistently short values (like country codes)
- Use VARCHAR for variable-length text (names, emails)

### Q: Explain database indexes
A: Indexes are data structures that improve query performance:
- **B-Tree**: Default index type, good for range queries
- **Hash**: Good for exact matches
- **Full-text**: For text searching
- Trade-offs: Faster reads, slower writes, more storage

### Q: What is normalization and why is it important?
A: Normalization organizes data to reduce redundancy:
- **Eliminates data duplication**
- **Prevents update anomalies**
- **Ensures data consistency**
- Trade-off: Can make queries more complex

### Q: What is the difference between INNER JOIN and LEFT JOIN?
A:
- **INNER JOIN**: Returns only matching rows from both tables
- **LEFT JOIN**: Returns all rows from left table, matching from right
- **RIGHT JOIN**: Opposite of LEFT JOIN
- **FULL OUTER JOIN**: Returns all rows from both tables

### Q: How would you optimize a slow query?
A: Optimization strategies:
1. **Analyze with EXPLAIN**: Check execution plan
2. **Add appropriate indexes**: Based on WHERE clauses
3. **Rewrite query**: Avoid functions on indexed columns
4. **Limit result sets**: Use pagination
5. **Consider denormalization**: For complex queries

## Advanced Topics

### Partitioning
```sql
-- Range partitioning
CREATE TABLE orders (
  id INT AUTO_INCREMENT,
  order_date DATE,
  customer_id INT,
  total DECIMAL(10,2),
  PRIMARY KEY (id, order_date)
)
PARTITION BY RANGE (YEAR(order_date)) (
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025)
);

-- Query specific partition
SELECT * FROM orders PARTITION (p2023) WHERE customer_id = 123;
```

### Replication
```sql
-- Master configuration
server-id = 1
log-bin = mysql-bin
binlog-format = ROW

-- Slave configuration
server-id = 2
relay-log = mysql-relay

-- Set up replication
CHANGE MASTER TO
  MASTER_HOST='master-host',
  MASTER_USER='replication-user',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;
```

### Stored Procedures and Functions
```sql
-- Stored procedure
DELIMITER //
CREATE PROCEDURE GetUserOrders(IN user_id INT)
BEGIN
  SELECT o.id, o.total, o.created_at
  FROM orders o
  WHERE o.user_id = user_id
  ORDER BY o.created_at DESC;
END//
DELIMITER ;

-- Call procedure
CALL GetUserOrders(123);

-- Function
DELIMITER //
CREATE FUNCTION GetOrderTotal(order_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  DECLARE total DECIMAL(10,2);
  SELECT SUM(quantity * price) INTO total
  FROM order_items WHERE order_id = order_id;
  RETURN total;
END//
DELIMITER ;
```

## Best Practices

### Schema Design
- **Use appropriate data types**: Choose smallest sufficient type
- **Add constraints**: NOT NULL, FOREIGN KEY, CHECK
- **Index strategically**: Based on query patterns
- **Avoid reserved words**: For table/column names
- **Use consistent naming**: snake_case or camelCase

### Query Writing
- **Use parameterized queries**: Prevent SQL injection
- **Avoid SELECT ***: Specify needed columns
- **Use appropriate joins**: INNER vs OUTER
- **Handle NULL values**: COALESCE, IFNULL
- **Use transactions**: For multi-step operations

### Performance Monitoring
```sql
-- Slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Performance schema queries
SELECT 
  DIGEST_TEXT,
  COUNT_STAR as executions,
  AVG_TIMER_WAIT/1000000000 as avg_time_seconds
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC LIMIT 10;

-- Index usage statistics
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database';
```

## Additional Topics

### Connection Pooling
- Instead of opening/closing a new DB connection per request (expensive), a pool maintains a set of reusable connections.
- **Key settings**: `max` (max connections), `idleTimeoutMillis` (close idle connections), `connectionTimeoutMillis` (wait time for a connection from pool).

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'myapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Usage — connection is automatically returned to the pool
const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
```

### Database Migrations
- Version-controlled changes to the database schema (like Git for your DB).
- Tools: Knex.js migrations, Sequelize migrations, Flyway, Liquibase.
- **Up migration**: Apply the change (e.g., `ALTER TABLE ADD COLUMN`).
- **Down migration**: Reverse the change (e.g., `ALTER TABLE DROP COLUMN`).
- **Best Practice**: Never edit production data manually. Always use migration scripts.

### ORM vs Raw SQL
| Feature | ORM (Sequelize, Prisma) | Raw SQL |
|---|---|---|
| Productivity | High (auto-generates queries) | Lower |
| Type Safety | Excellent (Prisma) | Manual |
| Performance | Can generate suboptimal queries | Full control |
| Complex Queries | Difficult | Easy |
| Learning Curve | ORM-specific syntax | Standard SQL |

### SQL vs NoSQL (Interview Comparison)
| Feature | SQL (MySQL, PostgreSQL) | NoSQL (MongoDB, DynamoDB) |
|---|---|---|
| Schema | Rigid, predefined schema | Flexible, schema-less |
| Relationships | JOINs, Foreign Keys | Embedded documents, denormalization |
| Transactions | Full ACID | Limited (document-level) |
| Scaling | Vertical (scale up) | Horizontal (scale out / sharding) |
| Query Language | SQL (standardized) | Varies per DB |
| Best For | Structured data with relationships | Unstructured/semi-structured data, high write throughput |

## Additional Interview Questions

### Q: What is a deadlock and how do you prevent it?
A: A deadlock occurs when two transactions are each waiting for the other to release a lock, causing both to hang indefinitely. Prevention strategies:
- Always acquire locks in a consistent order.
- Keep transactions short.
- Use `SELECT ... FOR UPDATE` carefully.
- MySQL's InnoDB automatically detects deadlocks and rolls back the "cheaper" transaction.

### Q: Explain the difference between `DELETE`, `TRUNCATE`, and `DROP`.
A:
- **DELETE**: Removes rows one by one, can use `WHERE` clause, triggers fire, can be rolled back.
- **TRUNCATE**: Removes ALL rows instantly (resets auto-increment), cannot use `WHERE`, faster but cannot be rolled back easily.
- **DROP**: Removes the entire table (structure + data) from the database.
```
