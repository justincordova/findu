import { supabase } from "@/lib/supabaseClient";
import { sendOTPEmail } from "@/modules/auth/emailService";
import { Redis } from "./redis";
import logger from "@/config/logger";
import { Request } from "express";
import { AuthResult, PendingSignupResult } from "@/types/Auth";
import { generateOTP, extractBearerToken } from "@/utils/auth";

const OTP_EXPIRATION = Number(process.env.OTP_EXPIRATION_SECONDS) || 600;

export const OTPService = {
  createPendingSignup: async (
    email: string,
    password: string
  ): Promise<PendingSignupResult> => {
    try {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser.users?.some(
        (user) => user.email === email
      );
      if (userExists) return { success: false, error: "User already exists" };

      if (await Redis.hasOTP(email)) await Redis.removeOTP(email);

      const otp = generateOTP();
      await Redis.storeOTP(email, otp, password, OTP_EXPIRATION);

      const emailResult = await sendOTPEmail({ email, otp });
      if (!emailResult.success) {
        await Redis.removeOTP(email);
        return { success: false, error: "Failed to send OTP email" };
      }

      logger.info("PENDING_SIGNUP_CREATED_WITH_OTP", { email });
      return { success: true };
    } catch (error) {
      logger.error("CREATE_PENDING_SIGNUP_ERROR", { error, email });
      return { success: false, error: "Failed to create pending signup" };
    }
  },

  verifyOTP: async (email: string, otp: string): Promise<AuthResult> => {
    try {
      const otpResult = await Redis.verifyOTP(email, otp);  // 👈 changed
      if (!otpResult.valid)
        return { success: false, error: otpResult.error || "Invalid OTP" };

      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password: otpResult.password!,
          email_confirm: true,
        });

      if (authError || !authData.user) {
        logger.error("SUPABASE_USER_CREATION_ERROR", {
          error: authError,
          email,
        });
        return { success: false, error: "Failed to create user account" };
      }

      logger.info("USER_CREATED_SUCCESSFULLY_WITH_OTP", {
        email,
        userId: authData.user.id,
      });
      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email || "",
          email_confirmed_at: authData.user.email_confirmed_at,
        },
      };
    } catch (error) {
      logger.error("VERIFY_OTP_ERROR", { error, email });
      return { success: false, error: "Failed to verify OTP" };
    }
  },
};

// ... AuthService stays same, just replace redis.hasOTP/removeOTP with OTPStore


export const AuthService = {
  authenticate: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user)
        return { success: false, error: "Invalid email or password" };

      logger.info("USER_LOGIN_SUCCESSFUL", { email, userId: data.user.id });
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || "",
          email_confirmed_at: data.user.email_confirmed_at,
        },
        session: data.session,
      };
    } catch (error) {
      logger.error("AUTHENTICATE_USER_ERROR", { error, email });
      return { success: false, error: "Authentication failed" };
    }
  },

  requestPasswordReset: async (email: string): Promise<AuthResult> => {
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const userExists = users.users?.some((user) => user.email === email);
      if (!userExists) return { success: true };

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${
          process.env.FRONTEND_URL || "http://localhost:8081"
        }/auth/reset-password`,
      });

      if (error) {
        logger.error("PASSWORD_RESET_EMAIL_ERROR", { error, email });
        return { success: false, error: "Failed to send password reset email" };
      }

      logger.info("PASSWORD_RESET_REQUESTED", { email });
      return { success: true };
    } catch (error) {
      logger.error("REQUEST_PASSWORD_RESET_ERROR", { error, email });
      return { success: false, error: "Failed to request password reset" };
    }
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error || !data.user) {
        logger.error("PASSWORD_RESET_ERROR", { error });
        return {
          success: false,
          error: "Failed to reset password. Please try again.",
        };
      }

      logger.info("PASSWORD_RESET_SUCCESSFUL", { email: data.user.email });
      return { success: true };
    } catch (error) {
      logger.error("RESET_PASSWORD_WITH_TOKEN_ERROR", { error });
      return { success: false, error: "Failed to reset password" };
    }
  },

  logout: async (req: Request): Promise<AuthResult> => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      logger.info("LOGOUT_ATTEMPT", { token });

      if (!token) {
        logger.warn("LOGOUT_FAILED_NO_TOKEN");
        return { success: false, error: "No valid session found" };
      }

      const { error } = await supabase.auth.admin.signOut(token);

      if (error) {
        logger.error("LOGOUT_FAILED_SUPABASE_ERROR", { error });
        return { success: false, error: "Failed to logout" };
      }

      logger.info("LOGOUT_SUCCESS", { token });
      return { success: true };
    } catch (error) {
      logger.error("LOGOUT_EXCEPTION", { error });
      return { success: false, error: "Failed to logout" };
    }
  },

  verifySession: async (token: string): Promise<any> => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      logger.error("VERIFY_SESSION_ERROR", { error });
      return null;
    }
  },

  getCurrentUser: async (req: Request): Promise<AuthResult> => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) return { success: false, error: "No valid session found" };

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) return { success: false, error: "Invalid session" };

      // Return user and session info
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || "",
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        session: {
          access_token: token,
        },
      };
    } catch (error) {
      logger.error("GET_CURRENT_USER_DATA_ERROR", { error });
      return { success: false, error: "Failed to get user data" };
    }
  },

  refreshSession: async (refreshToken: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (error || !data.session || !data.user) {
        logger.error("REFRESH_SESSION_ERROR", { error });
        return { success: false, error: "Failed to refresh session" };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || "",
          email_confirmed_at: data.user.email_confirmed_at,
        },
        session: data.session,
      };
    } catch (error) {
      logger.error("REFRESH_SESSION_EXCEPTION", { error });
      return { success: false, error: "Failed to refresh session" };
    }
  },

  deleteUser: async (userId: string): Promise<AuthResult> => {
    try {
      const { data: usersData, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) {
        logger.error("DELETE_USER_LIST_ERROR", { error: listError, userId });
        return { success: false, error: "Failed to retrieve users" };
      }

      const userExists = usersData.users?.some((user) => user.id === userId);
      if (!userExists) return { success: false, error: "User not found" };

      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        userId
      );
      if (deleteError) {
        logger.error("DELETE_USER_ERROR", { error: deleteError, userId });
        return { success: false, error: "Failed to delete user" };
      }

      logger.info("USER_DELETED_SUCCESSFULLY", { userId });

      if (await Redis.hasOTP(userId)) await Redis.removeOTP(userId);

      return { success: true };
    } catch (error) {
      logger.error("DELETE_USER_EXCEPTION", { error, userId });
      return { success: false, error: "Failed to delete user" };
    }
  },
};
