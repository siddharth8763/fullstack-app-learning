// =============================================================
// Auth Routes
// INTERVIEW: Route files are just mappings of HTTP methods + paths
// to controller functions + validation middleware.
// Validation runs BEFORE the controller via middleware chaining.
// =============================================================

import { Router } from 'express';
import passport from 'passport';
import { body } from 'express-validator';

import { register, login, refreshToken, logout } from '../controllers/authController';
import { googleCallback } from '../controllers/oauthController';
import { validate } from '../middleware/validate';

export const authRouter = Router();

// ── Email / Password Routes ────────────────────────────────────

// POST /auth/register
authRouter.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be ≥8 chars with uppercase, lowercase, and digit'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 chars'),
  ],
  validate,
  register
);

// POST /auth/login
authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

// POST /auth/refresh — no body, reads cookie
authRouter.post('/refresh', refreshToken);

// POST /auth/logout
authRouter.post('/logout', logout);

// ── Google OAuth 2.0 Routes ────────────────────────────────────

// GET /auth/google — redirect to Google's consent screen
// INTERVIEW: passport.authenticate() with no session means we don't
// use express-session. The state is carried through the OAuth flow.
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// GET /auth/google/callback — Google redirects here with code
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  googleCallback
);
