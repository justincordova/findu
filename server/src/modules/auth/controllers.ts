import { Request, Response } from "express";
import * as authService from "@/modules/auth/service";
import { signupWithOtpCode, verifyOtpCode } from "@/modules/auth/service";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
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
    return res.status(400).json({ error: error.message || error });
  }
  return res
    .status(200)
    .json({ message: "Email verified", session: data.session });
};

export const signupController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { username, f_name, l_name, password } = req.body;

  if (!user || !user.id || !user.email) {
    logger.warn("SIGNUP_UNAUTHORIZED", { user });
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const existing = await prisma.users.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      logger.warn("SIGNUP_CONFLICT", {
        userId: user.id,
        email: user.email,
      });
      return res.status(409).json({ error: "User already exists" });
    }

    const hashed_password = await bcrypt.hash(password, 12);
    const profile = await prisma.users.create({
      data: {
        id: user.id,
        email: user.email,
        username,
        f_name,
        l_name,
        hashed_password,
      },
    });

    logger.info("SIGNUP_SUCCESS", {
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({ message: "Signup complete", profile });
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

  try {
    const result = await authService.loginUser(prisma, { email, password });

    logger.info("LOGIN_SUCCESS", {
      userId: result.user.id,
      email,
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    logger.warn("LOGIN_FAILURE", { email, error });
    return res.status(401).json({ error: "Invalid credentials" });
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
  const userId = (req as any).user?.id || req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const result = await authService.logout(userId);
  logger.info("LOGOUT", { userId });
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
