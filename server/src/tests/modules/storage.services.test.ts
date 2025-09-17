import { generateSignedUploadUrl } from "@/modules/storage/services";

// Mock Supabase Admin client to avoid real env variables
jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn().mockReturnValue({
        createSignedUploadUrl: jest.fn(),
      }),
    },
  },
}));

// Mock logger so tests don’t write to console
jest.mock("@/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import logger from "@/config/logger";

const mockUserId = "user-123";
const mockFilename = "profile.png";
const mockSignedUrl = "https://signed.url/upload";

describe("Storage API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.Date, "now").mockReturnValue(123456789);
  });

  describe("Storage API happy path cases", () => {
    it("should return signed URL and path when Supabase succeeds", async () => {
      const mockPath = `${mockUserId}/123456789-${mockFilename}`;
      (supabaseAdmin.storage.from as jest.Mock).mockReturnValue({
        createSignedUploadUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: mockSignedUrl },
          error: null,
        }),
      });

      const result = await generateSignedUploadUrl(mockUserId, mockFilename);

      if ("error" in result) throw new Error("Expected success, got error");

      expect(result).toEqual({ uploadUrl: mockSignedUrl, path: mockPath });
      expect(logger.info).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Start",
        { userId: mockUserId, filename: mockFilename }
      );
      expect(logger.info).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Object path",
        { objectPath: mockPath }
      );
      expect(logger.info).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Signed URL created",
        { uploadUrl: mockSignedUrl, path: mockPath }
      );
    });
  });

  describe("Storage API edge & failure cases", () => {
    it("should return error if Supabase returns an error", async () => {
      const mockError = { message: "Supabase failed" };
      (supabaseAdmin.storage.from as jest.Mock).mockReturnValue({
        createSignedUploadUrl: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      const result = await generateSignedUploadUrl(mockUserId, mockFilename);

      if (!("error" in result)) throw new Error("Expected error, got success");

      expect(result.error).toEqual(mockError.message);
      expect(logger.error).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Supabase error",
        { error: mockError }
      );
    });

    it("should return error if function throws an exception", async () => {
      const mockException = new Error("Unexpected exception");
      (supabaseAdmin.storage.from as jest.Mock).mockImplementation(() => {
        throw mockException;
      });

      const result = await generateSignedUploadUrl(mockUserId, mockFilename);

      if (!("error" in result)) throw new Error("Expected error, got success");

      expect(result.error).toEqual(mockException.message);
      expect(logger.error).toHaveBeenCalledWith(
        "[generateSignedUploadUrl] Exception",
        { error: mockException }
      );
    });

    it("should return error for empty userId or filename", async () => {
      const result = await generateSignedUploadUrl("", "");

      if (!("error" in result)) throw new Error("Expected error, got success");

      expect(typeof result.error).toBe("string");
    });
  });
});
