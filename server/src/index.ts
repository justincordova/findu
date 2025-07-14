import app from './app';
import { PORT } from './config/env';
import { Server } from 'http';
import logger, { logError, logStartup, logShutdown } from './config/logger';

// Ensure PORT is a number
const port = Number(PORT);

// Start server
const server: Server = app.listen(port, () => {
  logStartup(port, process.env.NODE_ENV || 'development', process.pid);
});

// Graceful shutdown configuration
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

const gracefulShutdown = (signal: string) => {
  logShutdown(signal);
  
  const shutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  
  server.close(() => {
    clearTimeout(shutdownTimer);
    logger.info('Server closed gracefully');
    process.exit(0);
  });
};

// Error handlers
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logError('Unhandled Promise Rejection', reason, { promise: promise.toString() });
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error: Error) => {
  logError('Uncaught Exception', error);
  gracefulShutdown('uncaughtException');
});

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server error handler
server.on('error', (error: Error) => {
  logError('Server error', error);
  
  if (error.message.includes('EADDRINUSE')) {
    logger.error(`Port ${port} is already in use`);
    process.exit(1);
  }
});

// Process warnings
process.on('warning', (warning: Error) => {
  logger.warn('Process warning', { warning: warning.message, stack: warning.stack });
});

logger.info('Error handlers and graceful shutdown configured');

export default server;