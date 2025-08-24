import helmetLib, { HelmetOptions } from "helmet";
import { RequestHandler } from "express";

/**
 * Helmet Middleware Config
 *
 * - In production: applies default helmet security headers
 * - In development: disables strict CSP and other headers that can interfere
 *   with local testing or hot-reload setups
 */
let helmet: RequestHandler;

if (process.env.NODE_ENV !== "development") {
  // Production / staging: secure defaults
  helmet = helmetLib();
} else {
  // Development: more relaxed settings
  const devHelmetOptions: HelmetOptions = {
    contentSecurityPolicy: false, // Disable CSP to avoid issues with React dev server / Swagger UI
    crossOriginEmbedderPolicy: false, // Often breaks local APIs with fetch
  };

  helmet = helmetLib(devHelmetOptions);
}

export default helmet;
