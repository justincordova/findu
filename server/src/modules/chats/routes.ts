import { Router } from 'express';
import * as ChatsController from '@/modules/chats/controllers';
import { requireAuth } from '@/middleware';

const router = Router();

router.get('/', requireAuth, ChatsController.getConversations); 
router.get('/:matchId/messages', requireAuth, ChatsController.getMessages); 
router.post('/:matchId/messages', requireAuth, ChatsController.sendMessage);
router.patch('/:matchId/read', requireAuth, ChatsController.markAsRead);
router.delete('/messages/:messageId', requireAuth, ChatsController.deleteMessage);

export default router;