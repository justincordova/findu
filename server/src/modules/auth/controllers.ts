import { Request, Response } from 'express';
import { OTPService, AuthService } from './services';
import { checkValidationErrors } from '@/utils/handleValidationErrors';
import logger from '@/config/logger';

/**
 * Controller to handle sending OTP to a user's email.
 * Validates request, triggers OTPService, and sends proper response.
 *
 * @route POST /auth/send-otp
 * @param req - Express request object, expects `req.body.email`
 * @param res - Express response object
 * @returns JSON response indicating success or error
 */
export const sendOtpController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email } = req.body;
    const result = await OTPService.sendOtp(email);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
    });
  } catch (error) {
    logger.error('SEND_OTP_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Controller to handle user signup with email, password, and OTP verification.
 * Uses AuthService to create the account and automatically sign in the user.
 *
 * @route POST /auth/signup
 * @param req - Express request object, expects `req.body.email`, `req.body.password`, `req.body.otp`
 * @param res - Express response object
 * @returns JSON response with user info and token, or error message
 */
export const signupController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email, password, otp } = req.body;
    const result = await AuthService.signUpAndVerify(email, password, otp);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logger.error('SIGNUP_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Controller to handle user sign-in with email and password.
 * Validates credentials and returns a session token on success.
 *
 * @route POST /auth/signin
 * @param req - Express request object, expects `req.body.email`, `req.body.password`
 * @param res - Express response object
 * @returns JSON response with user info and token, or error message
 */
export const signinController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email, password } = req.body;
    const result = await AuthService.signIn(email, password);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logger.error('SIGNIN_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Controller to refresh an existing session token.
 * Verifies the current token and extends the session if valid.
 *
 * @route POST /auth/refresh-session
 * @param req - Express request object, expects `Authorization` header with Bearer token
 * @param res - Express response object
 * @returns JSON response with refreshed token and user info, or error message
 */
export const refreshSessionController = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const result = await AuthService.refreshSession(token);

    if (!result) {
      return res.status(401).json({ success: false, message: "Invalid or expired session" });
    }

    return res.status(200).json({
      success: true,
      message: 'Session refreshed',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    logger.error('REFRESH_SESSION_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Controller to get the current user's session data based on a token.
 *
 * @route GET /auth/session
 * @param req - Express request object, expects `Authorization` header
 * @param res - Express response object
 * @returns JSON response with user data or error message
 */
export const sessionController = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await AuthService.verifySession(token);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired session" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    logger.error('SESSION_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Controller to handle user sign-out by invalidating the session token.
 *
 * @route POST /auth/signout
 * @param req - Express request object, expects `Authorization` header
 * @param res - Express response object
 * @returns JSON response indicating success
 */
export const signoutController = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Still return 200 to not leak info, but log it.
      logger.warn("SIGNOUT_ATTEMPT_WITHOUT_HEADER");
      return res.status(200).json({ success: true, message: "Signed out" });
    }

    const token = authHeader.replace("Bearer ", "");
    await AuthService.signOut(token);

    return res.status(200).json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    logger.error('SIGNOUT_CONTROLLER_ERROR', { error });
    // Fail gracefully to the client
    return res.status(200).json({ success: true, message: "Signed out" });
  }
};
