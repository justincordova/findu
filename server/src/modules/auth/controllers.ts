import { Request, Response } from 'express';
import * as AuthService from './services'; // contains AuthService and OTPService namespaces
import { checkValidationErrors } from '@/utils/handleValidationErrors';
import logger from '@/config/logger';

// POST /auth/signup
export const signupRequestController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email, password } = req.body;
    const result = await AuthService.OTPService.createPendingSignup(email, password);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox and enter the code.',
    });
  } catch (error) {
    logger.error('SIGNUP_REQUEST_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /auth/verify-otp
export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email, otp } = req.body;
    const result = await AuthService.OTPService.verifyOTP(email, otp);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      user: result.user,
    });
  } catch (error) {
    logger.error('OTP_VERIFICATION_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /auth/login
export const loginController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email, password } = req.body;
    const result = await AuthService.AuthService.authenticate(email, password);

    if (!result.success) return res.status(401).json({ success: false, message: result.error });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    logger.error('LOGIN_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /auth/forgot-password
export const requestPasswordResetController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { email } = req.body;
    const result = await AuthService.AuthService.requestPasswordReset(email);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error('PASSWORD_RESET_REQUEST_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /auth/reset-password
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { valid, errors } = checkValidationErrors(req);
    if (!valid) return res.status(400).json({ success: false, errors });

    const { token, password } = req.body;
    const result = await AuthService.AuthService.resetPassword(token, password);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logger.error('PASSWORD_RESET_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /auth/logout
export const logoutController = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.AuthService.logout(req);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('LOGOUT_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /auth/me
export const getCurrentUserController = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.AuthService.getCurrentUser(req);

    if (!result.success) return res.status(401).json({ success: false, message: result.error });

    return res.status(200).json({ success: true, user: result.user });
  } catch (error) {
    logger.error('GET_CURRENT_USER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /auth/user/:id
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'User ID is required' });

    const result = await AuthService.AuthService.deleteUser(id);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('DELETE_USER_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
