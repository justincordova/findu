import { Request, Response } from "express";
import * as authService from "@/modules/auth/services";
import { signupWithOtpCode, verifyOtpCode } from "@/modules/auth/services";
import { supabase } from "@/lib/supabase";
import logger from "@/config/logger";

export const requestOtpCodeController = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const { error } = await signupWithOtpCode(email);
  logger.info("OTP_CODE_REQUEST", { email, error });
  if (error) {
    return res.status(400).json({ error });
  }
  return res
    .status(200)
    .json({ message: "Verification code sent to your .edu email." });
};

export const verifyOtpCodeController = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }
  const { data, error } = await verifyOtpCode(email, code);
  logger.info("OTP_CODE_VERIFY", { email, error });
  if (error) {
    return res.status(400).json({
      error:
        typeof error === "string"
          ? error
          : error.message || "Verification failed",
    });
  }
  return res
    .status(200)
    .json({ message: "Email verified", session: data?.session });
};

export const signupController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { password } = req.body;

  if (!user || !user.id || !user.email) {
    logger.warn("SIGNUP_UNAUTHORIZED", { user });
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client not configured" });
  }

  try {
    // Update Supabase user password
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
    });

    if (error) {
      logger.error("SUPABASE_UPDATE_USER_ERROR", {
        userId: user.id,
        error: error.message,
      });
      return res.status(500).json({ error: "Failed to update user password" });
    }

    logger.info("SIGNUP_SUCCESS", {
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({
      message: "Signup complete",
      user: data?.user,
    });
  } catch (error) {
    logger.error("SIGNUP_ERROR", {
      userId: user?.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return res.status(500).json({ error: "Failed to complete signup" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client not configured" });
  }

  try {
    // Use Supabase Auth for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn("LOGIN_FAILURE", { email, error });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    logger.info("LOGIN_SUCCESS", {
      userId: data?.user?.id,
      email,
    });

    return res.status(200).json({
      message: "Login successful",
      session: data?.session,
      user: data?.user,
    });
  } catch (error) {
    logger.warn("LOGIN_ERROR", { email, error });
    return res.status(500).json({ error: "Login failed" });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const result = await authService.forgotPassword(email);
  logger.info("FORGOT_PASSWORD_REQUEST", { email, result });
  return res.status(200).json(result);
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required." });
  }
  const result = await authService.resetPassword(token, newPassword);
  logger.info("RESET_PASSWORD", { token, result });
  return res.status(200).json(result);
};

export const logoutController = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.replace("Bearer ", "");
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required." });
  }
  const result = await authService.logout(accessToken);
  logger.info("LOGOUT", { accessToken: accessToken.substring(0, 10) + "..." });
  return res.status(200).json(result);
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required." });
  }

  try {
    const result = await authService.refreshAccessToken(refreshToken);

    logger.info("TOKEN_REFRESH_SUCCESS", {
      refreshToken: refreshToken.substring(0, 10) + "...",
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    logger.warn("TOKEN_REFRESH_FAILURE", { error });
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};
