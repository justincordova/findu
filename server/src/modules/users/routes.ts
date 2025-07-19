import { Router } from "express";
import {
  createUserValidator,
  idParamValidator,
  updateUserValidator,
} from "./validator";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "./controller";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import { requireSupabaseAuth } from "@/middleware/auth/requireSupabaseAuth";

const router = Router();

const disableProtection = process.env.DISABLE_USER_ROUTE_PROTECTION === "true";

if (!disableProtection) {
  router.use(requireSupabaseAuth);
}

// For creating user
router.post("/", createUserValidator, handleValidationErrors, createUser);

// For getting all users
router.get("/", getAllUsers);

// For getting a user by id
router.get("/:id", idParamValidator, handleValidationErrors, getUserById);

// For updating user
router.patch(
  "/:id",
  idParamValidator,
  updateUserValidator,
  handleValidationErrors,
  updateUser
);

// For deleting user
router.delete("/:id", idParamValidator, handleValidationErrors, deleteUser);

export default router;
