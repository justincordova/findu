import { Router } from "express";
import * as AuthValidators from "./validators";
import * as AuthController from "./controllers";
import { requireAuth } from "@/middleware/auth/requireAuth";

const router = Router();

// Public routes (no authentication required)
router.post("/signup", AuthValidators.validateSignupRequest, AuthController.signupRequestController);
router.post("/verify-otp", AuthValidators.validateOTPVerification, AuthController.verifyOTPController);
router.post("/login", AuthValidators.validateLogin, AuthController.loginController);
router.post(
  "/forgot-password",
  AuthValidators.validatePasswordResetRequest,
  AuthController.requestPasswordResetController
);
router.post("/reset-password", AuthValidators.validatePasswordReset, AuthController.resetPasswordController);

// Protected routes (authentication required)
router.post("/logout", requireAuth, AuthController.logoutController);
router.get("/me", requireAuth, AuthController.getCurrentUserController);

// Delete user route (protected)
router.delete("/user/:id", requireAuth, AuthController.deleteUserController);

export default router;
