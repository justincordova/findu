import compression from "compression";
import type { RequestHandler } from "express";

/**
 * Compression Middleware
 *
 * - Enables GZIP compression for all responses.
 * - Safe to use in dev, test, and production.
 */
const compressionMiddleware: RequestHandler = compression();

export default compressionMiddleware;
