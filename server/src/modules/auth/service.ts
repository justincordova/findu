import { supabase } from "@/lib/supabase";
import logger from "@/config/logger";

// Signup with OTP code, only for .edu emails
export async function signupWithOtpCode(email: string) {
  if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
    return { error: "Only .edu emails are allowed." };
  }

  // Check if user already exists by trying to get user by email
  try {
    // Get all users and check if email exists
    const { data: existingUsers, error: getUserError } =
      await supabase.auth.admin.listUsers();

    if (getUserError) {
      logger.error("CHECK_EXISTING_USER_ERROR", { email, error: getUserError });
      return { error: "Failed to check existing user" };
    }

    // Check if user with this email already exists
    const userExists = existingUsers.users.some((user) => user.email === email);

    if (userExists) {
      return {
        error:
          "An account with this email already exists. Please login instead.",
      };
    }
  } catch (error) {
    logger.error("CHECK_EXISTING_USER_ERROR", { email, error });
    return { error: "Failed to check existing user" };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Short duration for email verification
      emailRedirectTo: `${
        process.env.FRONTEND_URL || "http://localhost:8081"
      }/auth/verify-email`,
    },
  });

  return { error };
}

// Verify 6-digit OTP code and get session
export async function verifyOtpCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  return { data, error };
}

// Verify Supabase session (for protected routes)
export async function verifySession(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    logger.warn("SUPABASE_SESSION_ERROR", { error });
    return null;
  }
  return data.user;
}

// Forgot password: send reset email via Supabase
export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.FRONTEND_URL || "http://localhost:8081"
    }/auth/reset-password`,
  });

  if (error) {
    logger.warn("FORGOT_PASSWORD_ERROR", { email, error });
    return { error: error.message };
  }

  return { message: "If that email exists, a reset link has been sent." };
}

// Reset password: verify token and update password via Supabase
export async function resetPassword(token: string, newPassword: string) {
  try {
    // First verify the token by attempting to get user
    const {
      data: { user },
      error: verifyError,
    } = await supabase.auth.getUser(token);

    if (verifyError || !user) {
      return { error: "Invalid or expired reset token" };
    }

    // Update the user's password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      logger.warn("RESET_PASSWORD_ERROR", { error });
      return { error: error.message };
    }

    return { message: "Password has been reset successfully." };
  } catch (error) {
    logger.warn("RESET_PASSWORD_ERROR", { error });
    return { error: "Failed to reset password" };
  }
}

// Logout: sign out from Supabase
export async function logout(accessToken: string) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.warn("LOGOUT_ERROR", { error });
    return { error: error.message };
  }

  return { message: "Logged out successfully." };
}

// Refresh access token via Supabase (for long-term sessions)
export async function refreshAccessToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    logger.warn("REFRESH_TOKEN_ERROR", { error });
    throw new Error("Invalid or expired refresh token");
  }

  return {
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
  };
}
