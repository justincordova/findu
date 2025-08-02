import { Request, Response } from 'express';
import logger from '@/config/logger';

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn("ROUTE_NOT_FOUND", {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
  });
};
