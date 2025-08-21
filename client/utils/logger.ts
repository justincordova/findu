// utils/_log.ts
import { logger, consoleTransport, fileAsyncTransport } from "react-native-logs";
import * as FileSystem from "expo-file-system";

// Console colors mapping (readonly to satisfy TS)
const consoleColors = {
  debug: "cyanBright",
  info: "blueBright",
  warn: "yellowBright",
  error: "redBright",
} as const;

// Create logger based on environment
const _log = __DEV__
  ? logger.createLogger({
      levels: { debug: 0, info: 1, warn: 2, error: 3 },
      severity: "debug", // log everything in dev
      transport: consoleTransport,
      transportOptions: { colors: consoleColors },
      printLevel: true,
      printDate: true,
      async: true,
    })
  : logger.createLogger({
      levels: { debug: 0, info: 1, warn: 2, error: 3 },
      severity: "error", // only log errors in prod
      transport: fileAsyncTransport,
      transportOptions: {
        FS: FileSystem as any, // type workaround
        fileName: `logs_${new Date().toISOString().split("T")[0]}.txt`,
        filePath: FileSystem.documentDirectory ?? undefined,
      },
      printLevel: true,
      printDate: true,
      async: true,
    });

export default _log;
