import { Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
  });
};
