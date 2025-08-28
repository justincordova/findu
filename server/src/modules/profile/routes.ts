import { Router } from "express";
import * as profileControllers from "./controllers";
import * as profileValidators from "./validators";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Apply auth middleware
router.use(authMiddleware.requireAuth);

// Profile CRUD routes
router.post("/", profileValidators.validateCreateProfile, profileControllers.createProfileController);
router.get("/me", profileControllers.getMyProfileController);
router.get("/:userId", profileControllers.getProfileController);
router.patch("/:userId", profileValidators.validateUpdateProfile, profileControllers.updateProfileController);
router.delete("/:userId", profileControllers.deleteProfileController);

export default router;
