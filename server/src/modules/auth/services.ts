import { supabase } from "@/providers/supabase";
import { sendOTPEmail } from "@/modules/auth/emailService";
import { otpStore } from "@/providers/redis";
import logger from "@/config/logger";
import { Request } from "express";
import { AuthResult, PendingSignupResult } from "@/types/Auth";
import { generateOTP, extractBearerToken } from "@/utils/auth";

// Create pending signup with OTP
export const createPendingSignup = async (
  email: string,
  password: string
): Promise<PendingSignupResult> => {
  try {
    // Check if user already exists in Supabase
    const { data: existingUser, error: userError } =
      await supabase.auth.admin.listUsers();
    const userExists = existingUser.users?.some((user) => user.email === email);
    if (userExists) {
      return {
        success: false,
        error: "User already exists",
      };
    }

    // Check if there's already a pending OTP
    if (await otpStore.hasOTP(email)) {
      // Remove existing OTP
      await otpStore.removeOTP(email);
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Store OTP in memory (10 minutes expiration)
    await otpStore.storeOTP(email, otp, password, 600);

    // Send OTP email
    const emailResult = await sendOTPEmail({
      email,
      otp,
    });

    if (!emailResult.success) {
      // Clean up OTP if email fails
      await otpStore.removeOTP(email);
      return {
        success: false,
        error: "Failed to send OTP email",
      };
    }

    logger.info("PENDING_SIGNUP_CREATED_WITH_OTP", { email });

    return { success: true };
  } catch (error) {
    logger.error("CREATE_PENDING_SIGNUP_ERROR", { error, email });
    return {
      success: false,
      error: "Failed to create pending signup",
    };
  }
};

// Verify OTP and create user
export const verifyOTP = async (
  email: string,
  otp: string
): Promise<AuthResult> => {
  try {
    // Verify OTP from memory store
    const otpResult = await otpStore.verifyOTP(email, otp);

    if (!otpResult.valid) {
      return {
        success: false,
        error: otpResult.error || "Invalid OTP",
      };
    }

    // OTP is valid, create user in Supabase
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email,
        password: otpResult.password!,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      logger.error("SUPABASE_USER_CREATION_ERROR", {
        error: authError,
        email: email,
      });
      return {
        success: false,
        error: "Failed to create user account",
      };
    }

    logger.info("USER_CREATED_SUCCESSFULLY_WITH_OTP", {
      email: email,
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
    return {
      success: false,
      error: "Failed to verify OTP",
    };
  }
};

// Authenticate user
export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

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
    return {
      success: false,
      error: "Authentication failed",
    };
  }
};

// STILL WORKING ON THIS AND BELOW
// Request password reset
export const requestPasswordReset = async (
  email: string
): Promise<AuthResult> => {
  try {
    // Check if user exists
    const { data: users, error: userError } =
      await supabase.auth.admin.listUsers();
    const userExists = users.users?.some((user) => user.email === email);
    if (!userExists) {
      // Return success to prevent email enumeration
      return { success: true };
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.FRONTEND_URL || "http://localhost:8081"
      }/auth/reset-password`,
    });

    if (error) {
      logger.error("PASSWORD_RESET_EMAIL_ERROR", { error, email });
      return {
        success: false,
        error: "Failed to send password reset email",
      };
    }

    logger.info("PASSWORD_RESET_REQUESTED", { email });

    return { success: true };
  } catch (error) {
    logger.error("REQUEST_PASSWORD_RESET_ERROR", { error, email });
    return {
      success: false,
      error: "Failed to request password reset",
    };
  }
};

// Reset password with token
export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
): Promise<AuthResult> => {
  try {
    // For password reset, we need to use the recovery token from Supabase
    // The token should be a recovery token that was sent via email

    // First, we need to verify the recovery token and then update the password
    // This is typically handled by Supabase's built-in flow
    // For now, we'll use the updateUser method, but in a real implementation
    // We need to handle the recovery token differently

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error || !data.user) {
      logger.error("PASSWORD_RESET_ERROR", { error });
      return {
        success: false,
        error:
          "Failed to reset password. Please try requesting a new reset link.",
      };
    }

    logger.info("PASSWORD_RESET_SUCCESSFUL", { email: data.user.email });

    return { success: true };
  } catch (error) {
    logger.error("RESET_PASSWORD_WITH_TOKEN_ERROR", { error });
    return {
      success: false,
      error: "Failed to reset password",
    };
  }
};

// Logout user
export const logoutUser = async (req: Request): Promise<AuthResult> => {
  try {
    // Get session from request headers
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return {
        success: false,
        error: "No valid session found",
      };
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      logger.error("LOGOUT_ERROR", { error });
      return {
        success: false,
        error: "Failed to logout",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("LOGOUT_USER_ERROR", { error });
    return {
      success: false,
      error: "Failed to logout",
    };
  }
};

// Verify session token
export const verifySession = async (token: string): Promise<any> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

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
};

// Get current user data
export const getCurrentUserData = async (req: Request): Promise<AuthResult> => {
  try {
    // Get session from request headers
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return {
        success: false,
        error: "No valid session found",
      };
    }

    // Get user from Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        success: false,
        error: "Invalid session",
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || "",
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  } catch (error) {
    logger.error("GET_CURRENT_USER_DATA_ERROR", { error });
    return {
      success: false,
      error: "Failed to get user data",
    };
  }
};
