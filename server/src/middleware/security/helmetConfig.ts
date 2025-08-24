import helmetLib from "helmet";
import { RequestHandler } from "express";

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
