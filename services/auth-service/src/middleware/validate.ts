// =============================================================
// Validation Middleware — runs express-validator results
// INTERVIEW: Middleware is a function with signature (req, res, next).
// If validation fails, we respond with 422 Unprocessable Entity
// (more semantically correct than 400 for validation errors).
// We call next() only if validation passes.
// =============================================================

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.type, message: e.msg })),
    });
    return;
  }
  next();
};
