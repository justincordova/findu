import { Router } from "express";
import {
  requestMagicLink,
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

// POST /auth/verify - Send magic link to .edu email
router.post(
  "/verify",
  validateEmailOnly,
  handleValidationErrors,
  requestMagicLink
);

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
