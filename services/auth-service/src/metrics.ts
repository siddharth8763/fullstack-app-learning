// =============================================================
// Prometheus Metrics Setup
// INTERVIEW: prom-client is the official Prometheus client for Node.js.
// Metric types:
//   Counter    — monotonically increasing (e.g., total requests)
//   Gauge      — can go up and down (e.g., active connections)
//   Histogram  — samples observations with buckets (e.g., response time)
//   Summary    — similar but calculates quantiles on the client side
//
// The /metrics endpoint is scraped by Prometheus every ~15s.
// Grafana then queries Prometheus to visualize these metrics.
// =============================================================

import { Request, Response, NextFunction, Router } from 'express';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();
register.setDefaultLabels({ service: 'auth-service' });

// Collect default Node.js metrics (event loop lag, heap size, GC, etc.)
collectDefaultMetrics({ register });

// ── Custom Metrics ─────────────────────────────────────────────

// INTERVIEW: Use a Counter to track total HTTP requests.
// Labels (method, route, status_code) allow you to filter/group in PromQL.
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// INTERVIEW: Histogram measures latency distribution.
// 'buckets' define the upper bounds of each histogram bucket.
// e.g., 50% of requests complete in < 100ms, 95% in < 500ms.
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

export const loginCounter = new Counter({
  name: 'auth_logins_total',
  help: 'Total login attempts',
  labelNames: ['status'],  // 'success' | 'failure'
  registers: [register],
});

// ── Middleware: Tracks duration & count per request ────────────
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path ?? req.path;

    httpRequestCounter.labels(req.method, route, String(res.statusCode)).inc();
    httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(duration);
  });

  next();
};

// ── /metrics Route ─────────────────────────────────────────────
export const metricsRouter = Router();
metricsRouter.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
