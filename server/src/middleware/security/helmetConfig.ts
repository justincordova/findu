import type { RequestHandler } from "express";
import helmetLib from "helmet";

/**
 * Helmet Middleware Config
 *
 * - Applies relaxed security headers that are safe for dev, tests, and production.
 * - Disables CSP and cross-origin embedder policy to avoid blocking local API calls.
 */
const helmet: RequestHandler = helmetLib({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export default helmet;
