import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const response = {
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong on our end'
        : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };
  const statusCode = (err as any).status || 500;
  res.status(statusCode).json(response);
};
