import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";

export class AuthService {
  private static instance: AuthService;
  private session: Session | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getSession(): Session | null {
    return this.session;
  }

  setSession(session: Session | null): void {
    this.session = session;
  }

  async refreshSession(refreshToken: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      this.session = data.session;
      return data.session;
    } catch (error) {
      console.error("Failed to refresh session:", error);
      this.session = null;
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.session = null;
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }
}

export const authService = AuthService.getInstance();
