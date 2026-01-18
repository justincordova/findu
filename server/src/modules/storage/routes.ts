import { Router } from "express";
import { generateUploadUrlController } from "./controllers";
import { validateGenerateUploadUrl } from "./validators";
import * as authMiddleware from "@/middleware/auth/requireAuth";

const router = Router();

// Apply auth middleware
router.use(authMiddleware.requireAuth);

// POST /uploads/url
router.post("/url", validateGenerateUploadUrl, generateUploadUrlController);

export default router;
