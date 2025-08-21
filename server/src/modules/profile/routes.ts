import { Router } from "express";
import {
  createProfileController,
  updateProfileController,
  getProfileController,
  deleteProfileController,
} from "./controllers";
import {
  validateCreateProfile,
  validateUpdateProfile,
} from "./validators";
import { requireAuth } from "@/middleware/auth/requireAuth";

const router = Router();

// Routes
router.use(requireAuth);
router.post("/", validateCreateProfile, createProfileController);
router.get("/:userId", getProfileController);
router.patch("/:userId", validateUpdateProfile, updateProfileController);
router.delete("/:userId", deleteProfileController);

export default router;
