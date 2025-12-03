import { Request, Response } from 'express';
import * as UserService from './services';
import logger from '@/config/logger';

// PATCH /users/profile-setup-complete/:userId
export const markProfileSetupCompleteController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    const result = await UserService.UserService.markProfileSetupComplete(userId);

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.status(200).json({ success: true, message: 'Profile setup marked complete' });
  } catch (error) {
    logger.error('MARK_PROFILE_SETUP_COMPLETE_CONTROLLER_ERROR', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
