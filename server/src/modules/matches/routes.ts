import { Router } from "express";
import * as authMiddleware from "@/middleware/auth/requireAuth";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import * as matchesControllers from "./controllers";
import {
  validateCheckMatch,
  validateCreateMatch,
  validateMatchId,
} from "./validators";

const router = Router();

// Require authentication for all match routes
router.use(authMiddleware.requireAuth);

// Get all matches of the authenticated user
router.get("/", matchesControllers.getMatchesController);

// Get a single match by ID
router.get(
  "/:id",
  validateMatchId,
  handleValidationErrors,
  matchesControllers.getMatchByIdController,
);

// Create a new match manually (usually via LikesService)
router.post(
  "/",
  validateCreateMatch,
  handleValidationErrors,
  matchesControllers.createMatchController,
);

// Delete a match by ID
router.delete(
  "/:id",
  validateMatchId,
  handleValidationErrors,
  matchesControllers.deleteMatchController,
);

// Optional: Check if two users are matched
router.get(
  "/check/:user1Id/:user2Id",
  validateCheckMatch,
  handleValidationErrors,
  matchesControllers.areUsersMatchedController,
);

export default router;
