import { Router } from "express";
import * as BlocksController from "./controllers";
import * as authMiddleware from "@/middleware/auth/requireAuth";
import { validateBlock } from "./validators";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";

const router = Router();

// Require authentication for all blocks routes
router.use(authMiddleware.requireAuth);

// Block a user
router.post("/", validateBlock, handleValidationErrors, BlocksController.createBlock);

// Unblock a user
router.delete("/:blockedId", BlocksController.unblockUser);

// Get blocked users
router.get("/", BlocksController.getBlockedUsers);

export default router;
