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
    public originalError?: any
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
  context: string = "API call"
): Promise<T> {
  let data: any;

  try {
    data = await res.json();
  } catch (parseError) {
    throw new APIError(
      res.status,
      `Failed to parse response from ${context}`,
      parseError
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
    return error.message.includes("network") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch failed")
      ? true
      : false;
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
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't delay after final attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const delayMs = initialDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
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
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
