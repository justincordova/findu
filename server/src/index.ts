import dotenv from "dotenv";
dotenv.config();

import app from "@/app";
import { PORT } from "@/config/env";
import { Server } from "http";
import logger, { logError, logStartup, logShutdown } from "@/config/logger";

// Ensure PORT is a number
const port = Number(PORT);

// Start the Express server
// logStartup records server start with metadata
const server: Server = app.listen(port, () => {
  logStartup(port, process.env.NODE_ENV || "development", process.pid);
});

// Graceful shutdown configuration
// Maximum time to wait for ongoing requests before forcing exit
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

const gracefulShutdown = (signal: string) => {
  logShutdown(signal);

  // Force exit if shutdown takes too long
  const shutdownTimer = setTimeout(() => {
    logger.error("Graceful shutdown timeout, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Close the server and exit gracefully
  server.close(() => {
    clearTimeout(shutdownTimer);
    logger.info("Server closed gracefully");
    process.exit(0);
  });
};

// Handle unhandled promise rejections
// Logs the error and triggers graceful shutdown
process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    logError("Unhandled Promise Rejection", reason, {
      promise: promise.toString(),
    });
    gracefulShutdown("unhandledRejection");
  }
);

// Handle uncaught exceptions
// Logs the error and triggers graceful shutdown
process.on("uncaughtException", (error: Error) => {
  logError("Uncaught Exception", error);
  gracefulShutdown("uncaughtException");
});

// Handle termination signals from the OS (e.g., Docker, Kubernetes, Ctrl+C)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle server-specific errors
// Example: EADDRINUSE if port is already in use
server.on("error", (error: Error) => {
  logError("Server error", error);

  if (error.message.includes("EADDRINUSE")) {
    logger.error(`Port ${port} is already in use`);
    process.exit(1);
  }
});

// Log process warnings
process.on("warning", (warning: Error) => {
  logger.warn("Process warning", {
    warning: warning.message,
    stack: warning.stack,
  });
});

// Log that error handlers and graceful shutdown are configured
logger.info("Error handlers and graceful shutdown configured");

export default server;
