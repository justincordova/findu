/**
 * Shared API utilities for consistent error handling and response processing
 */

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public originalError?: any,
  ) {
    super(message);
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Unified response handler for all API calls
 * Handles parsing, error detection, and type validation
 *
 * @template T - Expected response type
 * @param res - Fetch Response object
 * @param context - Optional context for error messages
 * @returns Parsed and validated response
 * @throws APIError on failure
 */
export async function handleResponse<T>(
  res: Response,
  context: string = "API call",
): Promise<T> {
  let data: any;

  try {
    data = await res.json();
  } catch (parseError) {
    throw new APIError(
      res.status,
      `Failed to parse response from ${context}`,
      parseError,
    );
  }

  if (!res.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      data?.errors?.join(", ") ||
      `${context} failed with status ${res.status}`;

    throw new APIError(res.status, errorMessage, data);
  }

  return data as T;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

/**
 * Extract HTTP status code from error
 */
export function getErrorStatus(error: unknown): number {
  if (error instanceof APIError) {
    return error.statusCode;
  }

  return 500;
}

/**
 * Check if error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("network") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch failed")
    );
  }

  return false;
}

/**
 * Check if error is a 4xx client error (user's fault)
 */
export function isClientError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status >= 400 && status < 500;
}

/**
 * Check if error is a 5xx server error
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status >= 500 && status < 600;
}

/**
 * Check if error is retryable (network errors, 5xx, 429)
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true;
  }

  const status = getErrorStatus(error);
  return status === 429 || status >= 500;
}

/**
 * Retry a request with exponential backoff
 * Automatically retries on network errors, 5xx, and 429 (rate limit)
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelayMs - Initial delay between retries in ms (default: 1000)
 * @returns Result of successful function call
 * @throws Error from last retry attempt if all fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't delay after final attempt - throw immediately
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter before next attempt
      const delayMs = initialDelayMs * 2 ** attempt + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Should never reach here, but TypeScript requires a return
  throw new Error("Retry loop failed unexpectedly");
}

/**
 * Add timeout to any promise
 * Rejects if promise doesn't resolve within specified time
 *
 * @param promise - Promise to wrap with timeout
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves/rejects with original result or timeout error
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

/**
 * Type guard to validate auth response structure
 */
export function isAuthResponse(
  data: unknown,
): data is { token: string; user: { id: string; email: string } } {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as any).token === "string" &&
    typeof (data as any).user === "object" &&
    typeof (data as any).user?.id === "string" &&
    typeof (data as any).user?.email === "string"
  );
}

/**
 * Type guard to validate profile response structure
 */
export function isProfileResponse(data: unknown): data is {
  user_id: string;
  name: string;
  photos?: any[];
  bio?: string;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as any).user_id === "string" &&
    typeof (data as any).name === "string"
  );
}

/**
 * Type guard to validate match response structure
 */
export function isMatchResponse(data: unknown): data is {
  id: string;
  user1: string;
  user2: string;
  created_at?: string;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as any).id === "string" &&
    typeof (data as any).user1 === "string" &&
    typeof (data as any).user2 === "string"
  );
}

/**
 * Type guard to validate discover feed response
 */
export function isDiscoverFeedResponse(data: unknown): data is {
  profiles: any[];
  total: number;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as any).profiles) &&
    typeof (data as any).total === "number"
  );
}

/**
 * Type guard to validate array response with items
 */
export function isArrayResponse<T>(data: unknown): data is T[] {
  return Array.isArray(data);
}

/**
 * Validate response data against type guard
 * Throws APIError if validation fails
 *
 * @param data - Data to validate
 * @param validator - Type guard function to validate data
 * @param context - Context for error message
 * @returns Validated data
 * @throws APIError if validation fails
 */
export function validateResponse<T>(
  data: unknown,
  validator: (val: unknown) => val is T,
  context: string = "response",
): T {
  if (!validator(data)) {
    throw new APIError(400, `Invalid ${context} structure`);
  }
  return data;
}

/**
 * Refresh token callback - can be set by auth service
 * Called when a 401 response is detected and token needs refreshing
 */
let tokenRefreshCallback: (() => Promise<boolean>) | null = null;

/**
 * Set the token refresh callback (called by auth service during initialization)
 * @param callback - Async function that refreshes the token and returns success status
 */
export function setTokenRefreshCallback(
  callback: () => Promise<boolean>,
): void {
  tokenRefreshCallback = callback;
}

/**
 * Wrapper for API calls that handles 401 responses with automatic token refresh
 * If a 401 is received and a refresh callback is set, attempts to refresh the token
 * and retry the request once. Falls back to throwing the error if refresh fails.
 *
 * @param apiFn - Async function that makes the API call
 * @returns Result of successful API call
 * @throws APIError if call fails or refresh fails
 */
export async function withTokenRefresh<T>(apiFn: () => Promise<T>): Promise<T> {
  try {
    return await apiFn();
  } catch (error) {
    // If 401 and we have a refresh callback, try to refresh and retry
    if (
      error instanceof APIError &&
      error.statusCode === 401 &&
      tokenRefreshCallback
    ) {
      try {
        const refreshed = await tokenRefreshCallback();
        if (refreshed) {
          // Token was refreshed, retry the original call
          return await apiFn();
        }
      } catch (_refreshError) {
        // Refresh failed, throw original error
        throw error;
      }
    }
    throw error;
  }
}
