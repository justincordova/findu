import logger from "@/config/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSignedUploadUrl } from "@/modules/storage/services";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn().mockReturnThis(),
      createSignedUploadUrl: jest.fn(),
      list: jest.fn(),
      remove: jest.fn(),
    },
  },
}));
jest.mock("@/config/logger");

describe("Storage Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateSignedUploadUrl", () => {
    const userId = "user123";
    const filename = "avatar.png";

    it("should generate a signed URL in 'setup' mode", async () => {
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({ data: [], error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(supabaseAdmin.storage.from).toHaveBeenCalledWith("profiles");
      expect(supabaseAdmin.storage.from("profiles").list).toHaveBeenCalledWith(
        userId,
      );
      expect(
        supabaseAdmin.storage.from("profiles").createSignedUploadUrl,
      ).toHaveBeenCalledWith(`${userId}/${filename}`);
      expect(result).toEqual({
        uploadUrl: "signed-url",
        path: `${userId}/${filename}`,
      });
      expect(logger.info).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Start",
        { userId, filename, mode: "setup" },
      );
    });

    it("should delete existing files in 'setup' mode", async () => {
      const existingFiles = [{ name: "old_avatar.png" }];
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({
        data: existingFiles,
        error: null,
      });
      (
        supabaseAdmin.storage.from("profiles").remove as jest.Mock
      ).mockResolvedValue({ data: {}, error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      await generateSignedUploadUrl(userId, filename, "setup");

      expect(supabaseAdmin.storage.from("profiles").list).toHaveBeenCalledWith(
        userId,
      );
      expect(
        supabaseAdmin.storage.from("profiles").remove,
      ).toHaveBeenCalledWith([`${userId}/old_avatar.png`]);
    });

    it("should return an error if listing files fails in 'setup' mode", async () => {
      const listError = new Error("List error");
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({
        data: null,
        error: listError,
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(result).toEqual({ error: "List error" });
      expect(logger.error).toHaveBeenCalledWith(
        "[deleteAllUserFiles] Error listing files",
        {
          userId,
          error: listError,
        },
      );
    });

    it("should return an error if removing files fails in 'setup' mode", async () => {
      const removeError = new Error("Remove error");
      const existingFiles = [{ name: "old_avatar.png" }];
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({
        data: existingFiles,
        error: null,
      });
      (
        supabaseAdmin.storage.from("profiles").remove as jest.Mock
      ).mockResolvedValue({
        data: null,
        error: removeError,
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(result).toEqual({ error: "Remove error" });
      expect(logger.error).toHaveBeenCalledWith(
        "[deleteAllUserFiles] Error removing files",
        {
          userId,
          removeError,
        },
      );
    });

    it("should generate a signed URL in 'update' mode", async () => {
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({ data: [{ name: "avatar.png" }], error: null });
      (
        supabaseAdmin.storage.from("profiles").remove as jest.Mock
      ).mockResolvedValue({ data: {}, error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(userId, filename, "update");

      expect(supabaseAdmin.storage.from).toHaveBeenCalledWith("profiles");
      expect(supabaseAdmin.storage.from("profiles").list).toHaveBeenCalledWith(
        userId,
      );
      expect(
        supabaseAdmin.storage.from("profiles").remove,
      ).toHaveBeenCalledWith([`${userId}/${filename}`]);
      expect(
        supabaseAdmin.storage.from("profiles").createSignedUploadUrl,
      ).toHaveBeenCalledWith(`${userId}/${filename}`);
      expect(result).toEqual({
        uploadUrl: "signed-url",
        path: `${userId}/${filename}`,
      });
      expect(logger.info).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Start",
        { userId, filename, mode: "update" },
      );
    });

    it("should handle error when deleting a single file fails in 'update' mode", async () => {
      const removeError = new Error("Remove error");
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({
        data: [{ name: "avatar.png" }],
        error: null,
      });
      (
        supabaseAdmin.storage.from("profiles").remove as jest.Mock
      ).mockResolvedValue({
        data: null,
        error: removeError,
      });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(userId, filename, "update");

      expect(result).toEqual({
        uploadUrl: "signed-url",
        path: `${userId}/${filename}`,
      });
      expect(logger.error).toHaveBeenCalledWith(
        "[deleteSingleUserFile] Failed to delete file",
        {
          path: `${userId}/${filename}`,
          error: removeError,
        },
      );
    });

    it("should handle exceptions in 'update' mode and still proceed", async () => {
      const removeError = new Error("Forced exception");
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockImplementation(() => {
        throw removeError;
      });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(userId, filename, "update");

      expect(result).toEqual({
        uploadUrl: "signed-url",
        path: `${userId}/${filename}`,
      });
      expect(logger.error).toHaveBeenCalledWith(
        "[deleteSingleUserFile] Exception",
        {
          error: removeError,
        },
      );
    });

    it("should return an error if Supabase fails to create a signed URL", async () => {
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({ data: [], error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: null,
        error: new Error("Supabase error"),
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(result).toEqual({ error: "Supabase error" });
      expect(logger.error).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Supabase error",
        {
          error: new Error("Supabase error"),
        },
      );
    });

    it("should return an error if Supabase fails to create a signed URL in 'update' mode", async () => {
      (
        supabaseAdmin.storage.from("profiles").remove as jest.Mock
      ).mockResolvedValue({ data: [], error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: null,
        error: new Error("Supabase error"),
      });

      const result = await generateSignedUploadUrl(userId, filename, "update");

      expect(result).toEqual({ error: "Supabase error" });
      expect(logger.error).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Supabase error",
        {
          error: new Error("Supabase error"),
        },
      );
    });

    it("should handle exceptions gracefully", async () => {
      const error = new Error("Supabase error");
      // Mock createSignedUploadUrl to throw an error that will be caught by the main catch block
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({ data: [], error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockImplementation(() => {
        throw error;
      });
      const result = await generateSignedUploadUrl(userId, filename, "setup");
      expect(result).toEqual({ error: "Supabase error" });
      expect(logger.error).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Exception",
        {
          error,
        },
      );
    });

    it("should handle exceptions without a message gracefully", async () => {
      const error = "Unknown error";
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockImplementation(() => {
        throw error;
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(result).toEqual({ error: "Unknown error creating upload URL" });
      expect(logger.error).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Exception",
        {
          error,
        },
      );
    });

    it("should handle extension mismatch when updating a file in 'update' mode", async () => {
      // User has photo_3.jpg, uploading new photo_3.png should delete the .jpg
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({
        data: [{ name: "photo_3.jpg" }],
        error: null,
      });
      (
        supabaseAdmin.storage.from("profiles").remove as jest.Mock
      ).mockResolvedValue({ data: {}, error: null });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(
        userId,
        "photo_3.png",
        "update",
      );

      // Should have deleted the .jpg file found by base name match
      expect(
        supabaseAdmin.storage.from("profiles").remove,
      ).toHaveBeenCalledWith([`${userId}/photo_3.jpg`]);
      expect(result).toEqual({
        uploadUrl: "signed-url",
        path: `${userId}/photo_3.png`,
      });
    });

    it("should handle missing file gracefully when no file with base name exists", async () => {
      (
        supabaseAdmin.storage.from("profiles").list as jest.Mock
      ).mockResolvedValue({
        data: [{ name: "avatar.jpg" }],
        error: null,
      });
      (
        supabaseAdmin.storage.from("profiles")
          .createSignedUploadUrl as jest.Mock
      ).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(
        userId,
        "photo_1.png",
        "update",
      );

      // Should not call remove since no photo_1 file exists
      expect(
        supabaseAdmin.storage.from("profiles").remove,
      ).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "[deleteSingleUserFile] No existing file found to delete",
        { userId, baseFilename: "photo_1" },
      );
      expect(result).toEqual({
        uploadUrl: "signed-url",
        path: `${userId}/photo_1.png`,
      });
    });
  });
});
