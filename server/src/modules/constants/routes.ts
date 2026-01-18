import { Router } from "express";
import * as constantsControllers from "./controllers";

const router = Router();

// Public endpoint - no authentication required for constants
router.get("/", constantsControllers.getConstantsController);

export default router;
