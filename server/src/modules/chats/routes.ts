import { Router } from "express";
import { requireAuth } from "@/middleware/auth/requireAuth";
import {
  sendMessage,
  getChatHistoryHandler,
  markAsRead,
  deleteMessageHandler,
  editMessageHandler,
  getLatestMessageHandler,
} from "./controllers";
import {
  validateCreateMessage,
  validateGetHistory,
  validateDeleteMessage,
  validateEditMessage,
  validateMarkRead,
} from "./validators";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

// Send a message
router.post("/send", validateCreateMessage, handleValidationErrors, sendMessage);

// Get chat history with pagination
router.get("/:match_id/history", validateGetHistory, handleValidationErrors, getChatHistoryHandler);

// Get latest message (for unread indicator)
router.get("/:match_id/latest", getLatestMessageHandler);

// Mark messages as read
router.put("/:match_id/read", validateMarkRead, handleValidationErrors, markAsRead);

// Edit a message
router.patch("/:message_id", validateEditMessage, handleValidationErrors, editMessageHandler);

// Delete a message
router.delete("/:message_id", validateDeleteMessage, handleValidationErrors, deleteMessageHandler);

// Upload media (placeholder - will be fully implemented in Task 5)
// router.post("/:match_id/upload", upload.single("file"), uploadMedia);

export default router;
