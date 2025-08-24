import morganLib from "morgan";
import { RequestHandler } from "express";
import logger from "@/config/logger";

/**
 * Morgan Logging Config
 *
 * - In production: use "combined" format (detailed logs) at info level
 * - In development: use "dev" format (color-coded) at debug level
 */

const morgan: RequestHandler = morganLib(
  process.env.NODE_ENV !== "development" ? "combined" : "dev",
  {
    stream: {
      write: (msg: string) => {
        // Remove trailing newline from Morgan
        const trimmed = msg.trim();

        if (process.env.NODE_ENV !== "development") {
          logger.info(trimmed);   // Production: info level
        } else {
          logger.debug(trimmed);  // Development: debug level
        }
      },
    },
  }
);

export default morgan;
