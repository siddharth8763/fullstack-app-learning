// =============================================================
// API Gateway — Entry Point
// INTERVIEW: An API Gateway is a reverse proxy that:
//   1. Acts as the single entry point for all client requests
//   2. Routes requests to appropriate downstream microservices
//   3. Handles cross-cutting concerns: auth, rate-limit, logging, CORS
//   4. Aggregates responses (BFF pattern — Backend For Frontend)
//
// Popular gateway solutions: Kong, AWS API Gateway, NGINX, Traefik.
// Here we implement a lightweight custom one with Express + http-proxy.
// =============================================================

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { proxyRouter } from './routes/proxy';
import { verifyToken } from './middleware/verifyToken';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware, metricsRouter } from './metrics';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Global Rate Limiting ───────────────────────────────────────
// INTERVIEW: Rate limiting at the gateway applies to ALL services.
// Individual services can have additional, stricter limits.
// Common strategy: sliding window counter in Redis for distributed systems.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max: 100,              // 100 requests per IP per minute
  message: { error: 'Rate limit exceeded. Slow down!' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));
app.use(metricsMiddleware);

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Public Routes (no auth) ────────────────────────────────────
// Auth endpoints are public — users hit /api/auth/* without a token
app.use('/api/auth', proxyRouter.auth);

// ── Protected Routes (requires valid JWT) ─────────────────────
// verifyToken validates the Bearer token before proxying to services
app.use('/api/users', verifyToken, proxyRouter.users);

// ── Metrics ───────────────────────────────────────────────────
app.use('/metrics', metricsRouter);

// ── 404 + Error Handlers ─────────────────────────────────────
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`🌐 API Gateway running on port ${PORT}`));

export default app;
