import { Request, Response } from "express";
import * as authService from "../services/auth";
import { signupWithOtpCode, verifyOtpCode } from "../services/auth";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import { logAuditEvent } from "../utils/auditLogger";

export const requestOtpCode = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const { error } = await signupWithOtpCode(email);
  logAuditEvent({ action: "OTP_CODE_REQUEST", details: { email, error } });
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
  logAuditEvent({ action: "OTP_CODE_VERIFY", details: { email, error } });
  if (error) {
    return res.status(400).json({ error: error.message || error });
  }
  return res
    .status(200)
    .json({ message: "Email verified", session: data.session });
};

export const signup = async (req: Request, res: Response) => {
  // req.user is set by requireAuth middleware
  const user = (req as any).user;
  const { username, f_name, l_name, password } = req.body;
  if (!user || !user.id || !user.email) {
    logAuditEvent({ action: "SIGNUP_UNAUTHORIZED", details: { user } });
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    // Check if user already exists
    const existing = await prisma.users.findUnique({
      where: { email: user.email },
    });
    if (existing) {
      logAuditEvent({
        action: "SIGNUP_CONFLICT",
        userId: user.id,
        details: { email: user.email },
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
    logAuditEvent({
      action: "SIGNUP_SUCCESS",
      userId: user.id,
      details: { email: user.email },
    });
    return res.status(201).json({ message: "Signup complete", profile });
  } catch (error) {
    logAuditEvent({
      action: "SIGNUP_ERROR",
      userId: user?.id,
      details: { error },
    });
    return res.status(500).json({ error: "Failed to complete signup" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.hashed_password) {
      logAuditEvent({ action: "LOGIN_FAILURE", details: { email } });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.hashed_password);
    if (!valid) {
      logAuditEvent({
        action: "LOGIN_FAILURE",
        userId: user.id,
        details: { email },
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    logAuditEvent({
      action: "LOGIN_SUCCESS",
      userId: user.id,
      details: { email },
    });
    // Issue your own JWT or session here if needed
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        f_name: user.f_name,
        l_name: user.l_name,
      },
    });
  } catch (error) {
    logAuditEvent({ action: "LOGIN_ERROR", details: { email, error } });
    return res.status(500).json({ error: "Failed to login" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const result = await authService.forgotPassword(email);
  logAuditEvent({
    action: "FORGOT_PASSWORD_REQUEST",
    details: { email, result },
  });
  return res.status(200).json(result);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required." });
  }
  const result = await authService.resetPassword(token, newPassword);
  logAuditEvent({ action: "RESET_PASSWORD", details: { token, result } });
  return res.status(200).json(result);
};

export const logout = async (req: Request, res: Response) => {
  // You may want to get userId from req.user if using auth middleware
  const userId = (req as any).user?.id || req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const result = await authService.logout(userId);
  logAuditEvent({ action: "LOGOUT", userId });
  return res.status(200).json(result);
};
