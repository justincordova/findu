import RedisClient from "ioredis";
import logger from "@/config/logger";

let isConnected = false;

export const redis = new RedisClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
});

redis.on("connect", () => {
  isConnected = true;
  logger.info("REDIS_CONNECTED");
});

redis.on("error", (error) => {
  isConnected = false;
  logger.error("REDIS_ERROR", { error: error.message });
});

redis.on("close", () => {
  isConnected = false;
  logger.warn("REDIS_DISCONNECTED");
});

process.on("SIGINT", async () => {
  await redis.quit();
  logger.info("REDIS_CONNECTION_CLOSED");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await redis.quit();
  logger.info("REDIS_CONNECTION_CLOSED");
  process.exit(0);
});


export function isRedisReady() {
  return isConnected;
}
