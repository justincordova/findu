import { supabase } from "@/lib/supabase";
import logger from "@/config/logger";

// Signup with OTP code, only for .edu emails
export async function signupWithOtpCode(email: string) {
  if (!/^[\w.+-]+@[\w-]+\.edu$/i.test(email)) {
    return { error: "Only .edu emails are allowed." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
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

// Get user profile from Supabase Auth
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    logger.warn("GET_USER_PROFILE_ERROR", { userId, error });
    return null;
  }
  return data.user;
}

// Update user metadata in Supabase Auth
export async function updateUserMetadata(userId: string, metadata: any) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });

  if (error) {
    logger.warn("UPDATE_USER_METADATA_ERROR", { userId, error });
    return { error };
  }

  return { data };
}

// Forgot password: send reset email via Supabase
export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
  });

  if (error) {
    logger.warn("FORGOT_PASSWORD_ERROR", { email, error });
    return { error: error.message };
  }

  return { message: "If that email exists, a reset link has been sent." };
}

// Reset password: verify token and update password via Supabase
export async function resetPassword(token: string, newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    logger.warn("RESET_PASSWORD_ERROR", { error });
    return { error: error.message };
  }

  return { message: "Password has been reset successfully." };
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

// Refresh access token via Supabase
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

// Create user profile in our database after Supabase Auth signup
export async function createUserProfile(
  userId: string,
  profileData: {
    username: string;
    f_name?: string;
    l_name?: string;
    school: string;
    campus?: string;
    bio?: string;
    age?: number;
    birthdate?: Date;
    gender?: string;
    pronouns?: string;
    major?: string;
    grad_year?: number;
    interests?: string[];
    intent?: string;
    looking_for_gender?: string[];
    min_age?: number;
    max_age?: number;
    spotify_url?: string;
    instagram_url?: string;
  }
) {
  // This will be handled by your Prisma client
  // You'll need to import and use your Prisma client here
  // For now, returning a placeholder
  return { userId, profileData };
}
