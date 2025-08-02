import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@/types/User";
import { supabase } from "@/lib/supabase";
import logger from "@/config/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret";

export async function signupUser(
  prisma: any,
  {
    email,
    username,
    f_name,
    l_name,
    password,
  }: {
    email: string;
    username: string;
    f_name: string;
    l_name: string;
    password: string;
  }
): Promise<Omit<User, "hashed_password">> {
  // Check if email or username exists
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });
  if (existingUser) {
    throw new Error("Email or username already in use");
  }

  // Hash password
  const hashed_password = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.users.create({
    data: {
      email,
      username,
      f_name,
      l_name,
      hashed_password,
    },
  });

  // Return user data without hashed_password
  const { hashed_password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function loginUser(
  prisma: any,
  { email, password }: { email: string; password: string }
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "hashed_password">;
}> {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid email or password");

  const validPassword = await bcrypt.compare(
    password,
    user.hashed_password || ""
  );
  if (!validPassword) throw new Error("Invalid email or password");

  // Generate access token (short-lived: 1 hour)
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Generate refresh token (long-lived: 1 year)
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    REFRESH_SECRET,
    { expiresIn: "1y" }
  );

  const { hashed_password: _, ...userWithoutPassword } = user;
  return { accessToken, refreshToken, user: userWithoutPassword };
}

// Refresh access token using refresh token
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate new refresh token (extend the session)
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      REFRESH_SECRET,
      { expiresIn: "1y" }
    );

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}

// Verify access token
export async function verifyAccessToken(accessToken: string) {
  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

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

// Forgot password: send reset email (stub)
export async function forgotPassword(email: string) {
  // TODO: Implement email sending logic
  // For now, just simulate success
  return { message: "If that email exists, a reset link has been sent." };
}

// Reset password: verify token and update password (stub)
export async function resetPassword(token: string, newPassword: string) {
  // TODO: Implement token verification and password update logic
  // For now, just simulate success
  return { message: "Password has been reset successfully." };
}

// Logout: revoke refresh token or session (stub)
export async function logout(userId: string) {
  // TODO: Implement token/session revocation logic
  // For now, just simulate success
  return { message: "Logged out successfully." };
}
