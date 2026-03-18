// =============================================================
// JWT Utilities
// INTERVIEW: JWTs have 3 parts: header.payload.signature (Base64url).
// Access tokens are short-lived (15min) and kept IN MEMORY on the client.
// Refresh tokens are long-lived (7d) and stored in HttpOnly cookies
// (not accessible to JavaScript → protects against XSS attacks).
//
// Token Rotation: each time you use a refresh token, you get a
// new one back and the old one is revoked. This limits the window
// of compromise if a token is stolen.
// =============================================================

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// ── Access Token ──────────────────────────────────────────────
export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET!;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
    algorithm: 'HS256',  // HMAC SHA-256 — symmetric (same key to sign & verify)
    // INTERVIEW: RS256 uses asymmetric keys (private to sign, public to verify).
    // RS256 is preferred in distributed systems where multiple services verify tokens
    // without needing the signing secret.
  };
  return jwt.sign(payload, secret, options);
};

// ── Refresh Token ─────────────────────────────────────────────
export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET!;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(payload, secret, options);
};

// ── Verify Access Token ────────────────────────────────────────
export const verifyAccessToken = (token: string): TokenPayload & JwtPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload & JwtPayload;
};

// ── Verify Refresh Token ───────────────────────────────────────
export const verifyRefreshToken = (token: string): TokenPayload & JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload & JwtPayload;
};
