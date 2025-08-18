import { User, Session } from "@supabase/supabase-js";
import { SecureStorageService } from "./secureStorage";
import {
  logout as logoutApi,
  refreshToken as refreshTokenApi,
} from "../api/auth";

export class AuthService {
  private static instance: AuthService;
  private currentSession: Session | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Set the current session and store it securely
   */
  async setSession(session: Session | null): Promise<void> {
    this.currentSession = session;

    if (session) {
      await SecureStorageService.storeSession(session);
    } else {
      await SecureStorageService.clearSession();
    }
  }

  /**
   * Get the current session from secure storage
   */
  async getSession(): Promise<Session | null> {
    if (this.currentSession) {
      // Check if current session is still valid
      if (
        !SecureStorageService.isTokenExpired(
          this.currentSession.expires_at || 0
        )
      ) {
        return this.currentSession;
      }
    }

    // Try to get session from secure storage
    const storedSession = await SecureStorageService.getSession();
    if (storedSession) {
      this.currentSession = {
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
        expires_at: storedSession.expires_at,
        user: storedSession.user,
      } as Session;
      return this.currentSession;
    }

    return null;
  }

  /**
   * Get the current user from secure storage
   */
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await SecureStorageService.hasValidSession();
  }

  /**
   * Get the access token for API requests
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  }

  /**
   * Refresh the current session by calling backend
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const result = await refreshTokenApi();

      if (result.success && result.session) {
        this.currentSession = result.session;
        await SecureStorageService.storeSession(result.session);
        return result.session;
      }

      return null;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      this.currentSession = null;
      await SecureStorageService.clearSession();
    }
  }

  /**
   * Initialize auth state from secure storage
   */
  async initializeAuth(): Promise<{
    user: User | null;
    session: Session | null;
  }> {
    try {
      // Get session from secure storage
      const storedSession = await this.getSession();
      const user = storedSession?.user || null;

      return { user, session: storedSession };
    } catch (error) {
      console.error("Error initializing auth:", error);
      return { user: null, session: null };
    }
  }
}

export const authService = AuthService.getInstance();
