import cors from 'cors';
import logger from '@/config/logger';

/**
 * List of explicitly allowed origins.
 * - Add any frontend URLs your app needs to allow.
 * - Use environment variables for production URLs.
 */
const allowedOrigins = [
  process.env.FRONTEND_URL,          // Preferred production frontend URL
  'http://localhost:8081',           // Expo web (local)
  'http://127.0.0.1:8081',           // LAN access for Expo
  'http://localhost:3000',           // Fallback frontend (React dev server)
].filter(Boolean) as string[];

/**
 * Helper to detect LAN Expo URLs on port 8081.
 * Matches URLs like http://192.168.x.x:8081
 */
const isLanExpoOrigin = (origin: string) =>
  /^http:\/\/(\d{1,3}\.){3}\d{1,3}:8081$/.test(origin);

/**
 * CORS options configuration
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow explicitly whitelisted origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow LAN Expo clients
    if (isLanExpoOrigin(origin)) return callback(null, true);

    // Block any other origins and optionally log for debugging
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Blocked CORS request', { origin });
    }

    // Return error to client
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },

  /**
   * Allow cookies to be sent in cross-origin requests.
   * Required if your frontend uses credentials (like session cookies).
   */
  credentials: true,
};

export default corsOptions;
