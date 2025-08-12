import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a secure verification token using UUID v4
 * @returns A unique verification token
 */
export const generateVerificationToken = (): string => {
  return uuidv4();
};

/**
 * Hash a password using bcrypt with salt rounds of 12
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash using bcrypt
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate an expiration date for tokens (24 hours from now)
 * @returns Date - The expiration date
 */
export const generateTokenExpiration = (): Date => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
};

/**
 * Check if a token is expired
 * @param expiresAt - The expiration date to check
 * @returns boolean - True if expired, false otherwise
 */
export const isTokenExpired = (expiresAt: Date): boolean => {
  return expiresAt < new Date();
};

/**
 * Extract bearer token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns string | null - The token if valid, null otherwise
 */
export const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};
