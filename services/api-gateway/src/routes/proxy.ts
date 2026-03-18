// =============================================================
// API Gateway — Proxy Routes
// INTERVIEW: http-proxy-middleware (or express-http-proxy) forwards
// requests to downstream services. The gateway strips/adds headers
// and rewrites paths as needed.
//
// Circuit Breaker pattern: if a downstream service is down,
// the circuit breaker OPENS and returns a fallback response
// immediately (instead of waiting for timeouts). This prevents
// cascading failures across the system.
// Libraries: opossum, cockatiel.
// =============================================================

import proxy from 'express-http-proxy';
import { Router } from 'express';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';

// Helper: proxy with path rewriting
// e.g. /api/auth/login → /auth/login on auth-service
const createProxy = (targetUrl: string, pathPrefix: string) =>
  proxy(targetUrl, {
    proxyReqPathResolver: (req) => {
      // Remove the /api prefix before forwarding
      const newPath = req.url.replace(new RegExp(`^${pathPrefix}`), '');
      console.log(`[Gateway] Proxying ${req.method} ${req.url} → ${targetUrl}${newPath}`);
      return newPath || '/';
    },
    // Forward real client IP to downstream services
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (proxyReqOpts.headers) {
        proxyReqOpts.headers['X-Forwarded-For'] = srcReq.ip || '';
        proxyReqOpts.headers['X-Gateway-Version'] = '1.0.0';
      }
      return proxyReqOpts;
    },
    // Handle proxy errors (e.g., service is down)
    proxyErrorHandler: (_err, res, next) => {
      // INTERVIEW: This is a simple fallback. In production, implement
      // a circuit breaker with exponential backoff retry logic.
      (res as unknown as import('express').Response)
        .status(503)
        .json({ error: 'Service temporarily unavailable. Please try again.' });
      next();
    },
  });

// Router object exported to gateway index
export const proxyRouter = {
  // Auth service proxy — /api/auth/* → auth-service /auth/*
  auth: (() => {
    const router = Router();
    router.use('/', createProxy(AUTH_SERVICE_URL, '/api/auth'));
    return router;
  })(),

  // User service proxy — /api/users/* → user-service /users/*
  users: (() => {
    const router = Router();
    router.use('/', createProxy(USER_SERVICE_URL, '/api/users'));
    return router;
  })(),
};
