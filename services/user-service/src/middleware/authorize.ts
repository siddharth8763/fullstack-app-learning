// =============================================================
// RBAC Authorization Middleware
// INTERVIEW: Authentication = WHO are you? (identity)
//            Authorization  = WHAT can you do? (permissions)
//
// RBAC = Role-Based Access Control. Each user has a role (USER/ADMIN)
// stored in the JWT payload. Middleware checks the role before
// proceeding to the controller. This is coarse-grained access control.
// For fine-grained control, use ABAC (Attribute-Based Access Control)
// or policy-based systems like OPA (Open Policy Agent).
// =============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// ── Verify JWT ─────────────────────────────────────────────────
// Extracts Bearer token from Authorization header and validates it
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
};

// ── Authorize by Role ──────────────────────────────────────────
// Factory function that returns a middleware checking for specific roles.
// Usage: router.delete('/:id', authenticate, authorize('ADMIN'), controller)
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // INTERVIEW: 403 Forbidden = authenticated but NOT authorized.
      // 401 Unauthorized = not authenticated at all.
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
