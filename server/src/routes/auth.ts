import { Router } from "express";
import {
  requestOtpCode,
  verifyOtpCodeController,
  signup,
  login,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/auth";
import {
  validateEmailOnly,
  validateSignup,
  validateLogin,
} from "../validators/auth";
import { handleValidationErrors } from "../middleware/handleValidationErrors";
import { requireSupabaseAuth } from "../middleware/requireSupabaseAuth";

const router = Router();

// POST /auth/verify-email - Send OTP code to .edu email
router.post(
  "/verify-email",
  validateEmailOnly,
  handleValidationErrors,
  requestOtpCode
);

// POST /auth/verify-code - Verify 6-digit OTP code
router.post("/verify-code", handleValidationErrors, verifyOtpCodeController);

// POST /auth/signup - Complete signup, requires valid session
router.post(
  "/signup",
  requireSupabaseAuth,
  validateSignup,
  handleValidationErrors,
  signup
);

// POST /auth/login - Login with email and password
router.post("/login", validateLogin, handleValidationErrors, login);

// POST /auth/logout - Logout user
router.post("/logout", logout);

// POST /auth/forgot-password - Initiate password reset
router.post("/forgot-password", forgotPassword);

// POST /auth/reset-password - Complete password reset
router.post("/reset-password", resetPassword);

export default router;
