// =============================================================
// JWT Verification Middleware — API Gateway Layer
// INTERVIEW: The gateway verifies the token so individual
// microservices don't each need the JWT secret.
// The user payload is forwarded to downstream via custom headers.
// Microservices TRUST these headers (they are on the internal network).
// This is the "trusted subsystem" model — only the gateway is public.
// =============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;

    // Forward verified user info to downstream services via headers
    // INTERVIEW: Don't put sensitive data in headers — they can be logged.
    // Here we send userId and role for the downstream service's RBAC.
    req.headers['x-user-id'] = payload.userId;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role'] = payload.role;

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
};
