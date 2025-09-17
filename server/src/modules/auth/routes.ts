import { Router } from "express";
import * as AuthValidators from "./validators";
import * as AuthController from "./controllers";
import { requireAuth } from "@/middleware/auth/requireAuth";

const router = Router();

// Signup a new user
router.post(
  "/signup",
  AuthValidators.validateSignupRequest,
  AuthController.signupRequestController
);

// Verify OTP for signup or login
router.post(
  "/verify-otp",
  AuthValidators.validateOTPVerification,
  AuthController.verifyOTPController
);

// Login a user
router.post(
  "/login",
  AuthValidators.validateLogin,
  AuthController.loginController
);

// Request a password reset
router.post(
  "/forgot-password",
  AuthValidators.validatePasswordResetRequest,
  AuthController.requestPasswordResetController
);

// Reset password using token
router.post(
  "/reset-password",
  AuthValidators.validatePasswordReset,
  AuthController.resetPasswordController
);

// Logout the current user
router.post("/logout", requireAuth, AuthController.logoutController);

// Get the currently authenticated user's profile
router.get("/me", requireAuth, AuthController.getCurrentUserController);

// Delete a user account
router.delete("/user/:id", requireAuth, AuthController.deleteUserController);

export default router;
