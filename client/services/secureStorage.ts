import * as SecureStore from "expo-secure-store";
import { Session } from "@supabase/supabase-js";
import { shouldRefreshToken } from "../config/auth";

const TOKEN_KEY = "supabase_session_token";
const TOKEN_EXPIRY_KEY = "supabase_token_expiry";
const USER_KEY = "supabase_user";

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: any;
}

export class SecureStorageService {
  /**
   * Store session data securely
   */
  static async storeSession(session: Session): Promise<void> {
    try {
      const sessionData: StoredSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || 0,
        user: session.user,
      };

      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(sessionData));
      await SecureStore.setItemAsync(
        TOKEN_EXPIRY_KEY,
        sessionData.expires_at.toString()
      );
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
    } catch (error) {
      console.error("Error storing session:", error);
      throw error;
    }
  }

  /**
   * Retrieve stored session data
   */
  static async getSession(): Promise<StoredSession | null> {
    try {
      const sessionData = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData) as StoredSession;

      // Check if token has expired
      if (this.isTokenExpired(parsed.expires_at)) {
        await this.clearSession();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error retrieving session:", error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  static async getUser(): Promise<any | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error retrieving user:", error);
      return null;
    }
  }

  /**
   * Check if current token is expired
   */
  static isTokenExpired(expiresAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return expiresAt <= now;
  }

  /**
   * Check if token needs refresh
   */
  static needsRefresh(expiresAt: number): boolean {
    return shouldRefreshToken(expiresAt);
  }

  /**
   * Get time until token expires in seconds
   */
  static getTimeUntilExpiry(expiresAt: number): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, expiresAt - now);
  }

  /**
   * Clear all stored session data
   */
  static async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error("Error clearing session:", error);
      throw error;
    }
  }

  /**
   * Update access token (useful for token refresh)
   */
  static async updateAccessToken(
    accessToken: string,
    expiresAt: number
  ): Promise<void> {
    try {
      const sessionData = await this.getSession();
      if (sessionData) {
        sessionData.access_token = accessToken;
        sessionData.expires_at = expiresAt;
        await this.storeSession({
          access_token: accessToken,
          refresh_token: sessionData.refresh_token,
          expires_at: expiresAt,
          user: sessionData.user,
        } as Session);
      }
    } catch (error) {
      console.error("Error updating access token:", error);
      throw error;
    }
  }

  /**
   * Check if user has a valid session
   */
  static async hasValidSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null && !this.isTokenExpired(session.expires_at);
  }
}
