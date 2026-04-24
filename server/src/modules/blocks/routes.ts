import { Router } from "express";
import * as authMiddleware from "@/middleware/auth/requireAuth";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import * as BlocksController from "./controllers";
import { validateBlock } from "./validators";

const router = Router();

// Require authentication for all blocks routes
router.use(authMiddleware.requireAuth);

// Block a user
router.post(
  "/",
  validateBlock,
  handleValidationErrors,
  BlocksController.createBlock,
);

// Unblock a user
router.delete("/:blockedId", BlocksController.unblockUser);

// Get blocked users
router.get("/", BlocksController.getBlockedUsers);

export default router;
