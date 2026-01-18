import { Router } from "express";
import * as LikesController from "./controllers"; 
import { validateLike } from "./validators";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Require authentication for all likes routes
router.use(authMiddleware.requireAuth);

// Create a like or superlike
router.post("/", validateLike, LikesController.createLike);

// Get all likes sent by the authenticated user
router.get("/sent/:userId", LikesController.getSentLikes);

// Get all likes received by the authenticated user
router.get("/received/:userId", LikesController.getReceivedLikes);

// Delete a like (requires userId for authorization)
router.delete("/:id", LikesController.deleteLike);

export default router;
