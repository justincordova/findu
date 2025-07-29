import { Router } from "express";
import {
  createUserValidator,
  idParamValidator,
  updateUserValidator,
} from "./validators";
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
} from "./controllers";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import { authenticateJWT } from "@/middleware/auth/jwtAuth";

const router = Router();

// Route Proteciton (use for all other routes, except auth)
const disableProtection = process.env.DISABLE_USER_ROUTE_PROTECTION === "true";
if (!disableProtection) {
  router.use(authenticateJWT);
}

// User Routes
router.post(
  "/",
  createUserValidator,
  handleValidationErrors,
  createUserController
);
router.get("/", getAllUsersController);
router.get(
  "/:id",
  idParamValidator,
  handleValidationErrors,
  getUserByIdController
);
router.patch(
  "/:id",
  idParamValidator,
  updateUserValidator,
  handleValidationErrors,
  updateUserController
);
router.delete(
  "/:id",
  idParamValidator,
  handleValidationErrors,
  deleteUserController
);

export default router;
