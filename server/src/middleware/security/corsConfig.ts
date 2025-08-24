import corsLib from "cors";
import logger from "@/config/logger";
import { RequestHandler } from "express";

const getAllowedOrigins = (): string[] => {
  const prodFrontend = process.env.FRONTEND_URL;
  return [prodFrontend].filter(Boolean) as string[];
};

const isLanExpoOrigin = (origin: string) =>
  /^http:\/\/(\d{1,3}\.){3}\d{1,3}:8081$/.test(origin);

const cors: RequestHandler = corsLib({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin) || isLanExpoOrigin(origin)) {
      return callback(null, true);
    }

    logger.warn("Blocked CORS request", { origin });
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
});

export default cors;
