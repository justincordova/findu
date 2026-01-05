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
