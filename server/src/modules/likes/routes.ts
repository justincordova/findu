import { Router } from "express";
import * as LikesController from "./controllers"; 
import { validateLike } from "./validators";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Require authentication for all match routes
router.use(authMiddleware.requireAuth);

router.post("/", validateLike, LikesController.createLike);
router.get("/sent/:userId", LikesController.getSentLikes);
router.get("/received/:userId", LikesController.getReceivedLikes);
router.delete("/:id", LikesController.deleteLike);

export default router;
