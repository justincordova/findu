import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '@/config/logger';

// List of sensitive fields to redact from logs
const SENSITIVE_FIELDS = ['password', 'token', 'creditCard'];

const redactSensitive = (obj: Record<string, any>) => {
  if (!obj) return {};
  const redacted: Record<string, any> = { ...obj };
  SENSITIVE_FIELDS.forEach((field) => {
    if (field in redacted) redacted[field] = '[REDACTED]';
  });
  return redacted;
};

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const metadata = {
      url: req.url,
      method: req.method,
      ip: req.ip,
      body: redactSensitive(req.body),
      query: req.query,
      headers: { ...req.headers },
      errors: errors.array(),
      requestId: req.headers['x-request-id'] || 'N/A',
    };

    logger.warn('VALIDATION_FAILED', metadata);

    return res.status(400).json({
      status: 'error',
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  next();
};
