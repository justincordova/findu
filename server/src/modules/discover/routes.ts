import { Router } from "express";
import * as DiscoverController from "./controllers"; 
import { 
  validateCompatibilityRequest, 
  validateDiscoveryQuery,
  validateRefreshFeed
} from "./validators";
import * as authMiddleware from "@/middleware/auth/requireAuth";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";

const router = Router();

// Require authentication for all discover routes
router.use(authMiddleware.requireAuth);

// Get discovery feed for authenticated user
router.get(
  "/", 
  validateDiscoveryQuery, 
  handleValidationErrors,
  DiscoverController.getDiscoverFeed
);

// Get eligible candidates for user (admin/debug endpoint)
router.get(
  "/candidates", 
  handleValidationErrors,
  DiscoverController.getEligibleCandidates
);

// Calculate compatibility between two users
router.post(
  "/compatibility", 
  validateCompatibilityRequest, 
  handleValidationErrors,
  DiscoverController.calculateCompatibility
);

// Refresh discovery feed for user
router.post(
  "/refresh", 
  validateRefreshFeed, 
  handleValidationErrors,
  DiscoverController.refreshDiscoverFeed
);

export default router;