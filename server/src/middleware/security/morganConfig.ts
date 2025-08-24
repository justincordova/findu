import morganLib from "morgan";
import { RequestHandler } from "express";
import logger from "@/config/logger";

/**
 * Morgan Logging Config
 * Uses a consistent logging stream for both development and production.
 */
const morgan: RequestHandler = morganLib("dev", {
  stream: {
    write: (msg: string) => {
      const trimmed = msg.trim();
      // Send all requests to your logger at debug/info level
      logger.info(trimmed);
    },
  },
});

export default morgan;
