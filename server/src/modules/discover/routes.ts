import { Router } from "express";
import { getDiscoverableUsers, getProfile } from "./controllers";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Require authentication for all discover routes
router.use(authMiddleware.requireAuth);

// Fetch potential matches
router.get("/", getDiscoverableUsers);

// Fetch a single profile by user ID
router.get("/:userId", getProfile);

export default router;
