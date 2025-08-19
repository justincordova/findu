import { Request, Response } from 'express';
import logger from '@/config/logger';

// Fields to redact from request body if present
const REDACT_FIELDS = ['password', 'token', 'authorization'];

const redactBody = (body: Record<string, any>) => {
  if (!body) return {};
  const copy = { ...body };
  REDACT_FIELDS.forEach((field) => {
    if (copy[field]) copy[field] = '[REDACTED]';
  });
  return copy;
};

export const notFoundHandler = (req: Request, res: Response) => {
  const metadata = {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    body: redactBody(req.body),
    requestId: req.headers['x-request-id'] || 'N/A',
  };

  logger.warn('ROUTE_NOT_FOUND', metadata);

  res.status(404).json({
    status: 'error',
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
  });
};
