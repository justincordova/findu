
import { generateSignedUploadUrl } from "@/modules/storage/services";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import logger from "@/config/logger";

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
      (supabaseAdmin.storage.from("profiles").list as jest.Mock).mockResolvedValue({ data: [], error: null });
      (supabaseAdmin.storage.from("profiles").createSignedUploadUrl as jest.Mock).mockResolvedValue({
        data: { signedUrl: "signed-url" },
        error: null,
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(supabaseAdmin.storage.from).toHaveBeenCalledWith("profiles");
      expect(supabaseAdmin.storage.from("profiles").list).toHaveBeenCalledWith(userId);
      expect(supabaseAdmin.storage.from("profiles").createSignedUploadUrl).toHaveBeenCalledWith(`${userId}/${filename}`);
      expect(result).toEqual({ uploadUrl: "signed-url", path: `${userId}/${filename}` });
      expect(logger.info).toHaveBeenCalledWith("[generateSignedUploadUrl] Start", { userId, filename, mode: "setup" });
    });

    it("should generate a signed URL in 'update' mode", async () => {
        (supabaseAdmin.storage.from("profiles").remove as jest.Mock).mockResolvedValue({ data: [], error: null });
        (supabaseAdmin.storage.from("profiles").createSignedUploadUrl as jest.Mock).mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        });
  
        const result = await generateSignedUploadUrl(userId, filename, "update");
  
        expect(supabaseAdmin.storage.from).toHaveBeenCalledWith("profiles");
        expect(supabaseAdmin.storage.from("profiles").remove).toHaveBeenCalledWith([`${userId}/${filename}`]);
        expect(supabaseAdmin.storage.from("profiles").createSignedUploadUrl).toHaveBeenCalledWith(`${userId}/${filename}`);
        expect(result).toEqual({ uploadUrl: "signed-url", path: `${userId}/${filename}` });
        expect(logger.info).toHaveBeenCalledWith("[generateSignedUploadUrl] Start", { userId, filename, mode: "update" });
      });

    it("should return an error if Supabase fails to create a signed URL", async () => {
        (supabaseAdmin.storage.from("profiles").list as jest.Mock).mockResolvedValue({ data: [], error: null });
        (supabaseAdmin.storage.from("profiles").createSignedUploadUrl as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error("Supabase error"),
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(result).toEqual({ error: "Supabase error" });
      expect(logger.error).toHaveBeenCalledWith("[generateSignedUploadUrl] Supabase error", {
        error: new Error("Supabase error"),
      });
    });

    it("should handle exceptions gracefully", async () => {
      const error = new Error("Supabase error");
      // Mock createSignedUploadUrl to throw an error that will be caught by the main catch block
      (supabaseAdmin.storage.from("profiles").list as jest.Mock).mockResolvedValue({ data: [], error: null });
      (supabaseAdmin.storage.from("profiles").createSignedUploadUrl as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = await generateSignedUploadUrl(userId, filename, "setup");

      expect(result).toEqual({ error: "Supabase error" });
      expect(logger.error).toHaveBeenCalledWith("[generateSignedUploadUrl] Exception", {
        error,
      });
    });
  });
});
