import { Router } from "express";
import multer from "multer";
import { requireAuth } from "@/middleware/auth/requireAuth";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import {
  deleteMessageHandler,
  editMessageHandler,
  getChatHistoryHandler,
  getLatestMessageHandler,
  markAsRead,
  sendMessage,
  uploadMedia,
} from "./controllers";
import {
  validateCreateMessage,
  validateDeleteMessage,
  validateEditMessage,
  validateGetHistory,
  validateMarkRead,
} from "./validators";

const upload = multer({ dest: "/tmp" });

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

// Send a message
router.post(
  "/send",
  validateCreateMessage,
  handleValidationErrors,
  sendMessage,
);

// Get chat history with pagination
router.get(
  "/:match_id/history",
  validateGetHistory,
  handleValidationErrors,
  getChatHistoryHandler,
);

// Get latest message (for unread indicator)
router.get("/:match_id/latest", getLatestMessageHandler);

// Mark messages as read
router.put(
  "/:match_id/read",
  validateMarkRead,
  handleValidationErrors,
  markAsRead,
);

// Edit a message
router.patch(
  "/:message_id",
  validateEditMessage,
  handleValidationErrors,
  editMessageHandler,
);

// Delete a message
router.delete(
  "/:message_id",
  validateDeleteMessage,
  handleValidationErrors,
  deleteMessageHandler,
);

// Upload media
router.post("/:match_id/upload", upload.single("file"), uploadMedia);

export default router;
