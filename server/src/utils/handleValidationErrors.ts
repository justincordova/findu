import { Request } from 'express';
import { validationResult } from 'express-validator';
import logger from '@/config/logger';

const SENSITIVE_FIELDS = ['password', 'token', 'creditCard'];

const redactSensitive = (obj: Record<string, any>) => {
  if (!obj) return {};
  const redacted: Record<string, any> = { ...obj };
  SENSITIVE_FIELDS.forEach((field) => {
    if (field in redacted) redacted[field] = '[REDACTED]';
  });
  return redacted;
};

/**
 * Helper function for controllers to check validation errors
 * Returns true if valid, false otherwise
 */
export const checkValidationErrors = (req: Request): { valid: boolean; errors?: any[] } => {
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
    return { valid: false, errors: errors.array() };
  }
  return { valid: true };
};
