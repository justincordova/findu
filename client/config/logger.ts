import { logger as createLoggerFn, consoleTransport, fileAsyncTransport } from "react-native-logs";
import * as FileSystem from "expo-file-system";

const consoleColors = {
  debug: "cyanBright",
  info: "blueBright",
  warn: "yellowBright",
  error: "redBright",
} as const;

// Use Paths.document.uri for a synchronous directory path
// This works with the modern expo-file-system API (SDK 54+)
const documentDir = FileSystem.Paths.document.uri;

// Simple transport: use console in dev, file in production
const transport = __DEV__
  ? consoleTransport
  : fileAsyncTransport;

const baseLogger = createLoggerFn.createLogger({
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  severity: __DEV__ ? "debug" : "error",
  transport,
  transportOptions: {
    colors: consoleColors,
    FS: FileSystem,
    fileName: `logs_${new Date().toISOString().split("T")[0]}.txt`,
    filePath: documentDir ?? undefined,
  },
  printLevel: true,
  printDate: true,
  async: true,
});

/**
 * Logger instance with methods matching server-side Winston API
 * Usage: logger.error("message", metadata?)
 * @example
 *   logger.info("[Profile] User loaded", { userId: 123 })
 *   logger.error("Failed to fetch", err)
 *   logger.debug("[API] Request sent")
 */
interface AppLogger {
  error(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  info(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

const logger: AppLogger = {
  error: (message: string, metadata?: any) => {
    baseLogger.error(message, metadata);
  },
  warn: (message: string, metadata?: any) => {
    baseLogger.warn(message, metadata);
  },
  info: (message: string, metadata?: any) => {
    baseLogger.info(message, metadata);
  },
  debug: (message: string, metadata?: any) => {
    baseLogger.debug(message, metadata);
  },
};

export default logger;