// =============================================================
// Auth Service Entry Point
// INTERVIEW: Express middleware is applied in order.
// Security middlewares (helmet, cors, rate-limit) are added
// BEFORE route handlers so every request is checked first.
// =============================================================

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { authRouter } from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware, metricsRouter } from './metrics';
import { configurePassport } from './config/passport';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ────────────────────────────────────────
// INTERVIEW: helmet() sets ~15 HTTP security headers.
// e.g., X-Content-Type-Options, X-Frame-Options, CSP, etc.
app.use(helmet());

// INTERVIEW: CORS (Cross-Origin Resource Sharing) must be 
// configured to allow requests from your frontend origin.
// In production, be explicit — never use origin: '*'
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,  // needed for cookies (refresh tokens)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──────────────────────────────────────────────
// INTERVIEW: Rate limiting prevents brute-force attacks.
// The auth endpoints are especially sensitive.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // max 20 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));         // parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // parse URL-encoded
app.use(cookieParser());                          // parse cookies (for refresh token)

// ── Logging ───────────────────────────────────────────────────
// INTERVIEW: Morgan is HTTP request logger. 'combined' format
// logs IP, method, path, status, response time — useful for debugging.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Prometheus Metrics Middleware ─────────────────────────────
app.use(metricsMiddleware);

// ── Passport (Google OAuth 2.0) ───────────────────────────────
// INTERVIEW: Passport.js is authentication middleware for Node.js.
// Strategies abstract different auth methods (local, google, github, etc.)
configurePassport(passport);
app.use(passport.initialize());

// ── Health Check ──────────────────────────────────────────────
// INTERVIEW: A /health endpoint is critical in microservices.
// Docker, Kubernetes, and load balancers use it to determine
// if a service is alive (liveness) and ready (readiness).
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/auth', authLimiter, authRouter);
app.use('/metrics', metricsRouter);

// ── 404 Handler ───────────────────────────────────────────────
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
// INTERVIEW: The error handler MUST have 4 parameters (err, req, res, next).
// Express identifies it as an error-handling middleware by the 4th arg.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
});

export default app;
