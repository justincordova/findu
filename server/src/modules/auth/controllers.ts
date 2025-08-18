import { Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  createPendingSignup,
  verifyOTP as verifyOTPService,
  authenticateUser,
  requestPasswordReset as requestReset,
  resetPasswordWithToken,
  logoutUser,
  getCurrentUserData,
} from "./services";
import logger from "@/config/logger";

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return false;
  }
  return true;
};

// POST /auth/signup
export const signupRequest = async (req: Request, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    const result = await createPendingSignup(email, password);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "OTP sent to your email. Please check your inbox and enter the code.",
    });
  } catch (error) {
    logger.error("SIGNUP_REQUEST_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /auth/verify-otp
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { email, otp } = req.body;

    const result = await verifyOTPService(email, otp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account created successfully. You can now log in.",
      user: result.user,
    });
  } catch (error) {
    logger.error("OTP_VERIFICATION_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    const result = await authenticateUser(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    logger.error("LOGIN_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /auth/forgot-password
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { email } = req.body;

    const result = await requestReset(email);

    // Always return success to prevent email enumeration
    return res.status(200).json({
      success: true,
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("PASSWORD_RESET_REQUEST_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { token, password } = req.body;

    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error("PASSWORD_RESET_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// POST /auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const result = await logoutUser(req);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("LOGOUT_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /auth/me
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const result = await getCurrentUserData(req);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    logger.error("GET_CURRENT_USER_ERROR", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
