import { logger as createLoggerFn, consoleTransport, fileAsyncTransport, transportFunctionType } from "react-native-logs";
import * as FileSystem from "expo-file-system";

// CATEGORIES
// These are the "Tags" you might use in your app.
const CATEGORIES = [
  // Core Features
  "Auth",
  "Profile",
  "Discover",
  "Likes",
  "Matches",
  "Blocks",
  "Messages",
  "Storage",

  // Technical
  "API",
  "Photos",
  "Cache",
  "Navigation",
  "State",
  "Validation",
  "Error",
  "Performance"
] as const;

// IGNORE
// Add categories here to silence all logs tagged with them
const IGNORED_CATEGORIES = [] as const;

const consoleColors = {
  debug: "cyanBright",
  info: "blueBright",
  warn: "yellowBright",
  error: "redBright",
} as const;

/**
 * CUSTOM TRANSPORT
 * Checks if the 2nd argument (or any argument) is a banned category.
 */
const filteredTransport: transportFunctionType<any> = (props: any) => {
  // props.rawMsg is an array of everything you passed to the log function.
  // e.g. logger.debug("Hi", "Photos") -> rawMsg is ["Hi", "Photos"]

  // Check if ANY argument in this log matches an ignored category
  const rawMsgArray = Array.isArray(props.rawMsg) ? props.rawMsg : [];
  const isIgnored = rawMsgArray.some((arg: any) =>
    typeof arg === 'string' && IGNORED_CATEGORIES.includes(arg as typeof IGNORED_CATEGORIES[number])
  );

  if (isIgnored) {
    // Ignore this log by performing no side effects in the transport
    return;
  }

  // OPTIONAL: Formatting
  // If you want to make it look nice (e.g. "[Photos] Message") automatically:
  // We can look for a valid category in args and prepend it.
  const category = rawMsgArray.find((arg: any) =>
    typeof arg === 'string' && CATEGORIES.includes(arg as typeof CATEGORIES[number])
  ) as string | undefined;

  if (category) {
    // Modify the message to show the tag clearly
    props.msg = `[${category}] ${props.msg}`;
  }

  if (__DEV__) {
    consoleTransport(props);
  } else {
    fileAsyncTransport(props);
  }
};

// Use Paths.document.uri for a synchronous directory path
// This works with the modern expo-file-system API (SDK 54+)
const documentDir = FileSystem.Paths.document.uri;

const baseLogger = createLoggerFn.createLogger({
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  severity: __DEV__ ? "debug" : "error",
  transport: filteredTransport,
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
 * Logger instance with methods matching server-side API
 * Usage:
 *   logger.error("message", "Category")
 *   logger.info("message", "Category", metadata)
 *   logger.debug("message", { data }) // old API still supported
 */
interface AppLogger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

const logger: AppLogger = {
  error: (message: string, ...args: any[]) => {
    baseLogger.error(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    baseLogger.warn(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    baseLogger.info(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    baseLogger.debug(message, ...args);
  },
};

export default logger;