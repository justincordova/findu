import { Router } from "express";
import * as UserController from "./controllers";

const router = Router();

// Mark profile setup as complete
router.patch("/profile-setup-complete/:userId", UserController.markProfileSetupCompleteController);

export default router;
