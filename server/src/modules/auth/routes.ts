import { Router } from "express";
import {
  validateSignupRequest,
  validateEmailVerification,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
} from "./validators";
import {
  signupRequest,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  getCurrentUser,
} from "./controllers";
import { requireSupabaseAuth } from "@/middleware/auth/requireSupabaseAuth";

const router = Router();

// Public routes (no authentication required)
router.post("/signup", validateSignupRequest, signupRequest);
router.post("/verify", validateEmailVerification, verifyEmail);
router.post("/login", validateLogin, login);
router.post(
  "/forgot-password",
  validatePasswordResetRequest,
  requestPasswordReset
);
router.post("/reset-password", validatePasswordReset, resetPassword);

// Protected routes (authentication required)
router.post("/logout", requireSupabaseAuth, logout);
router.get("/me", requireSupabaseAuth, getCurrentUser);

export default router;
