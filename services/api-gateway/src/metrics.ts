import { Request, Response, NextFunction, Router } from 'express';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();
register.setDefaultLabels({ service: 'api-gateway' });
collectDefaultMetrics({ register });

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

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

export const metricsRouter = Router();
metricsRouter.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
