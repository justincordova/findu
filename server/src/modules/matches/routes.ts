import { Router } from "express";
import * as matchesControllers from "./controllers";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Require authentication for all match routes
router.use(authMiddleware.requireAuth);

router.get("/", matchesControllers.getMatchesController);
router.get("/:id", matchesControllers.getMatchByIdController);
router.post("/", matchesControllers.createMatchController);
router.delete("/:id", matchesControllers.deleteMatchController);

export default router;
