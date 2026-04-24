import { body } from "express-validator";

// Allowed image MIME types for profile photos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// Maximum file size: 10MB
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateGenerateUploadUrl = [
  body("filename")
    .isString()
    .notEmpty()
    .withMessage("Filename is required")
    .custom((filename) => {
      // Extract file extension
      const ext = filename.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(
          `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        );
      }
      return true;
    }),
  body("mimeType")
    .isString()
    .notEmpty()
    .withMessage("MIME type is required")
    .custom((mimeType) => {
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new Error(
          `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
        );
      }
      return true;
    }),
  body("fileSize")
    .isInt({ min: 1, max: MAX_FILE_SIZE_BYTES })
    .withMessage(`File size must be between 1 byte and ${MAX_FILE_SIZE_MB}MB`),
];
