// =============================================================
// Global Error Handler
// INTERVIEW: Express error-handling middleware has exactly 4
// parameters: (err, req, res, next). Express identifies it
// as an error handler by the 4th parameter, even if unused.
// Always place error handlers LAST in the middleware chain.
// =============================================================

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log full error in development, minimal in production
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else {
    console.error('❌ Error:', err.message);
  }

  // INTERVIEW: Distinguish operational errors (user errors, expected)
  // from programmer errors (bugs, unexpected). Only operational errors
  // should leak details to the client.
  const statusCode = err.statusCode ?? 500;
  const message =
    err.isOperational || process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
