import { Router } from "express";
import {
  validateSignupRequest,
  validateOTPVerification,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
} from "./validators";
import {
  signupRequest,
  verifyOTP,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  getCurrentUser,
} from "./controllers";
import { requireAuth } from "@/middleware/auth/requireAuth";

const router = Router();

// Public routes (no authentication required)
router.post("/signup", validateSignupRequest, signupRequest);
router.post("/verify-otp", validateOTPVerification, verifyOTP);
router.post("/login", validateLogin, login);
router.post(
  "/forgot-password",
  validatePasswordResetRequest,
  requestPasswordReset
);
router.post("/reset-password", validatePasswordReset, resetPassword);

// Protected routes (authentication required)
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getCurrentUser);

export default router;
