import { Router } from "express";
import * as matchesControllers from "./controllers";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Require authentication for all match routes
router.use(authMiddleware.requireAuth);

// Get all matches of the authenticated user
router.get("/", matchesControllers.getMatchesController);

// Get a single match by ID
router.get("/:id", matchesControllers.getMatchByIdController);

// Create a new match manually (usually via LikesService)
router.post("/", matchesControllers.createMatchController);

// Delete a match by ID
router.delete("/:id", matchesControllers.deleteMatchController);

// Optional: Check if two users are matched
router.get("/check/:user1Id/:user2Id", matchesControllers.areUsersMatchedController);

export default router;
