import { Request } from "express";
import { supabase } from "@/lib/supabase";
import { otpStore } from "@/services/otpStore";
import { sendOTPEmail } from "@/services/emailService";
import logger from "@/config/logger";
import * as authService from "@/modules/auth/services";

jest.mock("@/lib/supabase");
jest.mock("@/services/otpStore");
jest.mock("@/services/emailService");
jest.mock("@/config/logger");

describe("Auth Service", () => {
  const testEmail = "student@university.edu";
  const testPassword = "password123";
  const testOTP = "123456";
  const mockUser = {
    id: "user-id",
    email: testEmail,
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPendingSignup", () => {
    it("should create pending signup successfully", async () => {
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({ data: { users: [] }, error: null });
      (otpStore.hasOTP as jest.Mock).mockResolvedValue(false);
      (otpStore.storeOTP as jest.Mock).mockResolvedValue(undefined);
      (sendOTPEmail as jest.Mock).mockResolvedValue({ success: true });

      const result = await authService.createPendingSignup(testEmail, testPassword);
      expect(result.success).toBe(true);
      expect(otpStore.storeOTP).toHaveBeenCalled();
      expect(sendOTPEmail).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("PENDING_SIGNUP_CREATED_WITH_OTP", expect.any(Object));
    });

    it("should fail if user already exists", async () => {
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({
        data: { users: [{ email: testEmail }] },
        error: null,
      });

      const result = await authService.createPendingSignup(testEmail, testPassword);
      expect(result.success).toBe(false);
      expect(result.error).toBe("User already exists");
    });

    it("should clean up OTP if email fails", async () => {
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({ data: { users: [] }, error: null });
      (otpStore.hasOTP as jest.Mock).mockResolvedValue(false);
      (otpStore.storeOTP as jest.Mock).mockResolvedValue(undefined);
      (sendOTPEmail as jest.Mock).mockResolvedValue({ success: false });

      const result = await authService.createPendingSignup(testEmail, testPassword);
      expect(result.success).toBe(false);
      expect(otpStore.removeOTP).toHaveBeenCalledWith(testEmail);
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP and create user", async () => {
      (otpStore.verifyOTP as jest.Mock).mockResolvedValue({ valid: true, password: testPassword });
      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await authService.verifyOTP(testEmail, testOTP);
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(mockUser.id);
      expect(logger.info).toHaveBeenCalledWith("USER_CREATED_SUCCESSFULLY_WITH_OTP", expect.any(Object));
    });

    it("should return error for invalid OTP", async () => {
      (otpStore.verifyOTP as jest.Mock).mockResolvedValue({ valid: false, error: "Invalid OTP" });

      const result = await authService.verifyOTP(testEmail, testOTP);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid OTP");
    });

    it("should return error if Supabase creation fails", async () => {
      (otpStore.verifyOTP as jest.Mock).mockResolvedValue({ valid: true, password: testPassword });
      (supabase.auth.admin.createUser as jest.Mock).mockResolvedValue({ data: {}, error: "Failed" });

      const result = await authService.verifyOTP(testEmail, testOTP);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create user account");
    });
  });

  describe("authenticateUser", () => {
    it("should login successfully", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const result = await authService.authenticateUser(testEmail, testPassword);
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(mockUser.id);
    });

    it("should fail login with invalid credentials", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: {}, error: "Invalid" });

      const result = await authService.authenticateUser(testEmail, testPassword);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email or password");
    });
  });

  describe("requestPasswordReset", () => {
    it("should succeed if user exists", async () => {
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({ data: { users: [{ email: testEmail }] }, error: null });
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      const result = await authService.requestPasswordReset(testEmail);
      expect(result.success).toBe(true);
    });

    it("should return success if user does not exist (prevent enumeration)", async () => {
      (supabase.auth.admin.listUsers as jest.Mock).mockResolvedValue({ data: { users: [] }, error: null });

      const result = await authService.requestPasswordReset(testEmail);
      expect(result.success).toBe(true);
    });
  });

  describe("getCurrentUserData", () => {
    it("should return user data for valid token", async () => {
      const req = { headers: { authorization: `Bearer token123` } } as Request;
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await authService.getCurrentUserData(req);
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(mockUser.id);
    });

    it("should return error for invalid session", async () => {
      const req = { headers: { authorization: `Bearer token123` } } as Request;
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: "Invalid" });

      const result = await authService.getCurrentUserData(req);
      expect(result.success).toBe(false);
    });
  });
});
