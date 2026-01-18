import {
  generateVerificationToken,
  generateOTP,
  hashPassword,
  verifyPassword,
  generateTokenExpiration,
  isTokenExpired,
  extractBearerToken,
} from "@/utils/auth";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

jest.mock("bcrypt");
jest.mock("uuid");

describe("Auth Utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateVerificationToken", () => {
    it("should return a UUID", () => {
      (uuidv4 as jest.Mock).mockReturnValue("test-uuid");
      const result = generateVerificationToken();
      expect(result).toBe("test-uuid");
      expect(uuidv4).toHaveBeenCalled();
    });
  });

  describe("generateOTP", () => {
    it("should return a 6-digit string", () => {
      const result = generateOTP();
      expect(result).toMatch(/^\d{6}$/);
    });
  });

  describe("hashPassword", () => {
    it("should hash password using bcrypt", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      const result = await hashPassword("password");
      expect(result).toBe("hashed-password");
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 12);
    });
  });

  describe("verifyPassword", () => {
    it("should verify password using bcrypt", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await verifyPassword("password", "hash");
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith("password", "hash");
    });
  });

  describe("generateTokenExpiration", () => {
    it("should return expiration date 24 hours from now by default", () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);
      
      const result = generateTokenExpiration();
      
      const expected = new Date(now);
      expected.setSeconds(expected.getSeconds() + 86400);
      
      expect(result).toEqual(expected);
      
      jest.useRealTimers();
    });

    it("should return expiration date with custom seconds", () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);
      
      const result = generateTokenExpiration(3600);
      
      const expected = new Date(now);
      expected.setSeconds(expected.getSeconds() + 3600);
      
      expect(result).toEqual(expected);
      
      jest.useRealTimers();
    });
  });

  describe("isTokenExpired", () => {
    it("should return true if token is expired", () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isTokenExpired(pastDate)).toBe(true);
    });

    it("should return false if token is not expired", () => {
      const futureDate = new Date(Date.now() + 1000);
      expect(isTokenExpired(futureDate)).toBe(false);
    });
  });

  describe("extractBearerToken", () => {
    it("should return token if header is valid", () => {
      const result = extractBearerToken("Bearer token123");
      expect(result).toBe("token123");
    });

    it("should return null if header is missing", () => {
      const result = extractBearerToken(undefined);
      expect(result).toBeNull();
    });

    it("should return null if header does not start with Bearer", () => {
      const result = extractBearerToken("Basic token123");
      expect(result).toBeNull();
    });
  });
});
