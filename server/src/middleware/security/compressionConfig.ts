import compression from "compression";
import { RequestHandler } from "express";

/**
 * Compression Middleware Config
 *
 * - In production: enables GZIP compression for responses
 * - In development: disabled to make debugging easier
 */
let compressionMiddleware: RequestHandler;

if (process.env.NODE_ENV !== "development") {
  // Production / staging: enable compression
  compressionMiddleware = compression();
} else {
  // Development: no-op middleware (skip compression)
  compressionMiddleware = (_req, _res, next) => next();
}

export default compression;
