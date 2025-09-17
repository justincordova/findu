import { supabase } from "@/lib/supabaseClient";
import { sendOTPEmail } from "@/modules/auth/emailService";
import { Redis } from "./redis";
import logger from "@/config/logger";
import { Request } from "express";
import { AuthResult, PendingSignupResult } from "@/types/Auth";
import { generateOTP, extractBearerToken } from "@/utils/auth";
import prisma from "@/lib/prismaClient";

const OTP_EXPIRATION = Number(process.env.OTP_EXPIRATION_SECONDS) || 600;

export const OTPService = {
  /**
   * Creates a pending signup by generating and sending an OTP to the user's email.
   *
   * @param email - The email address of the user.
   * @param password - The password for the pending account.
   * @returns The result of the pending signup attempt.
   */
  createPendingSignup: async (
    email: string,
    password: string
  ): Promise<PendingSignupResult> => {
    try {
      // Check if user already exists in the database
      const existingUser = await prisma.users.findFirst({ where: { email } });
      if (existingUser) return { success: false, error: "User already exists" };

      // Remove any existing OTP for this email
      if (await Redis.hasOTP(email)) await Redis.removeOTP(email);

      // Generate OTP and store it with the password in Redis
      const otp = generateOTP();
      await Redis.storeOTP(email, otp, password, OTP_EXPIRATION);

      // Send OTP email
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
    } finally {
      // Clean up
      if (await Redis.hasOTP(email)) {
        await Redis.removeOTP(email);
      }
    }
  },

  /**
   * Verifies the OTP sent to the user's email and creates a user account.
   *
   * @param email - The email address of the user.
   * @param otp - The one-time password to verify.
   * @returns The result of OTP verification and user creation.
   */
  verifyOTP: async (email: string, otp: string): Promise<AuthResult> => {
    try {
      const otpResult = await Redis.verifyOTP(email, otp);
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

export const AuthService = {
  /**
   * Authenticates a user with email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns The result of the authentication attempt.
   */
  authenticate: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      // Attempt to sign in the user using Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Check if there was an error or no user returned
      if (error || !data.user) {
        return { success: false, error: "Invalid email or password" };
      }

      // Log successful login
      logger.info("USER_LOGIN_SUCCESSFUL", { email, userId: data.user.id });

      // Return user details and session info
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || "",
          email_confirmed_at: data.user.email_confirmed_at,
        },
        session: data.session ?? undefined, // Explicit undefined if session is null
      };
    } catch (error) {
      // Log unexpected errors during authentication
      logger.error("AUTHENTICATE_USER_ERROR", { error, email });
      return { success: false, error: "Authentication failed" };
    }
  },

  /*
RESET PASSWORD TO BE WORKED ON LATER
*/
  /**
   * Sends a password reset email to the specified user if they exist.
   *
   * @param email - The email address of the user requesting a password reset.
   * @returns The result of the password reset request.
   */
  requestPasswordReset: async (email: string): Promise<AuthResult> => {
    try {
      // Check if the user exists in the database using Prisma
      const existingUser = await prisma.users.findFirst({
        where: { email },
      });

      // If the user doesn't exist, return success to avoid leaking user existence
      if (!existingUser) return { success: true };

      // Trigger Supabase to send a password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${
          process.env.FRONTEND_URL || "http://localhost:8081"
        }/auth/reset-password`,
      });

      // Log and return error if sending the email failed
      if (error) {
        logger.error("PASSWORD_RESET_EMAIL_ERROR", { error, email });
        return { success: false, error: "Failed to send password reset email" };
      }

      // Log successful password reset request
      logger.info("PASSWORD_RESET_REQUESTED", { email });
      return { success: true };
    } catch (error) {
      // Log any unexpected errors during the request
      logger.error("REQUEST_PASSWORD_RESET_ERROR", { error, email });
      return { success: false, error: "Failed to request password reset" };
    }
  },

  /**
   * Resets the user's password using a valid token.
   *
   * @param token - The password reset token.
   * @param newPassword - The new password to set.
   * @returns The result of the password reset.
   */
  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<AuthResult> => {
    try {
      // Update the user's password in Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      // Handle any errors from Supabase
      if (error || !data.user) {
        logger.error("PASSWORD_RESET_ERROR", { error });
        return {
          success: false,
          error: "Failed to reset password. Please try again.",
        };
      }

      // Log successful password reset
      logger.info("PASSWORD_RESET_SUCCESSFUL", { email: data.user.email });
      return { success: true };
    } catch (error) {
      // Catch unexpected errors
      logger.error("RESET_PASSWORD_WITH_TOKEN_ERROR", { error });
      return { success: false, error: "Failed to reset password" };
    }
  },

  /**
   * Logs out the user by invalidating their session token.
   *
   * @param req - The Express request containing the authorization header.
   * @returns The result of the logout attempt.
   */
  /**
   * Logs out a user by invalidating their session token.
   *
   * @param req - The incoming HTTP request containing the Authorization header.
   * @returns The result of the logout attempt.
   */
  logout: async (req: Request): Promise<AuthResult> => {
    try {
      // Extract the Bearer token from the Authorization header
      const token = extractBearerToken(req.headers.authorization);
      logger.info("LOGOUT_ATTEMPT", { token });

      // If no token is provided, return a failure result
      if (!token) {
        logger.warn("LOGOUT_FAILED_NO_TOKEN");
        return { success: false, error: "No valid session found" };
      }

      // Call Supabase admin API to sign out the session associated with the token
      const { error } = await supabase.auth.admin.signOut(token);

      // Handle any errors returned from Supabase
      if (error) {
        logger.error("LOGOUT_FAILED_SUPABASE_ERROR", { error });
        return { success: false, error: "Failed to logout" };
      }

      // Successful logout
      logger.info("LOGOUT_SUCCESS", { token });
      return { success: true };
    } catch (error) {
      // Catch any unexpected errors
      logger.error("LOGOUT_EXCEPTION", { error });
      return { success: false, error: "Failed to logout" };
    }
  },

  /**
   * Verifies a session token and returns the associated user info.
   *
   * @param token - The session token to verify.
   * @returns The user info if valid, otherwise `null`.
   */
  verifySession: async (token: string): Promise<any | null> => {
    try {
      // Call Supabase to get user info associated with the token
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      // If there is an error or no user is returned, the session is invalid
      if (error || !user) return null;

      // Return a simplified user object
      return {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      // Log unexpected errors and return null
      logger.error("VERIFY_SESSION_ERROR", { error });
      return null;
    }
  },

  /**
   * Retrieves the currently authenticated user's data from the request.
   *
   * @param req - The Express request containing the authorization header.
   * @returns The current user info and session, or an error result.
   */
  getCurrentUser: async (req: Request): Promise<AuthResult> => {
    try {
      // Extract the Bearer token from the Authorization header
      const token = extractBearerToken(req.headers.authorization);
      if (!token) return { success: false, error: "No valid session found" };

      // Retrieve user data from Supabase using the token
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      // If there's an error or no user is returned, the session is invalid
      if (error || !user) return { success: false, error: "Invalid session" };

      // Return the authenticated user's information and the current session token
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || "",
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        session: { access_token: token },
      };
    } catch (error) {
      // Log any unexpected errors and return a failure response
      logger.error("GET_CURRENT_USER_DATA_ERROR", { error });
      return { success: false, error: "Failed to get user data" };
    }
  },

  /**
   * Refreshes a user's session using a refresh token.
   *
   * @param refreshToken - The refresh token.
   * @returns The refreshed session and user info, or an error result.
   */
  /**
   * Refreshes a user's session using a valid refresh token.
   *
   * @param refreshToken - The refresh token provided by the user's current session.
   * @returns An AuthResult containing the new session and user data if successful, or an error if not.
   */
  refreshSession: async (refreshToken: string): Promise<AuthResult> => {
    try {
      // Use Supabase to refresh the session using the provided refresh token
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      // If there is an error or the session/user data is missing, return a failure response
      if (error || !data.session || !data.user) {
        logger.error("REFRESH_SESSION_ERROR", { error });
        return { success: false, error: "Failed to refresh session" };
      }

      // Return the refreshed session along with the authenticated user's info
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
      // Log unexpected exceptions and return a failure response
      logger.error("REFRESH_SESSION_EXCEPTION", { error });
      return { success: false, error: "Failed to refresh session" };
    }
  },

  /**
   * Deletes a user by their user ID.
   *
   * @param userId - The ID of the user to delete.
   * @returns The result of the deletion attempt.
   */
  deleteUser: async (userId: string): Promise<AuthResult> => {
    try {
      // Check if the user exists in the database using Prisma
      const existingUser = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        // If user doesn't exist, return an error
        return { success: false, error: "User not found" };
      }

      // Delete the user from Prisma
      await prisma.users.delete({
        where: { id: userId },
      });

      // Remove any pending OTP associated with the user
      if (await Redis.hasOTP(userId)) {
        await Redis.removeOTP(userId);
      }

      // Log successful deletion
      logger.info("USER_DELETED_SUCCESSFULLY", { userId });

      return { success: true };
    } catch (error) {
      // Log any exceptions and return a failure response
      logger.error("DELETE_USER_EXCEPTION", { error, userId });
      return { success: false, error: "Failed to delete user" };
    }
  },
};
