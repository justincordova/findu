import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '@/config/logger';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("VALIDATION_FAILED", {
      url: req.url,
      method: req.method,
      errors: errors.array(),
      ip: req.ip,
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};
