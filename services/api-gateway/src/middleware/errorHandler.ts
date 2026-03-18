import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error { statusCode?: number; isOperational?: boolean; }

export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development') console.error('❌ Gateway Error:', err);
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational || process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  res.status(statusCode).json({ error: message });
};
