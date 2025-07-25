import { Router } from "express";
import {
  requestOtpCodeController,
  verifyOtpCodeController,
  signupController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  logoutController,
} from "./controllers";
import { validateEmailOnly, validateSignup, validateLogin } from "./validators";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import { requireSupabaseAuth } from "@/middleware/auth/requireSupabaseAuth";

const router = Router();

// Auth Routes
router.post(
  "/send-otp",
  validateEmailOnly,
  handleValidationErrors,
  requestOtpCodeController
);
router.post("/verify-otp", handleValidationErrors, verifyOtpCodeController);
router.post(
  "/signup",
  requireSupabaseAuth,
  validateSignup,
  handleValidationErrors,
  signupController
);
router.post("/login", validateLogin, handleValidationErrors, loginController);
router.post("/logout", logoutController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;
