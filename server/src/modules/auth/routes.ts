import { Router } from "express";
import * as AuthValidators from "./validators";
import * as AuthController from "./controllers";
import { rateLimitOTP } from "@/middleware/auth/rateLimitOTP";

const router = Router();

// Request an OTP for signup (with rate limiting)
router.post(
  "/send-otp",
  rateLimitOTP,
  AuthValidators.validateEmail,
  AuthController.sendOtpController
);

// Signup a new user with OTP
router.post(
  "/signup",
  AuthValidators.validateSignup,
  AuthController.signupController
);

// Signin a user
router.post(
  "/signin",
  AuthValidators.validateLogin,
  AuthController.signinController
);

// Refresh session token (token passed in Authorization header)
router.post("/refresh-session", AuthController.refreshSessionController);

// Get current session user
router.get("/session", AuthController.sessionController);

// Sign out user
router.post("/signout", AuthController.signoutController);

// All authentication routes are explicitly handled by the controllers above.
// This includes custom OTP flow, session management, and signout.

export default router;
