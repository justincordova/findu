import { Router } from "express";
import * as profileControllers from "./controllers";
import * as profileValidators from "./validators";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Require authentication for all profile routes
router.use(authMiddleware.requireAuth);

// Create a new profile
router.post(
  "/",
  profileValidators.validateCreateProfile,
  profileControllers.createProfileController
);

// Get the authenticated user's profile
router.get("/me", profileControllers.getMyProfileController);

// Get another user's profile by ID
router.get("/:userId", profileControllers.getProfileController);

// Update a user's profile by ID
router.patch(
  "/:userId",
  profileValidators.validateUpdateProfile,
  profileControllers.updateProfileController
);

// Delete a user's profile by ID
router.delete("/:userId", profileControllers.deleteProfileController);

export default router;
