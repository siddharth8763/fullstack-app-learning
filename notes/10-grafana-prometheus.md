# Grafana & Prometheus Interview Notes

## Prometheus Fundamentals

### What is Prometheus?
- **Time Series Database**: Stores metrics with timestamps
- **Pull-based Metrics**: Scrapes metrics from endpoints
- **Multi-dimensional Data**: Labels for data organization
- **PromQL Query Language**: Powerful querying capabilities

### Core Components
- **Prometheus Server**: Main storage and query engine
- **Exporters**: Expose metrics from various systems
- **Alertmanager**: Handle alert routing and notifications
- **Pushgateway**: For short-lived jobs
- **Service Discovery**: Find targets to scrape

### Metric Types
```yaml
# Counter: Only increases
http_requests_total{method="GET", endpoint="/api/users"} 1050

# Gauge: Can go up or down
memory_usage_bytes{instance="web-1"} 134217728

# Histogram: Observations and buckets
http_request_duration_seconds_bucket{le="0.1"} 1000
http_request_duration_seconds_bucket{le="0.5"} 1500
http_request_duration_seconds_bucket{le="1.0"} 1800
http_request_duration_seconds_bucket{le="+Inf"} 2000
http_request_duration_seconds_sum 450.5
http_request_duration_seconds_count 2000

# Summary: Similar to histogram with quantiles
request_duration_seconds{quantile="0.5"} 0.25
request_duration_seconds{quantile="0.95"} 0.8
request_duration_seconds{quantile="0.99"} 1.2
request_duration_seconds_sum 450.5
request_duration_seconds_count 2000
```

## Instrumentation

### Node.js Application Metrics
```javascript
const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom Counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Custom Gauge
const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

// Custom Histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// Express middleware
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path)
      .observe(duration);
  });
  
  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Usage in application
app.get('/api/users', metricsMiddleware, async (req, res) => {
  activeConnections.inc();
  
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    activeConnections.dec();
  }
});
```

### Custom Business Metrics
```javascript
// Business metrics tracking
class BusinessMetrics {
  constructor() {
    this.userRegistrations = new promClient.Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['plan_type'],
      registers: [register]
    });
    
    this.orderValue = new promClient.Histogram({
      name: 'order_value_dollars',
      help: 'Order value in dollars',
      labelNames: ['currency', 'payment_method'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
      registers: [register]
    });
    
    this.activeSubscriptions = new promClient.Gauge({
      name: 'active_subscriptions',
      help: 'Number of active subscriptions',
      labelNames: ['plan_type'],
      registers: [register]
    });
  }
  
  trackUserRegistration(planType) {
    this.userRegistrations.labels(planType).inc();
  }
  
  trackOrder(value, currency, paymentMethod) {
    this.orderValue.labels(currency, paymentMethod).observe(value);
  }
  
  updateActiveSubscriptions(planType, count) {
    this.activeSubscriptions.labels(planType).set(count);
  }
}
```

## PromQL (Prometheus Query Language)

### Basic Queries
```promql
# Simple metric selection
http_requests_total

# Filter by labels
http_requests_total{method="GET"}

# Multiple label filters
http_requests_total{method="GET", status_code="200"}

# Regex label matching
http_requests_total{method=~"GET|POST"}

# Negative regex matching
http_requests_total{method!~"DELETE|PUT"}
```

### Time Series Operations
```promql
# Rate of change over time
rate(http_requests_total[5m])

# Increase over time period
increase(http_requests_total[1h])

# Absolute change
delta(cpu_usage_total[5m])

# Predict future values
predict_linear(cpu_usage_total[5m], 3600)
```

### Aggregation Operators
```promql
# Sum across label dimensions
sum(http_requests_total) by (method)

# Average values
avg(cpu_usage) by (instance)

# Maximum value
max(memory_usage) by (instance)

# Minimum value
min(response_time_seconds) by (endpoint)

# Count of series
count(http_requests_total)

# Standard deviation
stddev(request_duration_seconds) by (service)

# Quantiles
quantile(0.95, request_duration_seconds) by (service)
```

### Advanced Queries
```promql
# Percentage of errors
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
  / sum(rate(http_requests_total[5m])) * 100

# 95th percentile of response times
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Service Level Objective (SLO)
sum(rate(http_requests_total{status_code!~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# Anomaly detection
abs(rate(cpu_usage[5m]) - avg(rate(cpu_usage[5m]) by (instance))) 
  > 0.1 * avg(rate(cpu_usage[5m]) by (instance))

# Uptime calculation
up{job="myapp"}
sum(up{job="myapp"}) / count(up{job="myapp"}) * 100
```

## Grafana Fundamentals

### Grafana Architecture
- **Data Sources**: Connect to various databases (Prometheus, InfluxDB, etc.)
- **Dashboards**: Collections of panels
- **Panels**: Visualizations (graphs, tables, stats)
- **Alerting**: Rule-based notifications
- **Users & Teams**: Access control and organization

### Dashboard Configuration
```json
{
  "dashboard": {
    "id": null,
    "title": "Application Metrics",
    "tags": ["nodejs", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

### Panel Types
```json
// Graph panel
{
  "type": "graph",
  "targets": [
    {
      "expr": "rate(http_requests_total[5m])",
      "legendFormat": "{{method}}"
    }
  ],
  "yAxes": [
    {
      "label": "Rate",
      "format": "reqps"
    }
  ]
}

// Stat panel
{
  "type": "stat",
  "targets": [
    {
      "expr": "sum(active_connections)",
      "legendFormat": "Active Connections"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "short",
      "thresholds": {
        "steps": [
          {"color": "green", "value": null},
          {"color": "yellow", "value": 100},
          {"color": "red", "value": 500}
        ]
      }
    }
  }
}

// Table panel
{
  "type": "table",
  "targets": [
    {
      "expr": "topk(10, rate(http_requests_total[5m]))",
      "format": "table",
      "instant": true
    }
  ],
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": {},
        "indexByName": {},
        "renameByName": {
          "Time": "Timestamp",
          "Value": "Request Rate"
        }
      }
    }
  ]
}

// Heatmap panel
{
  "type": "heatmap",
  "targets": [
    {
      "expr": "rate(http_request_duration_seconds_bucket[5m])",
      "legendFormat": "{{le}}"
    }
  ]
}
```

## Alerting

### Prometheus Alerting Rules
```yaml
# alert_rules.yml
groups:
  - name: application_alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
          service: webapp
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
          
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
          service: webapp
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
          
      - alert: ServiceDown
        expr: up{job="webapp"} == 0
        for: 1m
        labels:
          severity: critical
          service: webapp
        annotations:
          summary: "Service is down"
          description: "Instance {{ $labels.instance }} is down"
          
      - alert: HighMemoryUsage
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
          / node_memory_MemTotal_bytes > 0.9
        for: 15m
        labels:
          severity: warning
          service: infrastructure
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

### Alertmanager Configuration
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@company.com'

route:
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/'

  - name: 'critical-alerts'
    email_configs:
      - to: 'team@company.com'
        subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts'
        title: 'Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'warning-alerts'
    email_configs:
      - to: 'team@company.com'
        subject: '[WARNING] {{ .GroupLabels.alertname }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service']
```

## Advanced Topics

### Recording Rules
```yaml
# recording_rules.yml
groups:
  - name: application_rules
    interval: 30s
    rules:
      - record: job:http_requests_total:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
        
      - record: job:http_request_duration_seconds:quantile95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))
        
      - record: job:cpu_usage:rate5m
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Service Discovery
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Kubernetes service discovery
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
        
  # EC2 service discovery
  - job_name: 'ec2-instances'
    ec2_sd_configs:
      - region: us-east-1
        port: 9100
        filters:
          - name: "tag:Environment"
            values: ["production"]
    relabel_configs:
      - source_labels: [__meta_ec2_tag_Name]
        target_label: instance
```

### Custom Exporters
```javascript
// Custom exporter for business metrics
const express = require('express');
const promClient = require('prom-client');
const app = express();

const register = new promClient.Registry();

// Business metrics
const orderTotal = new promClient.Gauge({
  name: 'business_order_total_dollars',
  help: 'Total order value in dollars',
  labelNames: ['currency'],
  registers: [register]
});

const activeUsers = new promClient.Gauge({
  name: 'business_active_users',
  help: 'Number of active users',
  registers: [register]
});

// Update metrics periodically
setInterval(async () => {
  try {
    // Fetch business metrics
    const totalOrders = await fetchOrderTotal();
    const userCount = await fetchActiveUserCount();
    
    orderTotal.set({ currency: 'USD' }, totalOrders);
    activeUsers.set(userCount);
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}, 30000);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(9100, () => {
  console.log('Custom exporter running on port 9100');
});
```

## Common Interview Questions

### Q: What is the difference between Prometheus push and pull models?
A: 
**Pull Model (Prometheus default)**:
- Prometheus scrapes metrics from targets
- Better for monitoring infrastructure
- Easier to detect down targets
- Can use service discovery

**Push Model**:
- Applications push metrics to gateway
- Better for short-lived jobs
- Used with Pushgateway
- Can't detect target failures

### Q: What are the different metric types in Prometheus?
A: Metric types:
- **Counter**: Only increases (e.g., total requests)
- **Gauge**: Can go up or down (e.g., memory usage)
- **Histogram**: Observations in configurable buckets
- **Summary**: Similar to histogram with quantiles

### Q: How does Grafana differ from Prometheus?
A: 
**Prometheus**: Time series database and query engine
- Stores metrics data
- Provides PromQL query language
- Handles alerting rules

**Grafana**: Visualization and dashboarding
- Connects to multiple data sources
- Creates dashboards and panels
- Provides alerting and notifications
- User management and organization

### Q: What is the purpose of labels in Prometheus?
A: Labels provide:
- **Multi-dimensional data**: Key-value pairs for metadata
- **Filtering**: Select specific time series
- **Aggregation**: Group and aggregate data
- **Organization**: Structure metrics logically

Example: `http_requests_total{method="GET", status="200"}`

### Q: How do you calculate SLOs in Prometheus?
A: SLO (Service Level Objective) calculations:
```promql
# Error rate SLO
sum(rate(http_requests_total{status_code!~"5.."}[30d]))
/ sum(rate(http_requests_total[30d])) > 0.99

# Latency SLO
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[30d])) by (le)
) < 0.5

# Availability SLO
sum(up{job="service"}) / count(up{job="service"}) > 0.999
```

## Best Practices

### Metric Naming
```javascript
// Good naming conventions
const metrics = {
  // Use domain_prefix_metric_name format
  http_requests_total: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests'
  }),
  
  // Use snake_case
  database_connections_active: new Gauge({
    name: 'database_connections_active',
    help: 'Active database connections'
  }),
  
  // Include units in name
  cpu_usage_percent: new Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage'
  })
};
```

### Label Strategy
```javascript
// Use consistent label names
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: [
    'method',        // HTTP method
    'route',         // API route
    'status_code',   // HTTP status
    'version',       // Application version
    'environment'    // Deployment environment
  ]
});

// Keep cardinality low
// Bad: user_id as label (high cardinality)
// Good: user_tier as label (low cardinality)
```

### Dashboard Design
```json
{
  "dashboard": {
    "title": "Service Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "description": "Requests per second by method"
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "description": "Percentage of 5xx errors"
      },
      {
        "title": "Response Time",
        "type": "graph",
        "description": "95th percentile response time"
      }
    ]
  }
}
```

### Performance Optimization
```yaml
# Prometheus configuration optimizations
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    replica: 'prometheus-1'

# Storage optimization
storage:
  tsdb:
    retention.time: 30d
    retention.size: 10GB
```
